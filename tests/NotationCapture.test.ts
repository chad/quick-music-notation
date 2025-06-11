import { NotationCapture } from '../src/core/NotationCapture';
import { NotationCaptureOptions } from '../src/types/config';
import { 
  NoteAddedEvent, 
  FragmentCommittedEvent, 
  ModeChangedEvent,
  ModifierChangedEvent,
  ErrorEvent
} from '../src/types/events';

// Mock the renderer
jest.mock('../src/rendering/PreviewRenderer');

describe('NotationCapture', () => {
  let notationCapture: NotationCapture;
  let mockContainer: HTMLElement;
  let onFragmentCommit: jest.Mock;

  beforeEach(() => {
    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.id = 'test-container';
    document.body.appendChild(mockContainer);

    onFragmentCommit = jest.fn();

    const options: NotationCaptureOptions = {
      container: mockContainer,
      renderer: 'vexflow',
      onFragmentCommit,
      debug: false
    };

    notationCapture = new NotationCapture(options);
  });

  afterEach(() => {
    notationCapture.destroy();
    document.body.removeChild(mockContainer);
  });

  describe('Initialization', () => {
    it('should initialize in STOPPED mode', () => {
      expect(notationCapture.getMode()).toBe('STOPPED');
    });

    it('should accept selector string for container', () => {
      const nc = new NotationCapture({
        container: '#test-container',
        renderer: 'vexflow'
      });
      
      expect(nc).toBeDefined();
      nc.destroy();
    });
  });

  describe('Mode Management', () => {
    it('should start capturing', () => {
      const modeChangedHandler = jest.fn();
      notationCapture.on('modeChanged', modeChangedHandler);

      notationCapture.start();

      expect(notationCapture.getMode()).toBe('CAPTURE');
      expect(modeChangedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'modeChanged',
          previousMode: 'STOPPED',
          newMode: 'CAPTURE'
        })
      );
    });

    it('should stop capturing', () => {
      notationCapture.start();
      notationCapture.stop();

      expect(notationCapture.getMode()).toBe('STOPPED');
    });

    it('should pause and resume', () => {
      notationCapture.start();
      notationCapture.pause();

      expect(notationCapture.getMode()).toBe('PAUSED');

      notationCapture.resume();
      expect(notationCapture.getMode()).toBe('CAPTURE');
    });

    it('should not pause when already stopped', () => {
      const initialMode = notationCapture.getMode();
      notationCapture.pause();
      expect(notationCapture.getMode()).toBe(initialMode);
    });

    it('should only resume from paused state', () => {
      notationCapture.start();
      const captureMode = notationCapture.getMode();
      notationCapture.resume(); // Should do nothing
      expect(notationCapture.getMode()).toBe(captureMode);
    });
  });

  describe('Fragment Management', () => {
    beforeEach(() => {
      notationCapture.start();
    });

    it('should clear fragment', () => {
      const clearHandler = jest.fn();
      notationCapture.on('fragmentCleared', clearHandler);

      notationCapture.clear();

      expect(clearHandler).toHaveBeenCalled();
      const fragment = notationCapture.getCurrentFragment();
      expect(fragment.elements).toHaveLength(0);
    });

    it('should commit fragment', async () => {
      const commitHandler = jest.fn();
      notationCapture.on('fragmentCommitted', commitHandler);

      // Add a note first
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC'
      });
      document.dispatchEvent(keyEvent);

      await notationCapture.commit();

      expect(commitHandler).toHaveBeenCalled();
      expect(onFragmentCommit).toHaveBeenCalled();
    });

    it('should not commit empty fragment', async () => {
      const errorHandler = jest.fn();
      notationCapture.on('error', errorHandler);

      await notationCapture.commit();

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          error: expect.objectContaining({
            code: 'EMPTY_FRAGMENT'
          })
        })
      );
      expect(onFragmentCommit).not.toHaveBeenCalled();
    });

    it('should handle commit handler errors', async () => {
      const errorHandler = jest.fn();
      notationCapture.on('error', errorHandler);
      
      onFragmentCommit.mockRejectedValue(new Error('Network error'));

      // Add a note
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC'
      });
      document.dispatchEvent(keyEvent);

      await notationCapture.commit();

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'COMMIT_HANDLER_ERROR'
          })
        })
      );
    });

    it('should get current fragment', () => {
      const fragment = notationCapture.getCurrentFragment();
      
      expect(fragment).toMatchObject({
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: []
      });
    });

    it('should get committed fragments', () => {
      const fragments = notationCapture.getCommittedFragments();
      expect(Array.isArray(fragments)).toBe(true);
    });
  });

  describe('Musical Element Input', () => {
    beforeEach(() => {
      notationCapture.start();
    });

    it('should add notes via keyboard', () => {
      const noteAddedHandler = jest.fn();
      notationCapture.on('noteAdded', noteAddedHandler);

      const keyEvent = new KeyboardEvent('keydown', {
        key: 'd',
        code: 'KeyD'
      });
      document.dispatchEvent(keyEvent);

      expect(noteAddedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'noteAdded',
          note: expect.objectContaining({
            type: 'note',
            pitch: 'D4'
          })
        })
      );
    });

    it('should handle modifier changes', () => {
      const modifierHandler = jest.fn();
      notationCapture.on('modifierChanged', modifierHandler);

      // Change duration
      const keyEvent = new KeyboardEvent('keydown', {
        key: '2',
        code: 'Digit2'
      });
      document.dispatchEvent(keyEvent);

      expect(modifierHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'modifierChanged',
          modifier: expect.objectContaining({
            duration: 'half'
          })
        })
      );
    });

    it('should delete last element', () => {
      const deleteHandler = jest.fn();
      notationCapture.on('elementDeleted', deleteHandler);

      // Add a note first
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'e',
        code: 'KeyE'
      }));

      // Delete it
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Backspace',
        code: 'Backspace'
      }));

      expect(deleteHandler).toHaveBeenCalled();
    });

    it('should add rests', () => {
      const fragment = notationCapture.getCurrentFragment();
      const initialLength = fragment.elements.length;

      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space'
      }));

      const updatedFragment = notationCapture.getCurrentFragment();
      expect(updatedFragment.elements.length).toBe(initialLength + 1);
      expect(updatedFragment.elements[initialLength].type).toBe('rest');
    });

    it('should handle chord mode', () => {
      // Enter chord mode with Ctrl+C
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC',
        ctrlKey: true
      }));

      expect(notationCapture.getMode()).toBe('CHORD_MODE');

      // Add more notes
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'e',
        code: 'KeyE'
      }));

      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'g',
        code: 'KeyG'
      }));

      // Complete chord
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter'
      }));

      const fragment = notationCapture.getCurrentFragment();
      const lastElement = fragment.elements[fragment.elements.length - 1];
      
      expect(lastElement.type).toBe('chord');
      expect(lastElement.pitches).toContain('C4');
      expect(lastElement.pitches).toContain('E4');
      expect(lastElement.pitches).toContain('G4');
    });
  });

  describe('Configuration', () => {
    it('should set time signature', () => {
      notationCapture.setTimeSignature(3, 4);
      const fragment = notationCapture.getCurrentFragment();
      
      expect(fragment.timeSignature).toEqual({
        numerator: 3,
        denominator: 4
      });
    });

    it('should set key signature', () => {
      notationCapture.setKeySignature('G', 'major');
      const fragment = notationCapture.getCurrentFragment();
      
      expect(fragment.keySignature).toEqual({
        key: 'G',
        mode: 'major'
      });
    });

    it('should set tempo', () => {
      notationCapture.setTempo(140);
      const fragment = notationCapture.getCurrentFragment();
      
      expect(fragment.tempo).toBe(140);
    });

    it('should get current state', () => {
      const state = notationCapture.getCurrentState();
      
      expect(state).toMatchObject({
        duration: 'quarter',
        octave: 4,
        isDotted: false,
        isTriplet: false
      });
    });
  });

  describe('Undo/Redo', () => {
    beforeEach(() => {
      notationCapture.start();
    });

    it('should undo last action', () => {
      // Add a note
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'f',
        code: 'KeyF'
      }));

      const fragmentBefore = notationCapture.getCurrentFragment();
      expect(fragmentBefore.elements).toHaveLength(1);

      notationCapture.undo();

      const fragmentAfter = notationCapture.getCurrentFragment();
      expect(fragmentAfter.elements).toHaveLength(0);
    });

    it('should redo after undo', () => {
      // Add a note
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'g',
        code: 'KeyG'
      }));

      notationCapture.undo();
      notationCapture.redo();

      const fragment = notationCapture.getCurrentFragment();
      expect(fragment.elements).toHaveLength(1);
      expect(fragment.elements[0].pitch).toBe('G4');
    });
  });

  describe('Error Handling', () => {
    it('should emit errors for invalid input', () => {
      const errorHandler = jest.fn();
      notationCapture.on('error', errorHandler);

      notationCapture.start();

      // Try to go below octave 0
      for (let i = 0; i < 5; i++) {
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'ArrowDown',
          code: 'ArrowDown'
        }));
      }

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          error: expect.objectContaining({
            code: 'INVALID_INPUT'
          })
        })
      );
    });

    it('should not process input when stopped', () => {
      const noteHandler = jest.fn();
      notationCapture.on('noteAdded', noteHandler);

      // Don't start, remain in STOPPED mode
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC'
      }));

      expect(noteHandler).not.toHaveBeenCalled();
    });
  });

  describe('Event System', () => {
    it('should support event subscription and unsubscription', () => {
      const handler = jest.fn();
      
      notationCapture.on('modeChanged', handler);
      notationCapture.start();
      
      expect(handler).toHaveBeenCalledTimes(1);

      notationCapture.off('modeChanged', handler);
      notationCapture.stop();
      
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should emit preview updated events', () => {
      const previewHandler = jest.fn();
      notationCapture.on('previewUpdated', previewHandler);

      notationCapture.start();

      // Add a note to trigger preview update
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'a',
        code: 'KeyA'
      }));

      expect(previewHandler).toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcut Integration', () => {
    beforeEach(() => {
      notationCapture.start();
    });

    it('should handle Ctrl+Z for undo', () => {
      // Add a note
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'b',
        code: 'KeyB'
      }));

      const fragmentBefore = notationCapture.getCurrentFragment();
      expect(fragmentBefore.elements).toHaveLength(1);

      // Ctrl+Z
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'z',
        code: 'KeyZ',
        ctrlKey: true
      }));

      const fragmentAfter = notationCapture.getCurrentFragment();
      expect(fragmentAfter.elements).toHaveLength(0);
    });

    it('should clear fragment with Escape', () => {
      // Add some notes
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'c',
        code: 'KeyC'
      }));
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'd',
        code: 'KeyD'
      }));

      // Clear with Escape
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape'
      }));

      const fragment = notationCapture.getCurrentFragment();
      expect(fragment.elements).toHaveLength(0);
    });

    it('should commit with Enter', async () => {
      const commitHandler = jest.fn();
      notationCapture.on('fragmentCommitted', commitHandler);

      // Add a note
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'e',
        code: 'KeyE'
      }));

      // Commit with Enter
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter'
      }));

      // Wait for async commit
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(commitHandler).toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    it('should clean up on destroy', () => {
      const nc = new NotationCapture({
        container: mockContainer,
        renderer: 'vexflow'
      });

      nc.start();
      nc.destroy();

      expect(nc.getMode()).toBe('STOPPED');
      
      // Verify event listeners are removed by trying to trigger an event
      const handler = jest.fn();
      nc.on('modeChanged', handler);
      nc.start(); // This should not work after destroy
      expect(handler).not.toHaveBeenCalled();
    });
  });
});