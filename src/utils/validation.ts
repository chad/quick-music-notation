import { 
  NoteName, 
  Octave, 
  Duration, 
  MusicalElement,
  Note,
  Chord,
  TimeSignature
} from '../types/musical';

export function isValidNoteName(name: string): name is NoteName {
  return ['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(name.toUpperCase());
}

export function isValidOctave(octave: number): octave is Octave {
  return Number.isInteger(octave) && octave >= 0 && octave <= 8;
}

export function isValidDuration(duration: string): duration is Duration {
  return [
    'whole',
    'half',
    'quarter',
    'eighth',
    'sixteenth',
    'thirty-second',
    'sixty-fourth'
  ].includes(duration);
}

export function isValidPitch(pitch: string): boolean {
  const match = pitch.match(/^([A-G])([#b]?)(\d)$/);
  if (!match) return false;
  
  const [, note, , octaveStr] = match;
  const octave = parseInt(octaveStr);
  
  return isValidNoteName(note) && isValidOctave(octave);
}

export function validateNote(note: Note): string[] {
  const errors: string[] = [];
  
  if (!isValidPitch(note.pitch)) {
    errors.push(`Invalid pitch: ${note.pitch}`);
  }
  
  const duration = typeof note.duration === 'object' 
    ? note.duration.duration 
    : note.duration;
    
  if (!isValidDuration(duration)) {
    errors.push(`Invalid duration: ${duration}`);
  }
  
  if (typeof note.duration === 'object' && note.duration.dots < 0) {
    errors.push('Dots cannot be negative');
  }
  
  return errors;
}

export function validateChord(chord: Chord): string[] {
  const errors: string[] = [];
  
  if (chord.pitches.length === 0) {
    errors.push('Chord must have at least one pitch');
  }
  
  for (const pitch of chord.pitches) {
    if (!isValidPitch(pitch)) {
      errors.push(`Invalid pitch in chord: ${pitch}`);
    }
  }
  
  const duration = typeof chord.duration === 'object' 
    ? chord.duration.duration 
    : chord.duration;
    
  if (!isValidDuration(duration)) {
    errors.push(`Invalid duration: ${duration}`);
  }
  
  return errors;
}

export function validateTimeSignature(ts: TimeSignature): string[] {
  const errors: string[] = [];
  
  if (!Number.isInteger(ts.numerator) || ts.numerator < 1) {
    errors.push('Time signature numerator must be a positive integer');
  }
  
  const validDenominators = [1, 2, 4, 8, 16, 32, 64];
  if (!validDenominators.includes(ts.denominator)) {
    errors.push(`Time signature denominator must be one of: ${validDenominators.join(', ')}`);
  }
  
  return errors;
}

export function validateMusicalElement(element: MusicalElement): string[] {
  switch (element.type) {
    case 'note':
      return validateNote(element);
    case 'chord':
      return validateChord(element);
    case 'timeSignature':
      return validateTimeSignature(element);
    case 'rest':
    case 'barline':
    case 'keySignature':
    case 'tempo':
      return []; // Basic validation passed, detailed validation would go here
    default:
      return [`Unknown element type: ${(element as any).type}`];
  }
}

export function canAddElementToFragment(
  element: MusicalElement,
  currentElements: MusicalElement[]
): { valid: boolean; reason?: string } {
  // Check for conflicting elements
  if (element.type === 'timeSignature' || element.type === 'keySignature') {
    // These should typically only appear at the beginning
    if (currentElements.some(e => e.type === 'note' || e.type === 'rest')) {
      return {
        valid: false,
        reason: 'Time and key signatures should be placed before notes'
      };
    }
  }
  
  return { valid: true };
}