import { FragmentManager } from '../src/core/FragmentManager';
import { Note, Chord, Barline } from '../src/types/musical';

describe('FragmentManager', () => {
  let fragmentManager: FragmentManager;

  beforeEach(() => {
    fragmentManager = new FragmentManager();
  });

  describe('addElement', () => {
    it('should add a valid note', () => {
      const note: Note = {
        type: 'note',
        pitch: 'C4',
        duration: 'quarter'
      };

      const result = fragmentManager.addElement(note);
      expect(result.success).toBe(true);
      expect(fragmentManager.getElementCount()).toBe(1);
    });

    it('should reject invalid pitch', () => {
      const note: Note = {
        type: 'note',
        pitch: 'X9',
        duration: 'quarter'
      };

      const result = fragmentManager.addElement(note);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid pitch');
    });

    it('should add a chord', () => {
      const chord: Chord = {
        type: 'chord',
        pitches: ['C4', 'E4', 'G4'],
        duration: 'half'
      };

      const result = fragmentManager.addElement(chord);
      expect(result.success).toBe(true);
      expect(fragmentManager.getElementCount()).toBe(1);
    });
  });

  describe('deleteLastElement', () => {
    it('should delete the last element', () => {
      const note: Note = {
        type: 'note',
        pitch: 'C4',
        duration: 'quarter'
      };

      fragmentManager.addElement(note);
      const deleted = fragmentManager.deleteLastElement();
      
      expect(deleted).toEqual(note);
      expect(fragmentManager.getElementCount()).toBe(0);
    });

    it('should return null when empty', () => {
      const deleted = fragmentManager.deleteLastElement();
      expect(deleted).toBeNull();
    });
  });

  describe('undo/redo', () => {
    it('should undo last action', () => {
      const note: Note = {
        type: 'note',
        pitch: 'C4',
        duration: 'quarter'
      };

      fragmentManager.addElement(note);
      expect(fragmentManager.getElementCount()).toBe(1);

      fragmentManager.undo();
      expect(fragmentManager.getElementCount()).toBe(0);
    });

    it('should redo after undo', () => {
      const note: Note = {
        type: 'note',
        pitch: 'C4',
        duration: 'quarter'
      };

      fragmentManager.addElement(note);
      fragmentManager.undo();
      fragmentManager.redo();
      
      expect(fragmentManager.getElementCount()).toBe(1);
    });
  });

  describe('fragment metadata', () => {
    it('should update metadata when adding elements', () => {
      const note1: Note = {
        type: 'note',
        pitch: 'C4',
        duration: 'quarter'
      };
      const note2: Note = {
        type: 'note',
        pitch: 'D4',
        duration: 'quarter'
      };
      const barline: Barline = {
        type: 'barline'
      };

      fragmentManager.addElement(note1);
      fragmentManager.addElement(note2);
      fragmentManager.addElement(barline);

      const fragment = fragmentManager.getCurrentFragment();
      expect(fragment.metadata.measures).toBe(1);
    });
  });

  describe('commit', () => {
    it('should commit fragment and clear current', () => {
      const note: Note = {
        type: 'note',
        pitch: 'C4',
        duration: 'quarter'
      };

      fragmentManager.addElement(note);
      const committed = fragmentManager.commit();

      expect(committed.elements.length).toBe(1);
      expect(fragmentManager.isEmpty()).toBe(true);
      expect(fragmentManager.getCommittedFragments().length).toBe(1);
    });
  });
});