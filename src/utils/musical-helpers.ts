import { 
  Duration, 
  DottedDuration, 
  NoteName,
  Octave,
  MusicalElement,
  Note,
  Rest,
  TimeSignature
} from '../types/musical';

export function parsePitchString(pitch: string): { 
  note: NoteName; 
  accidental: 'sharp' | 'flat' | null; 
  octave: Octave 
} | null {
  const match = pitch.match(/^([A-G])([#b]?)(\d)$/);
  if (!match) return null;
  
  const [, note, accidental, octaveStr] = match;
  const octave = parseInt(octaveStr) as Octave;
  
  return {
    note: note as NoteName,
    accidental: accidental === '#' ? 'sharp' : accidental === 'b' ? 'flat' : null,
    octave
  };
}

export function formatPitch(note: NoteName, accidental: 'sharp' | 'flat' | null, octave: Octave): string {
  const accidentalStr = accidental === 'sharp' ? '#' : accidental === 'flat' ? 'b' : '';
  return `${note}${accidentalStr}${octave}`;
}

export function getDurationValue(duration: Duration | DottedDuration): number {
  const baseDuration = typeof duration === 'object' ? duration.duration : duration;
  const dots = typeof duration === 'object' ? duration.dots : 0;
  
  const baseValues: Record<Duration, number> = {
    'whole': 1,
    'half': 0.5,
    'quarter': 0.25,
    'eighth': 0.125,
    'sixteenth': 0.0625,
    'thirty-second': 0.03125,
    'sixty-fourth': 0.015625
  };
  
  let value = baseValues[baseDuration];
  let dotValue = value;
  
  for (let i = 0; i < dots; i++) {
    dotValue /= 2;
    value += dotValue;
  }
  
  return value;
}

export function calculateFragmentDuration(
  elements: MusicalElement[],
  timeSignature: TimeSignature
): string {
  let totalBeats = 0;
  
  for (const element of elements) {
    if (element.type === 'note' || element.type === 'rest' || element.type === 'chord') {
      const duration = getDurationValue(element.duration);
      totalBeats += duration * timeSignature.denominator;
    }
  }
  
  const measures = Math.floor(totalBeats / timeSignature.numerator);
  const remainingBeats = totalBeats % timeSignature.numerator;
  
  if (remainingBeats === 0) {
    return `${measures}`;
  } else {
    return `${measures}.${remainingBeats}/${timeSignature.numerator}`;
  }
}

export function countMeasures(elements: MusicalElement[]): number {
  return elements.filter(e => e.type === 'barline').length;
}

export function transposeNote(
  pitch: string,
  semitones: number
): string {
  const parsed = parsePitchString(pitch);
  if (!parsed) return pitch;
  
  const semitoneMap: Record<string, number> = {
    'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
  };
  
  let currentSemitone = semitoneMap[parsed.note];
  if (parsed.accidental === 'sharp') currentSemitone += 1;
  if (parsed.accidental === 'flat') currentSemitone -= 1;
  
  currentSemitone += parsed.octave * 12;
  
  const newSemitone = currentSemitone + semitones;
  const newOctave = Math.floor(newSemitone / 12) as Octave;
  const noteInOctave = ((newSemitone % 12) + 12) % 12;
  
  // Find closest natural note
  let closestNote: NoteName = 'C';
  let accidental: 'sharp' | 'flat' | null = null;
  
  for (const [note, baseSemitone] of Object.entries(semitoneMap)) {
    if (baseSemitone === noteInOctave) {
      closestNote = note as NoteName;
      break;
    } else if (baseSemitone === noteInOctave - 1) {
      closestNote = note as NoteName;
      accidental = 'sharp';
      break;
    } else if (baseSemitone === noteInOctave + 1) {
      closestNote = note as NoteName;
      accidental = 'flat';
      break;
    }
  }
  
  return formatPitch(closestNote, accidental, newOctave);
}

export function createEmptyFragment(
  timeSignature = { numerator: 4, denominator: 4 },
  keySignature = { key: 'C', mode: 'major' as 'major' | 'minor' },
  tempo = 120
) {
  return {
    id: `fragment_${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeSignature,
    keySignature,
    tempo,
    elements: [],
    metadata: {
      measures: 0,
      totalDuration: '0'
    }
  };
}

export function isNoteElement(element: MusicalElement): element is Note {
  return element.type === 'note';
}

export function isRestElement(element: MusicalElement): element is Rest {
  return element.type === 'rest';
}

export function getDurationFromKeyNumber(key: string): Duration | null {
  const durationMap: Record<string, Duration> = {
    '1': 'whole',
    '2': 'half',
    '4': 'quarter',
    '8': 'eighth',
    '6': 'sixteenth'
  };
  
  return durationMap[key] || null;
}