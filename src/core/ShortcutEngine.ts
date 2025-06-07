import { 
  InputMode 
} from '../types/events';
import { KeyMappings } from '../types/config';
import { 
  Duration,
  DottedDuration,
  Note,
  Rest,
  Chord,
  Barline,
  NoteName,
  Octave,
  Articulation,
  Dynamic
} from '../types/musical';
import { 
  formatPitch
} from '../utils/musical-helpers';

export interface KeyboardInput {
  key: string;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

export interface ProcessedInput {
  type: 'note' | 'rest' | 'chord' | 'control' | 'modifier' | 'invalid';
  data?: any;
  error?: string;
}

export class ShortcutEngine {
  private keyMappings: KeyMappings;
  private currentDuration: Duration = 'quarter';
  private currentOctave: Octave = 4;
  private isDotted: boolean = false;
  private isTriplet: boolean = false;
  private chordNotes: string[] = [];
  private lastNoteTime: number = 0;

  constructor(keyMappings: KeyMappings) {
    this.keyMappings = keyMappings;
  }

  updateKeyMappings(keyMappings: KeyMappings): void {
    this.keyMappings = keyMappings;
  }

  processKeyInput(input: KeyboardInput, mode: InputMode): ProcessedInput {
    // Don't process in stopped or error mode
    if (mode === 'STOPPED' || mode === 'ERROR') {
      return { type: 'invalid', error: 'Input not accepted in current mode' };
    }

    // Check for control commands first
    const controlResult = this.processControlCommand(input);
    if (controlResult) return controlResult;

    // Check for chord mode
    if (mode === 'CHORD_MODE' && !input.ctrlKey) {
      return this.processChordNote(input);
    }

    // Check for duration change
    const durationResult = this.processDurationChange(input);
    if (durationResult) return durationResult;

    // Check for articulation
    const articulationResult = this.processArticulation(input);
    if (articulationResult) return articulationResult;

    // Check for dynamic
    const dynamicResult = this.processDynamic(input);
    if (dynamicResult) return dynamicResult;

    // Process note input
    const noteResult = this.processNoteInput(input);
    if (noteResult) return noteResult;

    return { type: 'invalid', error: 'Unrecognized input' };
  }

  private processControlCommand(input: KeyboardInput): ProcessedInput | null {
    const key = input.key;
    const control = this.keyMappings.controls[key];

    if (!control) return null;

    switch (control) {
      case 'commit':
        return { type: 'control', data: { action: 'commit' } };
      
      case 'rest':
        return this.createRest();
      
      case 'delete':
        return { type: 'control', data: { action: 'delete' } };
      
      case 'barline':
        return this.createBarline();
      
      case 'clear':
        return { type: 'control', data: { action: 'clear' } };
      
      case 'octave-up':
        return this.changeOctave(1);
      
      case 'octave-down':
        return this.changeOctave(-1);
      
      case 'octave-reset':
        this.currentOctave = 4;
        return { type: 'modifier', data: { octave: 4 } };
      
      case 'add-dot':
        this.isDotted = !this.isDotted;
        return { type: 'modifier', data: { dotted: this.isDotted } };
      
      case 'toggle-triplet':
        this.isTriplet = !this.isTriplet;
        return { type: 'modifier', data: { triplet: this.isTriplet } };
      
      case 'undo':
        if (input.ctrlKey) {
          return { type: 'control', data: { action: 'undo' } };
        }
        break;
      
      case 'redo':
        if (input.ctrlKey) {
          return { type: 'control', data: { action: 'redo' } };
        }
        break;
    }

    return null;
  }

  private processDurationChange(input: KeyboardInput): ProcessedInput | null {
    const duration = this.keyMappings.durations[input.key];
    if (!duration) return null;

    // Handle special duration mappings
    if (duration === 'dotted-quarter') {
      this.currentDuration = 'quarter';
      this.isDotted = true;
      this.isTriplet = false;
    } else if (duration === 'triplet-eighth') {
      this.currentDuration = 'eighth';
      this.isTriplet = true;
      this.isDotted = false;
    } else {
      this.currentDuration = duration as Duration;
      // Reset dotted/triplet when selecting a regular duration
      this.isDotted = false;
      this.isTriplet = false;
    }

    return { 
      type: 'modifier', 
      data: { 
        duration: this.currentDuration,
        dotted: this.isDotted,
        triplet: this.isTriplet
      } 
    };
  }

  private processArticulation(input: KeyboardInput): ProcessedInput | null {
    const articulation = this.keyMappings.articulations[input.key];
    if (!articulation) return null;

    return { 
      type: 'modifier', 
      data: { articulation: articulation as Articulation } 
    };
  }

