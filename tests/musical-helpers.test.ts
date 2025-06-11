import {
  parsePitchString,
  formatPitch,
  getDurationValue,
  calculateFragmentDuration,
  countMeasures,
  transposeNote,
  createEmptyFragment,
  isNoteElement,
  isRestElement,
  getDurationFromKeyNumber
} from '../src/utils/musical-helpers';
import { Note, Rest, Barline, MusicalElement } from '../src/types/musical';

describe('musical-helpers', () => {
  describe('parsePitchString', () => {
    it('should parse natural note', () => {
      const result = parsePitchString('C4');
      expect(result).toEqual({
        note: 'C',
        accidental: null,
        octave: 4
      });
    });

    it('should parse sharp note', () => {
      const result = parsePitchString('F#5');
      expect(result).toEqual({
        note: 'F',
        accidental: 'sharp',
        octave: 5
      });
    });

    it('should parse flat note', () => {
      const result = parsePitchString('Bb3');
      expect(result).toEqual({
        note: 'B',
        accidental: 'flat',
        octave: 3
      });
    });

    it('should handle edge octaves', () => {
      const low = parsePitchString('A0');
      expect(low).toEqual({
        note: 'A',
        accidental: null,
        octave: 0
      });

      const high = parsePitchString('G8');
      expect(high).toEqual({
        note: 'G',
        accidental: null,
        octave: 8
      });
    });

    it('should return null for invalid format', () => {
      expect(parsePitchString('X4')).toBeNull();
      expect(parsePitchString('C')).toBeNull();
      expect(parsePitchString('CC4')).toBeNull();
      expect(parsePitchString('C44')).toBeNull();
      expect(parsePitchString('')).toBeNull();
    });

    it('should be case sensitive', () => {
      const uppercase = parsePitchString('D4');
      const lowercase = parsePitchString('d4');
      
      expect(uppercase).toEqual({
        note: 'D',
        accidental: null,
        octave: 4
      });
      expect(lowercase).toBeNull();
    });
  });

  describe('formatPitch', () => {
    it('should format natural note', () => {
      expect(formatPitch('C', null, 4)).toBe('C4');
      expect(formatPitch('G', null, 5)).toBe('G5');
    });

    it('should format sharp note', () => {
      expect(formatPitch('D', 'sharp', 4)).toBe('D#4');
      expect(formatPitch('A', 'sharp', 3)).toBe('A#3');
    });

    it('should format flat note', () => {
      expect(formatPitch('E', 'flat', 4)).toBe('Eb4');
      expect(formatPitch('B', 'flat', 6)).toBe('Bb6');
    });

    it('should handle all octaves', () => {
      expect(formatPitch('C', null, 0)).toBe('C0');
      expect(formatPitch('C', null, 8)).toBe('C8');
    });
  });

  describe('getDurationValue', () => {
    describe('simple durations', () => {
      it('should calculate whole note value', () => {
        expect(getDurationValue('whole')).toBe(1);
      });

      it('should calculate half note value', () => {
        expect(getDurationValue('half')).toBe(0.5);
      });

      it('should calculate quarter note value', () => {
        expect(getDurationValue('quarter')).toBe(0.25);
      });

      it('should calculate eighth note value', () => {
        expect(getDurationValue('eighth')).toBe(0.125);
      });

      it('should calculate sixteenth note value', () => {
        expect(getDurationValue('sixteenth')).toBe(0.0625);
      });

      it('should calculate thirty-second note value', () => {
        expect(getDurationValue('thirty-second')).toBe(0.03125);
      });

      it('should calculate sixty-fourth note value', () => {
        expect(getDurationValue('sixty-fourth')).toBe(0.015625);
      });
    });

    describe('dotted durations', () => {
      it('should calculate single dotted value', () => {
        const dotted = {
          duration: 'quarter' as const,
          dots: 1
        };
        expect(getDurationValue(dotted)).toBe(0.375); // 0.25 + 0.125
      });

      it('should calculate double dotted value', () => {
        const doubleDotted = {
          duration: 'half' as const,
          dots: 2
        };
        expect(getDurationValue(doubleDotted)).toBe(0.875); // 0.5 + 0.25 + 0.125
      });

      it('should handle dotted whole note', () => {
        const dotted = {
          duration: 'whole' as const,
          dots: 1
        };
        expect(getDurationValue(dotted)).toBe(1.5); // 1 + 0.5
      });

      it('should handle no dots (same as simple)', () => {
        const noDots = {
          duration: 'eighth' as const,
          dots: 0
        };
        expect(getDurationValue(noDots)).toBe(0.125);
      });
    });
  });

  describe('calculateFragmentDuration', () => {
    it('should calculate empty fragment duration', () => {
      const result = calculateFragmentDuration([], { numerator: 4, denominator: 4 });
      expect(result).toBe('0');
    });

    it('should calculate single measure', () => {
      const elements: MusicalElement[] = [
        { type: 'note', pitch: 'C4', duration: 'quarter', accidental: null },
        { type: 'note', pitch: 'D4', duration: 'quarter', accidental: null },
        { type: 'note', pitch: 'E4', duration: 'quarter', accidental: null },
        { type: 'note', pitch: 'F4', duration: 'quarter', accidental: null }
      ];
      
      const result = calculateFragmentDuration(elements, { numerator: 4, denominator: 4 });
      expect(result).toBe('1');
    });

    it('should calculate partial measure', () => {
      const elements: MusicalElement[] = [
        { type: 'note', pitch: 'C4', duration: 'quarter', accidental: null },
        { type: 'note', pitch: 'D4', duration: 'quarter', accidental: null },
        { type: 'rest', duration: 'quarter' }
      ];
      
      const result = calculateFragmentDuration(elements, { numerator: 4, denominator: 4 });
      expect(result).toBe('0.3/4');
    });

    it('should handle multiple measures plus partial', () => {
      const elements: MusicalElement[] = [
        // First measure
        { type: 'note', pitch: 'C4', duration: 'half', accidental: null },
        { type: 'note', pitch: 'D4', duration: 'half', accidental: null },
        // Second measure
        { type: 'note', pitch: 'E4', duration: 'whole', accidental: null },
        // Partial third measure
        { type: 'note', pitch: 'F4', duration: 'quarter', accidental: null }
      ];
      
      const result = calculateFragmentDuration(elements, { numerator: 4, denominator: 4 });
      expect(result).toBe('2.1/4');
    });

    it('should handle different time signatures', () => {
      const elements: MusicalElement[] = [
        { type: 'note', pitch: 'C4', duration: 'quarter', accidental: null },
        { type: 'note', pitch: 'D4', duration: 'quarter', accidental: null },
        { type: 'note', pitch: 'E4', duration: 'quarter', accidental: null }
      ];
      
      const result34 = calculateFragmentDuration(elements, { numerator: 3, denominator: 4 });
      expect(result34).toBe('1');
      
      const result68 = calculateFragmentDuration(elements, { numerator: 6, denominator: 8 });
      expect(result68).toBe('0.3/6'); // 3 quarter notes = 6 eighth notes = 1 measure in 6/8
    });

    it('should ignore barlines in duration calculation', () => {
      const elements: MusicalElement[] = [
        { type: 'note', pitch: 'C4', duration: 'quarter', accidental: null },
        { type: 'barline', style: 'single' },
        { type: 'note', pitch: 'D4', duration: 'quarter', accidental: null }
      ];
      
      const result = calculateFragmentDuration(elements, { numerator: 4, denominator: 4 });
      expect(result).toBe('0.2/4');
    });

    it('should handle chords', () => {
      const elements: MusicalElement[] = [
        { type: 'chord', pitches: ['C4', 'E4', 'G4'], duration: 'half' },
        { type: 'note', pitch: 'A4', duration: 'half', accidental: null }
      ];
      
      const result = calculateFragmentDuration(elements, { numerator: 4, denominator: 4 });
      expect(result).toBe('1');
    });
  });

  describe('countMeasures', () => {
    it('should count zero measures for empty elements', () => {
      expect(countMeasures([])).toBe(0);
    });

    it('should count single barline', () => {
      const elements: MusicalElement[] = [
        { type: 'note', pitch: 'C4', duration: 'quarter', accidental: null },
        { type: 'barline', style: 'single' }
      ];
      
      expect(countMeasures(elements)).toBe(1);
    });

    it('should count multiple barlines', () => {
      const elements: MusicalElement[] = [
        { type: 'note', pitch: 'C4', duration: 'quarter', accidental: null },
        { type: 'barline', style: 'single' },
        { type: 'note', pitch: 'D4', duration: 'quarter', accidental: null },
        { type: 'barline', style: 'double' },
        { type: 'note', pitch: 'E4', duration: 'quarter', accidental: null },
        { type: 'barline', style: 'end' }
      ];
      
      expect(countMeasures(elements)).toBe(3);
    });

    it('should only count barlines, not other elements', () => {
      const elements: MusicalElement[] = [
        { type: 'note', pitch: 'C4', duration: 'quarter', accidental: null },
        { type: 'rest', duration: 'quarter' },
        { type: 'chord', pitches: ['C4', 'E4'], duration: 'half' }
      ];
      
      expect(countMeasures(elements)).toBe(0);
    });
  });

  describe('transposeNote', () => {
    it('should transpose up by semitones', () => {
      expect(transposeNote('C4', 2)).toBe('D4');
      expect(transposeNote('C4', 7)).toBe('G4');
      expect(transposeNote('B4', 1)).toBe('C5');
    });

    it('should transpose down by semitones', () => {
      expect(transposeNote('D4', -2)).toBe('C4');
      expect(transposeNote('C4', -1)).toBe('B3');
      expect(transposeNote('F4', -6)).toBe('B3');
    });

    it('should handle accidentals correctly', () => {
      expect(transposeNote('C#4', 1)).toBe('D4');
      expect(transposeNote('Db4', 1)).toBe('D4');
      expect(transposeNote('F#4', 2)).toBe('G#4');
      expect(transposeNote('Bb4', -1)).toBe('A4');
    });

    it('should transpose across octaves', () => {
      expect(transposeNote('B4', 2)).toBe('C#5');
      expect(transposeNote('C5', -13)).toBe('B3');
      expect(transposeNote('G7', 12)).toBe('G8');
    });

    it('should handle edge cases', () => {
      expect(transposeNote('C4', 0)).toBe('C4');
      expect(transposeNote('F#4', 0)).toBe('F#4');
    });

    it('should return original on invalid input', () => {
      expect(transposeNote('X4', 5)).toBe('X4');
      expect(transposeNote('', 3)).toBe('');
    });

    it('should handle enharmonic equivalents', () => {
      // C# and Db are the same pitch
      expect(transposeNote('C4', 1)).toBe('C#4');
      expect(transposeNote('C4', 11)).toBe('B4');
    });
  });

  describe('createEmptyFragment', () => {
    it('should create default empty fragment', () => {
      const fragment = createEmptyFragment();
      
      expect(fragment).toMatchObject({
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [],
        metadata: {
          measures: 0,
          totalDuration: '0'
        }
      });
      
      expect(fragment.id).toMatch(/^fragment_\d+$/);
      expect(new Date(fragment.timestamp)).toBeInstanceOf(Date);
    });

    it('should accept custom time signature', () => {
      const fragment = createEmptyFragment(
        { numerator: 3, denominator: 4 }
      );
      
      expect(fragment.timeSignature).toEqual({ numerator: 3, denominator: 4 });
    });

    it('should accept custom key signature', () => {
      const fragment = createEmptyFragment(
        undefined,
        { key: 'G', mode: 'minor' }
      );
      
      expect(fragment.keySignature).toEqual({ key: 'G', mode: 'minor' });
    });

    it('should accept custom tempo', () => {
      const fragment = createEmptyFragment(
        undefined,
        undefined,
        140
      );
      
      expect(fragment.tempo).toBe(140);
    });

    it('should accept all custom parameters', () => {
      const fragment = createEmptyFragment(
        { numerator: 6, denominator: 8 },
        { key: 'D', mode: 'major' },
        180
      );
      
      expect(fragment.timeSignature).toEqual({ numerator: 6, denominator: 8 });
      expect(fragment.keySignature).toEqual({ key: 'D', mode: 'major' });
      expect(fragment.tempo).toBe(180);
    });

    it('should generate unique IDs', () => {
      const fragment1 = createEmptyFragment();
      const fragment2 = createEmptyFragment();
      
      expect(fragment1.id).not.toBe(fragment2.id);
    });
  });

  describe('Type Guards', () => {
    describe('isNoteElement', () => {
      it('should identify note elements', () => {
        const note: Note = {
          type: 'note',
          pitch: 'C4',
          duration: 'quarter',
          accidental: null
        };
        
        expect(isNoteElement(note)).toBe(true);
      });

      it('should reject non-note elements', () => {
        const rest: Rest = {
          type: 'rest',
          duration: 'quarter'
        };
        
        const barline: Barline = {
          type: 'barline',
          style: 'single'
        };
        
        expect(isNoteElement(rest)).toBe(false);
        expect(isNoteElement(barline)).toBe(false);
      });
    });

    describe('isRestElement', () => {
      it('should identify rest elements', () => {
        const rest: Rest = {
          type: 'rest',
          duration: 'eighth'
        };
        
        expect(isRestElement(rest)).toBe(true);
      });

      it('should reject non-rest elements', () => {
        const note: Note = {
          type: 'note',
          pitch: 'D4',
          duration: 'half',
          accidental: null
        };
        
        expect(isRestElement(note)).toBe(false);
      });
    });
  });

  describe('getDurationFromKeyNumber', () => {
    it('should map number keys to durations', () => {
      expect(getDurationFromKeyNumber('1')).toBe('whole');
      expect(getDurationFromKeyNumber('2')).toBe('half');
      expect(getDurationFromKeyNumber('4')).toBe('quarter');
      expect(getDurationFromKeyNumber('8')).toBe('eighth');
      expect(getDurationFromKeyNumber('6')).toBe('sixteenth');
    });

    it('should return null for unmapped keys', () => {
      expect(getDurationFromKeyNumber('3')).toBeNull();
      expect(getDurationFromKeyNumber('5')).toBeNull();
      expect(getDurationFromKeyNumber('7')).toBeNull();
      expect(getDurationFromKeyNumber('9')).toBeNull();
      expect(getDurationFromKeyNumber('0')).toBeNull();
      expect(getDurationFromKeyNumber('a')).toBeNull();
      expect(getDurationFromKeyNumber('')).toBeNull();
    });
  });
});