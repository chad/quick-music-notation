import { EventEmitter } from '../src/core/EventEmitter';
import { 
  NotationEvent, 
  NoteAddedEvent, 
  ModeChangedEvent,
  FragmentCommittedEvent,
  ErrorEvent
} from '../src/types/events';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('Event Registration', () => {
    it('should register event listener', () => {
      const handler = jest.fn();
      
      emitter.on('noteAdded', handler);
      
      const event: NoteAddedEvent = {
        type: 'noteAdded',
        note: {
          type: 'note',
          pitch: 'C4',
          duration: 'quarter',
          accidental: null
        },
        index: 0
      };
      
      emitter.emit(event);
      
      expect(handler).toHaveBeenCalledWith(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should register multiple listeners for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      emitter.on('modeChanged', handler1);
      emitter.on('modeChanged', handler2);
      
      const event: ModeChangedEvent = {
        type: 'modeChanged',
        previousMode: 'STOPPED',
        newMode: 'CAPTURE'
      };
      
      emitter.emit(event);
      
      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it('should register listeners for different events', () => {
      const noteHandler = jest.fn();
      const modeHandler = jest.fn();
      
      emitter.on('noteAdded', noteHandler);
      emitter.on('modeChanged', modeHandler);
      
      const noteEvent: NoteAddedEvent = {
        type: 'noteAdded',
        note: {
          type: 'note',
          pitch: 'D4',
          duration: 'half',
          accidental: null
        },
        index: 1
      };
      
      const modeEvent: ModeChangedEvent = {
        type: 'modeChanged',
        previousMode: 'CAPTURE',
        newMode: 'PAUSED'
      };
      
      emitter.emit(noteEvent);
      emitter.emit(modeEvent);
      
      expect(noteHandler).toHaveBeenCalledWith(noteEvent);
      expect(noteHandler).not.toHaveBeenCalledWith(modeEvent);
      expect(modeHandler).toHaveBeenCalledWith(modeEvent);
      expect(modeHandler).not.toHaveBeenCalledWith(noteEvent);
    });
  });

  describe('Event Unregistration', () => {
    it('should unregister specific event listener', () => {
      const handler = jest.fn();
      
      emitter.on('fragmentCommitted', handler);
      emitter.off('fragmentCommitted', handler);
      
      const event: FragmentCommittedEvent = {
        type: 'fragmentCommitted',
        fragment: {
          id: 'test',
          timestamp: new Date().toISOString(),
          timeSignature: { numerator: 4, denominator: 4 },
          keySignature: { key: 'C', mode: 'major' },
          tempo: 120,
          elements: [],
          metadata: { measures: 0, totalDuration: '0' }
        }
      };
      
      emitter.emit(event);
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should only unregister the specified handler', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      emitter.on('error', handler1);
      emitter.on('error', handler2);
      emitter.off('error', handler1);
      
      const event: ErrorEvent = {
        type: 'error',
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
          severity: 'error',
          recoverable: true
        }
      };
      
      emitter.emit(event);
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it('should handle unregistering non-existent listener gracefully', () => {
      const handler = jest.fn();
      
      // Should not throw
      expect(() => {
        emitter.off('noteAdded', handler);
      }).not.toThrow();
    });

    it('should handle unregistering from empty event type', () => {
      const handler = jest.fn();
      
      // Register then unregister all
      emitter.on('modeChanged', handler);
      emitter.off('modeChanged', handler);
      
      // Try to unregister again
      expect(() => {
        emitter.off('modeChanged', handler);
      }).not.toThrow();
    });
  });

  describe('Event Emission', () => {
    it('should not throw when emitting event with no listeners', () => {
      const event: NoteAddedEvent = {
        type: 'noteAdded',
        note: {
          type: 'note',
          pitch: 'E4',
          duration: 'eighth',
          accidental: null
        },
        index: 2
      };
      
      expect(() => {
        emitter.emit(event);
      }).not.toThrow();
    });

    it('should handle listener exceptions gracefully', () => {
      const goodHandler = jest.fn();
      const badHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const anotherGoodHandler = jest.fn();
      
      emitter.on('noteAdded', goodHandler);
      emitter.on('noteAdded', badHandler);
      emitter.on('noteAdded', anotherGoodHandler);
      
      const event: NoteAddedEvent = {
        type: 'noteAdded',
        note: {
          type: 'note',
          pitch: 'F4',
          duration: 'quarter',
          accidental: null
        },
        index: 3
      };
      
      // Should not throw even though one handler throws
      expect(() => {
        emitter.emit(event);
      }).not.toThrow();
      
      // Other handlers should still be called
      expect(goodHandler).toHaveBeenCalledWith(event);
      expect(anotherGoodHandler).toHaveBeenCalledWith(event);
    });

    it('should emit events in registration order', () => {
      const calls: number[] = [];
      
      const handler1 = jest.fn(() => calls.push(1));
      const handler2 = jest.fn(() => calls.push(2));
      const handler3 = jest.fn(() => calls.push(3));
      
      emitter.on('noteAdded', handler1);
      emitter.on('noteAdded', handler2);
      emitter.on('noteAdded', handler3);
      
      const event: NoteAddedEvent = {
        type: 'noteAdded',
        note: {
          type: 'note',
          pitch: 'G4',
          duration: 'whole',
          accidental: null
        },
        index: 4
      };
      
      emitter.emit(event);
      
      expect(calls).toEqual([1, 2, 3]);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for event handlers', () => {
      // This test mainly verifies TypeScript compilation
      const noteHandler = (event: NoteAddedEvent) => {
        expect(event.note.type).toBe('note');
        expect(event.index).toBeGreaterThanOrEqual(0);
      };
      
      const modeHandler = (event: ModeChangedEvent) => {
        expect(['CAPTURE', 'PAUSED', 'STOPPED', 'CHORD_MODE', 'ERROR'])
          .toContain(event.newMode);
      };
      
      emitter.on('noteAdded', noteHandler);
      emitter.on('modeChanged', modeHandler);
      
      // TypeScript should enforce correct event types
      const noteEvent: NoteAddedEvent = {
        type: 'noteAdded',
        note: {
          type: 'note',
          pitch: 'A4',
          duration: 'quarter',
          accidental: null
        },
        index: 5
      };
      
      const modeEvent: ModeChangedEvent = {
        type: 'modeChanged',
        previousMode: 'STOPPED',
        newMode: 'CAPTURE'
      };
      
      emitter.emit(noteEvent);
      emitter.emit(modeEvent);
    });
  });

  describe('RemoveAllListeners', () => {
    it('should remove all listeners', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();
      
      emitter.on('noteAdded', handler1);
      emitter.on('modeChanged', handler2);
      emitter.on('error', handler3);
      
      emitter.removeAllListeners();
      
      // Emit various events
      emitter.emit<NoteAddedEvent>({
        type: 'noteAdded',
        note: {
          type: 'note',
          pitch: 'B4',
          duration: 'quarter',
          accidental: null
        },
        index: 6
      });
      
      emitter.emit<ModeChangedEvent>({
        type: 'modeChanged',
        previousMode: 'CAPTURE',
        newMode: 'STOPPED'
      });
      
      emitter.emit<ErrorEvent>({
        type: 'error',
        error: {
          code: 'TEST',
          message: 'Test',
          severity: 'error',
          recoverable: false
        }
      });
      
      // No handlers should be called
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
    });

    it('should allow new listeners after removeAll', () => {
      const oldHandler = jest.fn();
      const newHandler = jest.fn();
      
      emitter.on('noteAdded', oldHandler);
      emitter.removeAllListeners();
      emitter.on('noteAdded', newHandler);
      
      const event: NoteAddedEvent = {
        type: 'noteAdded',
        note: {
          type: 'note',
          pitch: 'C5',
          duration: 'half',
          accidental: null
        },
        index: 7
      };
      
      emitter.emit(event);
      
      expect(oldHandler).not.toHaveBeenCalled();
      expect(newHandler).toHaveBeenCalledWith(event);
    });
  });

  describe('Edge Cases', () => {
    it('should handle same handler registered multiple times', () => {
      const handler = jest.fn();
      
      // Register the same handler twice
      emitter.on('noteAdded', handler);
      emitter.on('noteAdded', handler);
      
      const event: NoteAddedEvent = {
        type: 'noteAdded',
        note: {
          type: 'note',
          pitch: 'D5',
          duration: 'quarter',
          accidental: null
        },
        index: 8
      };
      
      emitter.emit(event);
      
      // Should be called twice
      expect(handler).toHaveBeenCalledTimes(2);
      
      // Unregister once
      emitter.off('noteAdded', handler);
      handler.mockClear();
      
      emitter.emit(event);
      
      // Should still be called once
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid registration/unregistration', () => {
      const handler = jest.fn();
      
      for (let i = 0; i < 100; i++) {
        emitter.on('noteAdded', handler);
        emitter.off('noteAdded', handler);
      }
      
      const event: NoteAddedEvent = {
        type: 'noteAdded',
        note: {
          type: 'note',
          pitch: 'E5',
          duration: 'eighth',
          accidental: null
        },
        index: 9
      };
      
      emitter.emit(event);
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle listeners that modify the listener list', () => {
      const results: string[] = [];
      
      const handler1 = jest.fn(() => {
        results.push('handler1');
        // Unregister handler2 during execution
        emitter.off('noteAdded', handler2);
      });
      
      const handler2 = jest.fn(() => {
        results.push('handler2');
      });
      
      const handler3 = jest.fn(() => {
        results.push('handler3');
      });
      
      emitter.on('noteAdded', handler1);
      emitter.on('noteAdded', handler2);
      emitter.on('noteAdded', handler3);
      
      const event: NoteAddedEvent = {
        type: 'noteAdded',
        note: {
          type: 'note',
          pitch: 'F5',
          duration: 'sixteenth',
          accidental: null
        },
        index: 10
      };
      
      emitter.emit(event);
      
      // Handler2 should still be called this time
      expect(results).toEqual(['handler1', 'handler2', 'handler3']);
      
      // But not on subsequent emits
      results.length = 0;
      emitter.emit(event);
      
      expect(results).toEqual(['handler1', 'handler3']);
    });
  });
});