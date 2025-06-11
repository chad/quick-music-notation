# API Reference

## Table of Contents

1. [NotationCapture](#notationcapture)
2. [Configuration](#configuration)
3. [Events](#events)
4. [Types](#types)
5. [Rendering Adapters](#rendering-adapters)

## NotationCapture

The main class for capturing musical notation input.

### Constructor

```typescript
new NotationCapture(options: NotationCaptureOptions)
```

#### NotationCaptureOptions

```typescript
interface NotationCaptureOptions {
  container: string | HTMLElement;        // Selector or element for preview
  renderer: 'vexflow' | 'abcjs' | 'osmd'; // Rendering library
  keyMappings?: KeyMappings | 'default';  // Custom key mappings
  rendering?: Partial<RenderingConfig>;    // Rendering options
  behavior?: Partial<BehaviorConfig>;      // Behavior options
  onFragmentCommit?: (fragment: MusicalFragment) => void | Promise<void>;
  debug?: boolean;                         // Enable debug logging
}
```

### Methods

#### Control Methods

##### `start(): void`
Begins capturing keyboard input for musical notation.

```javascript
notationSystem.start();
```

##### `stop(): void`
Stops capturing and clears the current fragment.

```javascript
notationSystem.stop();
```

##### `pause(): void`
Temporarily pauses input capture while preserving the current fragment.

```javascript
notationSystem.pause();
```

##### `resume(): void`
Resumes input capture from a paused state.

```javascript
notationSystem.resume();
```

#### Fragment Management

##### `clear(): void`
Clears the current fragment without committing it.

```javascript
notationSystem.clear();
```

##### `commit(): Promise<void>`
Commits the current fragment and triggers the onFragmentCommit callback.

```javascript
await notationSystem.commit();
```

##### `undo(): void`
Undoes the last action.

```javascript
notationSystem.undo();
```

##### `redo(): void`
Redoes the last undone action.

```javascript
notationSystem.redo();
```

#### Configuration Methods

##### `setKeyMapping(mappings: KeyMappings): void`
Updates the keyboard mappings.

```javascript
notationSystem.setKeyMapping({
  durations: { '1': 'whole', '2': 'half' },
  pitches: { 'c': 'C', 'd': 'D' }
  // ... other mappings
});
```

##### `setTimeSignature(numerator: number, denominator: number): void`
Sets the time signature for new fragments.

```javascript
notationSystem.setTimeSignature(3, 4); // 3/4 time
```

##### `setKeySignature(key: string, mode: 'major' | 'minor'): void`
Sets the key signature for new fragments.

```javascript
notationSystem.setKeySignature('G', 'major');
```

##### `setTempo(bpm: number): void`
Sets the tempo in beats per minute.

```javascript
notationSystem.setTempo(120);
```

#### State Methods

##### `getMode(): InputMode`
Returns the current input mode.

```javascript
const mode = notationSystem.getMode(); // 'CAPTURE', 'PAUSED', 'STOPPED', etc.
```

##### `getCurrentFragment(): MusicalFragment`
Returns the current working fragment.

```javascript
const fragment = notationSystem.getCurrentFragment();
```

##### `getCurrentState(): ShortcutEngineState`
Returns the current state of the shortcut engine.

```javascript
const state = notationSystem.getCurrentState();
// { duration: 'quarter', octave: 4, isDotted: false, isTriplet: false }
```

##### `getCommittedFragments(): MusicalFragment[]`
Returns all committed fragments in the current session.

```javascript
const fragments = notationSystem.getCommittedFragments();
```

#### Lifecycle

##### `destroy(): void`
Cleans up resources and removes event listeners.

```javascript
notationSystem.destroy();
```

## Configuration

### KeyMappings

```typescript
interface KeyMappings {
  durations: Record<string, string>;
  pitches: Record<string, string>;
  modifiers: Record<string, string>;
  controls: Record<string, string>;
  articulations: Record<string, string>;
  dynamics: Record<string, string>;
}
```

#### Default Key Mappings

```javascript
const DEFAULT_KEY_MAPPINGS = {
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
    'c': 'C', 'd': 'D', 'e': 'E', 'f': 'F',
    'g': 'G', 'a': 'A', 'b': 'B'
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
    'T': 'toggle-triplet'
  },
  articulations: {
    "'": 'staccato',
    '>': 'accent',
    '-': 'tenuto',
    '^': 'marcato',
    '~': 'trill'
  },
  dynamics: {
    'F1': 'pp', 'F2': 'p', 'F3': 'mp', 'F4': 'mf',
    'F5': 'f', 'F6': 'ff', 'F7': 'fff', 'F8': 'ffff'
  }
};
```

### RenderingConfig

```typescript
interface RenderingConfig {
  previewSize: 'small' | 'medium' | 'large';
  showKeySignature: boolean;
  showTimeSignature: boolean;
  autoScroll: boolean;
  highlightCurrentElement: boolean;
  theme?: 'light' | 'dark';
}
```

### BehaviorConfig

```typescript
interface BehaviorConfig {
  autoCommitDelay: number | null;      // ms, null for manual only
  undoHistorySize: number;             // Number of undo levels
  defaultDuration: Duration;           // Initial note duration
  defaultOctave: Octave;              // Initial octave (0-8)
  chordModeTimeout: number;           // ms to wait for chord notes
  errorRecoveryMode: 'strict' | 'lenient';
  debounceDelay: number;              // ms for preview updates
}
```

## Events

### Event Subscription

```javascript
notationSystem.on(eventType, listener);
notationSystem.off(eventType, listener);
```

### Event Types

#### `noteAdded`
Fired when a note is added to the fragment.

```javascript
notationSystem.on('noteAdded', (event) => {
  console.log('Note:', event.note);
  console.log('Index:', event.index);
});
```

#### `elementDeleted`
Fired when an element is deleted.

```javascript
notationSystem.on('elementDeleted', (event) => {
  console.log('Deleted:', event.element);
  console.log('Index:', event.index);
});
```

#### `fragmentCleared`
Fired when the fragment is cleared.

```javascript
notationSystem.on('fragmentCleared', (event) => {
  console.log('Previous fragment:', event.previousFragment);
});
```

#### `fragmentCommitted`
Fired when a fragment is committed.

```javascript
notationSystem.on('fragmentCommitted', (event) => {
  console.log('Fragment:', event.fragment);
});
```

#### `modeChanged`
Fired when the input mode changes.

```javascript
notationSystem.on('modeChanged', (event) => {
  console.log('Previous mode:', event.previousMode);
  console.log('New mode:', event.newMode);
});
```

#### `modifierChanged`
Fired when a modifier (duration, octave, etc.) changes.

```javascript
notationSystem.on('modifierChanged', (event) => {
  console.log('Modifier:', event.modifier);
  // { duration: 'quarter', dotted: false, triplet: false, octave: 4 }
});
```

#### `error`
Fired when an error occurs.

```javascript
notationSystem.on('error', (event) => {
  console.error('Error:', event.error);
  // { code: 'INVALID_INPUT', message: '...', severity: 'error', recoverable: true }
});
```

#### `keyMappingChanged`
Fired when key mappings are updated.

```javascript
notationSystem.on('keyMappingChanged', (event) => {
  console.log('Previous:', event.previousMappings);
  console.log('New:', event.newMappings);
});
```

#### `previewUpdated`
Fired when the preview is updated.

```javascript
notationSystem.on('previewUpdated', (event) => {
  console.log('Fragment:', event.fragment);
  console.log('Render data:', event.renderData);
});
```

## Types

### Musical Types

#### `Note`
```typescript
interface Note {
  type: 'note';
  pitch: string;              // e.g., "C4", "F#5"
  duration: Duration | DottedDuration;
  accidental?: 'sharp' | 'flat' | 'natural';
  articulations?: Articulation[];
  dynamics?: Dynamic;
  tuplet?: 'triplet' | 'duplet';
}
```

#### `Rest`
```typescript
interface Rest {
  type: 'rest';
  duration: Duration | DottedDuration;
}
```

#### `Chord`
```typescript
interface Chord {
  type: 'chord';
  pitches: string[];          // e.g., ["C4", "E4", "G4"]
  duration: Duration | DottedDuration;
  articulations?: Articulation[];
}
```

#### `Barline`
```typescript
interface Barline {
  type: 'barline';
  style: 'single' | 'double' | 'end' | 'repeat-start' | 'repeat-end';
}
```

#### `Duration`
```typescript
type Duration = 'whole' | 'half' | 'quarter' | 'eighth' | 
                'sixteenth' | 'thirty-second' | 'sixty-fourth';
```

#### `DottedDuration`
```typescript
interface DottedDuration {
  duration: Duration;
  dots: number;              // Usually 1 or 2
}
```

#### `MusicalFragment`
```typescript
interface MusicalFragment {
  id: string;
  timestamp: string;         // ISO 8601
  timeSignature: TimeSignature;
  keySignature: KeySignature;
  tempo: number;             // BPM
  elements: MusicalElement[];
  metadata: {
    measures: number;
    totalDuration: string;   // e.g., "4.5/4"
  };
}
```

### Input Types

#### `InputMode`
```typescript
type InputMode = 'CAPTURE' | 'PAUSED' | 'STOPPED' | 'CHORD_MODE' | 'ERROR';
```

#### `NotationError`
```typescript
interface NotationError {
  code: string;
  message: string;
  severity: 'warning' | 'error';
  recoverable: boolean;
}
```

## Rendering Adapters

The library supports multiple rendering backends through adapters.

### RendererAdapter Interface

```typescript
interface RendererAdapter {
  name: string;
  initialize(container: HTMLElement, config: RenderingConfig): void;
  render(fragment: MusicalFragment): void;
  update(elements: MusicalElement[]): void;
  highlight(elementIndex: number): void;
  clearHighlight(): void;
  clear(): void;
  resize(width: number, height: number): void;
  destroy(): void;
  isAvailable(): boolean;
}
```

### Available Adapters

- **VexFlowAdapter**: Uses VexFlow for rendering (recommended)
- **ABCJSAdapter**: Uses ABC.js for rendering
- **OSMDAdapter**: Uses OpenSheetMusicDisplay

### Custom Adapter Example

```javascript
class CustomAdapter {
  name = 'custom';
  
  initialize(container, config) {
    // Setup your rendering context
  }
  
  render(fragment) {
    // Render the musical fragment
  }
  
  // ... implement other required methods
}

// Register the adapter
notationSystem.registerAdapter('custom', CustomAdapter);
```