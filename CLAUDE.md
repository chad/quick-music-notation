# Real-Time Music Notation Library Specification

## Library Overview

**Package Name:** `realtime-music-notation`  
**Purpose:** Browser-based JavaScript library for real-time music notation input via keyboard shortcuts, designed for conductors to quickly capture and transmit musical ideas to performers.

## Core Architecture

### Main Components

1. **NotationCapture** - Main class that handles keyboard input and state management
2. **ShortcutEngine** - Processes keyboard events and translates to musical elements
3. **PreviewRenderer** - Real-time visual feedback of current notation fragment
4. **FragmentManager** - Manages notation fragments and commit/send operations
5. **ConfigurationManager** - Handles customizable keyboard mappings

## API Specification

### Installation & Setup

```javascript
import { NotationCapture } from 'realtime-music-notation';

const notationSystem = new NotationCapture({
  container: '#notation-preview',
  renderer: 'vexflow', // or 'abcjs', 'osmd'
  keyMappings: 'default', // or custom mapping object
  onFragmentCommit: (fragment) => {
    // Send to external system
    sendToPerformers(fragment);
  }
});

notationSystem.start(); // Begin listening for keyboard input
```

### Core Methods

```javascript
// Primary control methods
notationSystem.start()           // Begin capture mode
notationSystem.stop()            // Stop capture mode
notationSystem.pause()           // Temporarily pause input
notationSystem.clear()           // Clear current fragment
notationSystem.commit()          // Commit and send current fragment
notationSystem.undo()            // Undo last musical element

// Configuration methods
notationSystem.setKeyMapping(mappings)
notationSystem.setTimeSignature(numerator, denominator)
notationSystem.setKeySignature(key, mode)
notationSystem.setTempo(bpm)
```

## Keyboard Mapping System

### Default Key Mappings

#### Note Durations (Primary Input Layer)
- `1` - Whole note
- `2` - Half note  
- `4` - Quarter note (default/most common)
- `8` - Eighth note
- `6` - Sixteenth note
- `3` - Dotted quarter note
- `7` - Triplet eighth note

#### Pitches (Letter Keys)
- `C` through `B` - Natural notes
- `Shift + [note]` - Sharp
- `Alt + [note]` - Flat

#### Octave Control
- `↑` - Raise octave
- `↓` - Lower octave
- `0` - Reset to middle octave (C4)

#### Rhythm & Rests
- `Space` - Rest (uses current duration)
- `R` - Explicit rest
- `.` - Add dot to current note
- `T` - Toggle triplet mode

#### Control Commands
- `Enter` - Commit fragment and send
- `Backspace` - Delete last element
- `Ctrl+Z` - Undo
- `Ctrl+C` - Copy current fragment
- `Escape` - Clear current fragment
- `Tab` - Insert bar line

#### Quick Articulations
- `>` - Accent
- `^` - Marcato  
- `~` - Trill
- `-` - Tenuto
- `'` - Staccato

### Advanced Mappings (Secondary Layer)

#### Chord Input Mode
- `Ctrl + [note keys]` - Enter chord mode, accumulate notes
- `Ctrl + Enter` - Commit chord

#### Time Signature Changes
- `Ctrl + Shift + [number]` - Quick time signature (4/4, 3/4, 2/4, etc.)

#### Dynamics
- `F1-F8` - pp, p, mp, mf, f, ff, fff, ffff
- `Shift + F1-F8` - Crescendo/diminuendo markings

## Data Structures

### Musical Fragment Object

```javascript
{
  id: "fragment_001",
  timestamp: "2025-06-07T14:30:00Z",
  timeSignature: { numerator: 4, denominator: 4 },
  keySignature: { key: "C", mode: "major" },
  tempo: 120,
  elements: [
    {
      type: "note",
      pitch: "C4",
      duration: "quarter",
      articulations: ["staccato"],
      accidental: null
    },
    {
      type: "rest",
      duration: "eighth"
    },
    {
      type: "chord",
      pitches: ["C4", "E4", "G4"],
      duration: "half"
    },
    {
      type: "barline"
    }
  ],
  metadata: {
    measures: 1,
    totalDuration: "4/4"
  }
}
```

### Configuration Object

