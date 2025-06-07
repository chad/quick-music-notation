export type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type Accidental = 'sharp' | 'flat' | 'natural' | null;
export type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type Duration = 
  | 'whole'
  | 'half'
  | 'quarter'
  | 'eighth'
  | 'sixteenth'
  | 'thirty-second'
  | 'sixty-fourth';

export type DottedDuration = {
  duration: Duration;
  dots: number;
};

export type TupletType = 'triplet' | 'quintuplet' | 'sextuplet' | 'septuplet';

export type Articulation = 
  | 'staccato'
  | 'tenuto'
  | 'accent'
  | 'marcato'
  | 'trill';

export type Dynamic = 
  | 'pppp'
  | 'ppp'
  | 'pp'
  | 'p'
  | 'mp'
  | 'mf'
  | 'f'
  | 'ff'
  | 'fff'
  | 'ffff';

export interface Note {
  type: 'note';
  pitch: string; // e.g., 'C4', 'F#5'
  duration: Duration | DottedDuration;
  articulations?: Articulation[];
  accidental?: Accidental;
  dynamic?: Dynamic;
  tuplet?: TupletType;
}

export interface Rest {
  type: 'rest';
  duration: Duration | DottedDuration;
}

export interface Chord {
  type: 'chord';
  pitches: string[]; // e.g., ['C4', 'E4', 'G4']
  duration: Duration | DottedDuration;
  articulations?: Articulation[];
  dynamic?: Dynamic;
}

export interface Barline {
  type: 'barline';
  style?: 'single' | 'double' | 'end' | 'repeat-start' | 'repeat-end';
}

export interface TimeSignature {
  type: 'timeSignature';
  numerator: number;
  denominator: number;
}

export interface KeySignature {
  type: 'keySignature';
  key: string; // e.g., 'C', 'G', 'F'
  mode: 'major' | 'minor';
}

export interface TempoMarking {
  type: 'tempo';
  bpm: number;
  reference?: Duration;
}

export type MusicalElement = 
  | Note 
  | Rest 
  | Chord 
  | Barline 
  | TimeSignature 
  | KeySignature 
  | TempoMarking;

export interface FragmentMetadata {
  measures: number;
  totalDuration: string; // e.g., '4/4', '3.5/4'
  startTime?: Date;
  endTime?: Date;
}

export interface MusicalFragment {
  id: string;
  timestamp: string;
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  keySignature: {
    key: string;
    mode: 'major' | 'minor';
  };
  tempo: number;
  elements: MusicalElement[];
  metadata: FragmentMetadata;
}