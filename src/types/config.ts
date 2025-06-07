import { Duration, Octave } from './musical';

export interface KeyMappings {
  durations: Record<string, string>;
  pitches: Record<string, string>;
  modifiers: Record<string, string>;
  controls: Record<string, string>;
  articulations: Record<string, string>;
  dynamics: Record<string, string>;
}

export interface RenderingConfig {
  previewSize: 'small' | 'medium' | 'large';
  showKeySignature: boolean;
  showTimeSignature: boolean;
  autoScroll: boolean;
  highlightCurrentElement: boolean;
  theme?: 'light' | 'dark';
}

export interface BehaviorConfig {
  autoCommitDelay: number | null; // milliseconds, or null for manual commit
  undoHistorySize: number;
  defaultDuration: Duration;
  defaultOctave: Octave;
  chordModeTimeout: number; // milliseconds to wait for chord notes
  errorRecoveryMode: 'strict' | 'lenient';
  debounceDelay: number; // milliseconds for preview updates
}

export interface NotationConfig {
  keyMappings: KeyMappings | 'default';
  rendering: RenderingConfig;
  behavior: BehaviorConfig;
}

export interface NotationCaptureOptions {
  container: string | HTMLElement;
  renderer: 'vexflow' | 'abcjs' | 'osmd';
  keyMappings?: KeyMappings | 'default';
  rendering?: Partial<RenderingConfig>;
  behavior?: Partial<BehaviorConfig>;
  onFragmentCommit?: (fragment: any) => void | Promise<void>;
  debug?: boolean;
}

export const DEFAULT_KEY_MAPPINGS: KeyMappings = {
  durations: {
    '1': 'whole',
    '2': 'half',
    '4': 'quarter',
    '8': 'eighth',
    '6': 'sixteenth',
    '3': 'dotted-quarter',
    '7': 'triplet-eighth'
  },
  pitches: {
    'c': 'C',
    'd': 'D',
    'e': 'E',
    'f': 'F',
    'g': 'G',
    'a': 'A',
    'b': 'B'
  },
  modifiers: {
    'shift': 'sharp',
    'alt': 'flat',
    'ctrl': 'chord'
  },
  controls: {
    'Enter': 'commit',
    'Space': 'rest',
    'Backspace': 'delete',
    'Tab': 'barline',
    'Escape': 'clear',
    'ArrowUp': 'octave-up',
    'ArrowDown': 'octave-down',
    '0': 'octave-reset',
    '.': 'add-dot',
    't': 'toggle-triplet',
    'r': 'rest',
    'z': 'undo',
    'y': 'redo'
  },
  articulations: {
    '>': 'accent',
    '^': 'marcato',
    '~': 'trill',
    '-': 'tenuto',
    "'": 'staccato'
  },
  dynamics: {
    'F1': 'pp',
    'F2': 'p',
    'F3': 'mp',
    'F4': 'mf',
    'F5': 'f',
    'F6': 'ff',
    'F7': 'fff',
    'F8': 'ffff'
  }
};

export const DEFAULT_RENDERING_CONFIG: RenderingConfig = {
  previewSize: 'medium',
  showKeySignature: true,
  showTimeSignature: true,
  autoScroll: true,
  highlightCurrentElement: true,
  theme: 'light'
};

export const DEFAULT_BEHAVIOR_CONFIG: BehaviorConfig = {
  autoCommitDelay: null,
  undoHistorySize: 20,
  defaultDuration: 'quarter',
  defaultOctave: 4,
  chordModeTimeout: 2000,
  errorRecoveryMode: 'lenient',
  debounceDelay: 50
};