```javascript
{
  keyMappings: {
    durations: { "4": "quarter", "8": "eighth", ... },
    pitches: { "c": "C", "d": "D", ... },
    modifiers: { "shift": "sharp", "alt": "flat" },
    controls: { "enter": "commit", "space": "rest", ... }
  },
  rendering: {
    previewSize: "small",
    showKeySignature: true,
    showTimeSignature: true,
    autoScroll: true
  },
  behavior: {
    autoCommitDelay: null, // ms, or null for manual commit
    undoHistorySize: 20,
    defaultDuration: "quarter",
    defaultOctave: 4
  }
}
```

## Event System

### Event Types

```javascript
// Input events
notationSystem.on('noteAdded', (noteData) => {});
notationSystem.on('elementDeleted', (elementData) => {});
notationSystem.on('fragmentCleared', () => {});

// State events  
notationSystem.on('modeChanged', (newMode) => {}); // capture, pause, stopped
notationSystem.on('fragmentCommitted', (fragment) => {});
notationSystem.on('error', (errorData) => {});

// User interaction events
notationSystem.on('keyMappingChanged', (newMappings) => {});
notationSystem.on('previewUpdated', (renderData) => {});
```

## Real-Time Preview Requirements

### Visual Feedback Specifications

1. **Immediate Response**: Visual update within 50ms of keystroke
2. **Current Element Highlighting**: Show what's being actively modified
3. **Error Indication**: Visual feedback for invalid input combinations
4. **Progress Indicator**: Show fragment completeness/readiness to commit

### Preview Rendering Integration

```javascript
// Support multiple rendering backends
const rendererAdapters = {
  vexflow: VexFlowAdapter,
  abcjs: ABCJSAdapter,
  osmd: OSMDAdapter
};

// Adapter interface
class RendererAdapter {
  render(fragment, container) {}
  update(newElements) {}
  highlight(elementIndex) {}
  clear() {}
}
```

## State Management

### Input States
- `CAPTURE` - Actively listening for musical input
- `PAUSED` - Temporarily stopped, maintaining current fragment  
- `STOPPED` - Not listening, fragment cleared
- `CHORD_MODE` - Accumulating chord notes
- `ERROR` - Invalid input state, awaiting correction

### Fragment Lifecycle
1. **Creation** - First musical element added
2. **Building** - Adding elements via keyboard input
3. **Preview** - Real-time visual representation
4. **Commit** - Finalize fragment and trigger send event
5. **Archive** - Store for undo/redo capabilities

## Error Handling

### Input Validation
- Invalid key combinations
- Impossible musical constructions (e.g., note + rest simultaneously)
- Octave out of range
- Duration conflicts

### Recovery Mechanisms
- Auto-correction suggestions
- Graceful fallback to previous valid state
- Clear error messaging in preview area
- Option to continue with warnings

## Performance Requirements

### Responsiveness Targets
- Keystroke to visual feedback: < 50ms
- Fragment commit processing: < 100ms
- Memory usage: < 50MB for typical session
- Support fragments up to 32 measures without performance degradation

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Integration Points

### External Communication
```javascript
// Fragment transmission interface
notationSystem.onFragmentCommit = (fragment) => {
  // Developer implements their transmission logic
  WebSocket.send(JSON.stringify(fragment));
  // or REST API call, WebRTC, etc.
};

// External control interface
window.conductorInterface = {
  emergencyStop: () => notationSystem.stop(),
  clearAll: () => notationSystem.clear(),
  setTempo: (bpm) => notationSystem.setTempo(bpm)
};
```

### Rendering Library Integration
- Must support VexFlow, ABC.js, or OpenSheetMusicDisplay
- Adapter pattern for renderer-agnostic operation
- Real-time update capabilities required

## Development Phases

### Phase 1: Core Input Engine
- Basic keyboard capture
- Note/rest input with durations
- Simple preview rendering
- Fragment commit mechanism

### Phase 2: Advanced Musical Features  
- Chord input mode
- Articulations and dynamics
- Time/key signature changes
- Enhanced error handling

### Phase 3: Performance Optimization
- Efficient state management
- Optimized rendering updates
- Memory management
- Stress testing with complex fragments

### Phase 4: Customization & Integration
- Full keyboard mapping customization
- Multiple renderer support
- External API refinement
- Documentation and examples

## Testing Requirements

### Unit Tests
- Keyboard input processing
- Musical data structure validation
- State transition logic
- Configuration management

### Integration Tests  
- Renderer adapter compatibility
- Fragment transmission
- Error recovery scenarios
- Performance benchmarking

### User Experience Tests
- Real-time responsiveness
- Intuitive key mapping effectiveness
- Visual feedback clarity
- Conductor workflow validation