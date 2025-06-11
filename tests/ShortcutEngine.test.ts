import { ShortcutEngine, KeyboardInput, ProcessedInput } from '../src/core/ShortcutEngine';
import { DEFAULT_KEY_MAPPINGS } from '../src/types/config';

describe('ShortcutEngine', () => {
  let engine: ShortcutEngine;

  beforeEach(() => {
    engine = new ShortcutEngine(DEFAULT_KEY_MAPPINGS);
  });

  describe('Note Input', () => {
    it('should process basic note input', () => {
      const input: KeyboardInput = {
        key: 'c',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      };

      const result = engine.processKeyInput(input, 'CAPTURE');
      
      expect(result.type).toBe('note');
      expect(result.data).toMatchObject({
        type: 'note',
        pitch: 'C4',
        duration: 'quarter',
        accidental: null
      });
    });

    it('should process sharp notes with Shift', () => {
      const input: KeyboardInput = {
        key: 'd',
        shiftKey: true,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      };

      const result = engine.processKeyInput(input, 'CAPTURE');
      
      expect(result.type).toBe('note');
      expect(result.data).toMatchObject({
        pitch: 'D#4',
        accidental: 'sharp'
      });
    });

    it('should process flat notes with Alt', () => {
      const input: KeyboardInput = {
        key: 'e',
        shiftKey: false,
        altKey: true,
        ctrlKey: false,
        metaKey: false
      };

      const result = engine.processKeyInput(input, 'CAPTURE');
      
      expect(result.type).toBe('note');
      expect(result.data).toMatchObject({
        pitch: 'Eb4',
        accidental: 'flat'
      });
    });

    it('should respect current octave setting', () => {
      // Change octave up
      engine.processKeyInput({
        key: 'ArrowUp',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      const result = engine.processKeyInput({
        key: 'g',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.data.pitch).toBe('G5');
    });
  });

  describe('Duration Changes', () => {
    it('should change duration to whole note', () => {
      const result = engine.processKeyInput({
        key: '1',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('modifier');
      expect(result.data.duration).toBe('whole');
      expect(result.data.dotted).toBe(false);
    });

    it('should change duration to eighth note', () => {
      const result = engine.processKeyInput({
        key: '8',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('modifier');
      expect(result.data.duration).toBe('eighth');
    });

    it('should handle dotted quarter note shortcut', () => {
      const result = engine.processKeyInput({
        key: '3',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('modifier');
      expect(result.data.duration).toBe('quarter');
      expect(result.data.dotted).toBe(true);
    });

    it('should apply duration to subsequent notes', () => {
      // Set to half note
      engine.processKeyInput({
        key: '2',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      // Add a note
      const noteResult = engine.processKeyInput({
        key: 'f',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(noteResult.data.duration).toBe('half');
    });

    it('should clear dotted state when changing to regular duration', () => {
      // Set dotted quarter
      engine.processKeyInput({
        key: '3',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      // Change to regular quarter
      const result = engine.processKeyInput({
        key: '4',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.data.dotted).toBe(false);
    });
  });

  describe('Rest Input', () => {
    it('should create rest with Space key', () => {
      const result = engine.processKeyInput({
        key: 'Space',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('rest');
      expect(result.data).toMatchObject({
        type: 'rest',
        duration: 'quarter'
      });
    });

    it('should create rest with R key', () => {
      const result = engine.processKeyInput({
        key: 'r',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('rest');
      expect(result.data.type).toBe('rest');
    });

    it('should apply current duration to rests', () => {
      // Set sixteenth note
      engine.processKeyInput({
        key: '6',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      const result = engine.processKeyInput({
        key: 'Space',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.data.duration).toBe('sixteenth');
    });
  });

  describe('Chord Mode', () => {
    it('should enter chord mode with Ctrl+Note', () => {
      const result = engine.processKeyInput({
        key: 'c',
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('control');
      expect(result.data.action).toBe('enter-chord-mode');
      expect(engine.isChordModeActive()).toBe(true);
    });

    it('should add notes to chord in chord mode', () => {
      // Enter chord mode
      engine.processKeyInput({
        key: 'c',
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }, 'CAPTURE');

      // Add notes
      const result = engine.processKeyInput({
        key: 'e',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CHORD_MODE');

      expect(result.type).toBe('modifier');
      expect(result.data.chordNotes).toContain('C4');
      expect(result.data.chordNotes).toContain('E4');
    });

    it('should complete chord with Enter', () => {
      // Build C major chord
      engine.processKeyInput({
        key: 'c',
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }, 'CAPTURE');

      engine.processKeyInput({
        key: 'e',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CHORD_MODE');

      engine.processKeyInput({
        key: 'g',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CHORD_MODE');

      const result = engine.processKeyInput({
        key: 'Enter',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CHORD_MODE');

      expect(result.type).toBe('chord');
      expect(result.data.pitches).toEqual(['C4', 'E4', 'G4']);
      expect(engine.isChordModeActive()).toBe(false);
    });
  });

  describe('Octave Control', () => {
    it('should raise octave with up arrow', () => {
      const result = engine.processKeyInput({
        key: 'ArrowUp',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('modifier');
      expect(result.data.octave).toBe(5);
    });

    it('should lower octave with down arrow', () => {
      const result = engine.processKeyInput({
        key: 'ArrowDown',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('modifier');
      expect(result.data.octave).toBe(3);
    });

    it('should reset octave with 0', () => {
      // First change octave
      engine.processKeyInput({
        key: 'ArrowUp',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      engine.processKeyInput({
        key: 'ArrowUp',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      // Reset
      const result = engine.processKeyInput({
        key: '0',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.data.octave).toBe(4);
    });

    it('should prevent octave from going below 0', () => {
      // Go to octave 0
      for (let i = 0; i < 4; i++) {
        engine.processKeyInput({
          key: 'ArrowDown',
          shiftKey: false,
          altKey: false,
          ctrlKey: false,
          metaKey: false
        }, 'CAPTURE');
      }

      // Try to go below 0
      const result = engine.processKeyInput({
        key: 'ArrowDown',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('invalid');
      expect(result.error).toBe('Octave out of range');
    });

    it('should prevent octave from going above 8', () => {
      // Go to octave 8
      for (let i = 0; i < 4; i++) {
        engine.processKeyInput({
          key: 'ArrowUp',
          shiftKey: false,
          altKey: false,
          ctrlKey: false,
          metaKey: false
        }, 'CAPTURE');
      }

      // Try to go above 8
      const result = engine.processKeyInput({
        key: 'ArrowUp',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('invalid');
    });
  });

  describe('Control Commands', () => {
    it('should process commit command', () => {
      const result = engine.processKeyInput({
        key: 'Enter',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('control');
      expect(result.data.action).toBe('commit');
    });

    it('should process delete command', () => {
      const result = engine.processKeyInput({
        key: 'Backspace',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('control');
      expect(result.data.action).toBe('delete');
    });

    it('should process clear command', () => {
      const result = engine.processKeyInput({
        key: 'Escape',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('control');
      expect(result.data.action).toBe('clear');
    });

    it('should process barline command', () => {
      const result = engine.processKeyInput({
        key: 'Tab',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('control');
      expect(result.data.element).toMatchObject({
        type: 'barline',
        style: 'single'
      });
    });

    it('should process undo command', () => {
      const result = engine.processKeyInput({
        key: 'z',
        shiftKey: false,
        altKey: false,
        ctrlKey: true,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('control');
      expect(result.data.action).toBe('undo');
    });
  });

  describe('Modifiers', () => {
    it('should toggle dot with period key', () => {
      const result = engine.processKeyInput({
        key: '.',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('modifier');
      expect(result.data.dotted).toBe(true);

      // Toggle off
      const result2 = engine.processKeyInput({
        key: '.',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result2.data.dotted).toBe(false);
    });

    it('should toggle triplet with T key', () => {
      const result = engine.processKeyInput({
        key: 'T',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('modifier');
      expect(result.data.triplet).toBe(true);
    });

    it('should apply dotted duration to notes', () => {
      // Enable dot
      engine.processKeyInput({
        key: '.',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      // Add note
      const result = engine.processKeyInput({
        key: 'a',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.data.duration).toMatchObject({
        duration: 'quarter',
        dots: 1
      });
    });
  });

  describe('Articulations', () => {
    it('should process staccato articulation', () => {
      const result = engine.processKeyInput({
        key: "'",
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('modifier');
      expect(result.data.articulation).toBe('staccato');
    });

    it('should process accent articulation', () => {
      const result = engine.processKeyInput({
        key: '>',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('modifier');
      expect(result.data.articulation).toBe('accent');
    });
  });

  describe('State Management', () => {
    it('should return current state', () => {
      const state = engine.getCurrentState();
      
      expect(state).toMatchObject({
        duration: 'quarter',
        octave: 4,
        isDotted: false,
        isTriplet: false,
        chordNotes: []
      });
    });

    it('should reset to defaults', () => {
      // Change some settings
      engine.processKeyInput({
        key: '2',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      engine.processKeyInput({
        key: 'ArrowUp',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      // Reset
      engine.reset();
      const state = engine.getCurrentState();

      expect(state.duration).toBe('quarter');
      expect(state.octave).toBe(4);
    });
  });

  describe('Input Mode Restrictions', () => {
    it('should reject input in STOPPED mode', () => {
      const result = engine.processKeyInput({
        key: 'c',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'STOPPED');

      expect(result.type).toBe('invalid');
      expect(result.error).toBe('Input not accepted in current mode');
    });

    it('should reject input in ERROR mode', () => {
      const result = engine.processKeyInput({
        key: 'd',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'ERROR');

      expect(result.type).toBe('invalid');
    });
  });

  describe('Invalid Input', () => {
    it('should handle unrecognized keys', () => {
      const result = engine.processKeyInput({
        key: 'x',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('invalid');
      expect(result.error).toBe('Unrecognized input');
    });
  });

  describe('Custom Key Mappings', () => {
    it('should accept custom key mappings', () => {
      const customMappings = {
        ...DEFAULT_KEY_MAPPINGS,
        durations: {
          'q': 'quarter',
          'h': 'half'
        }
      };

      engine.updateKeyMappings(customMappings);

      const result = engine.processKeyInput({
        key: 'q',
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false
      }, 'CAPTURE');

      expect(result.type).toBe('modifier');
      expect(result.data.duration).toBe('quarter');
    });
  });
});