  private processDynamic(input: KeyboardInput): ProcessedInput | null {
    const dynamic = this.keyMappings.dynamics[input.key];
    if (!dynamic) return null;

    return { 
      type: 'modifier', 
      data: { dynamic: dynamic as Dynamic } 
    };
  }

  private processNoteInput(input: KeyboardInput): ProcessedInput | null {
    const noteLetter = this.keyMappings.pitches[input.key.toLowerCase()];
    if (!noteLetter) return null;

    const note = noteLetter as NoteName;
    let accidental: 'sharp' | 'flat' | null = null;

    if (input.shiftKey) {
      accidental = 'sharp';
    } else if (input.altKey) {
      accidental = 'flat';
    }

    const pitch = formatPitch(note, accidental, this.currentOctave);

    // Check for chord mode initiation
    if (input.ctrlKey) {
      this.chordNotes = [pitch];
      this.lastNoteTime = Date.now();
      return { type: 'control', data: { action: 'enter-chord-mode' } };
    }

    // Create note
    return this.createNote(pitch, accidental);
  }

  private processChordNote(input: KeyboardInput): ProcessedInput {
    // Check for chord completion
    if (input.key === 'Enter') {
      return this.completeChord();
    }

    // Add note to chord
    const noteLetter = this.keyMappings.pitches[input.key.toLowerCase()];
    if (noteLetter) {
      const note = noteLetter as NoteName;
      let accidental: 'sharp' | 'flat' | null = null;

      if (input.shiftKey) {
        accidental = 'sharp';
      } else if (input.altKey) {
        accidental = 'flat';
      }

      const pitch = formatPitch(note, accidental, this.currentOctave);
      if (!this.chordNotes.includes(pitch)) {
        this.chordNotes.push(pitch);
      }

      this.lastNoteTime = Date.now();
      return { 
        type: 'modifier', 
        data: { chordNotes: [...this.chordNotes] } 
      };
    }

    return { type: 'invalid', error: 'Invalid chord note input' };
  }

  private createNote(pitch: string, accidental: 'sharp' | 'flat' | null): ProcessedInput {
    const duration = this.getDurationWithModifiers();
    
    const note: Note = {
      type: 'note',
      pitch,
      duration,
      accidental
    };

    if (this.isTriplet) {
      note.tuplet = 'triplet';
    }

    return { type: 'note', data: note };
  }

  private createRest(): ProcessedInput {
    const duration = this.getDurationWithModifiers();
    
    const rest: Rest = {
      type: 'rest',
      duration
    };

    return { type: 'rest', data: rest };
  }

  private createBarline(): ProcessedInput {
    const barline: Barline = {
      type: 'barline',
      style: 'single'
    };

    return { type: 'control', data: { element: barline } };
  }

  private completeChord(): ProcessedInput {
    if (this.chordNotes.length === 0) {
      return { type: 'invalid', error: 'No notes in chord' };
    }

    const duration = this.getDurationWithModifiers();
    
    const chord: Chord = {
      type: 'chord',
      pitches: [...this.chordNotes],
      duration
    };

    this.chordNotes = [];
    return { type: 'chord', data: chord };
  }

  private changeOctave(delta: number): ProcessedInput {
    const newOctave = this.currentOctave + delta;
    if (newOctave >= 0 && newOctave <= 8) {
      this.currentOctave = newOctave as Octave;
      return { type: 'modifier', data: { octave: this.currentOctave } };
    }
    return { type: 'invalid', error: 'Octave out of range' };
  }

  private getDurationWithModifiers(): Duration | DottedDuration {
    if (this.isDotted) {
      return {
        duration: this.currentDuration,
        dots: 1
      };
    }
    return this.currentDuration;
  }

  getCurrentState() {
    return {
      duration: this.currentDuration,
      octave: this.currentOctave,
      isDotted: this.isDotted,
      isTriplet: this.isTriplet,
      chordNotes: [...this.chordNotes]
    };
  }

  reset(): void {
    this.currentDuration = 'quarter';
    this.currentOctave = 4;
    this.isDotted = false;
    this.isTriplet = false;
    this.chordNotes = [];
  }

  isChordModeActive(): boolean {
    return this.chordNotes.length > 0;
  }

  checkChordModeTimeout(timeoutMs: number): boolean {
    if (this.chordNotes.length === 0) return false;
    
    const elapsed = Date.now() - this.lastNoteTime;
    if (elapsed > timeoutMs) {
      // Auto-complete chord due to timeout
      return true;
    }
    return false;
  }
}