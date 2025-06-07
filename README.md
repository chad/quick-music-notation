# Real-Time Music Notation Library

A browser-based JavaScript/TypeScript library for real-time music notation input via keyboard shortcuts, designed for conductors to quickly capture and transmit musical ideas to performers.

## Features

- **Real-time keyboard input** - Transform keystrokes into musical notation instantly
- **Multiple renderer support** - Works with VexFlow, ABC.js, and OpenSheetMusicDisplay
- **Customizable key mappings** - Configure shortcuts to match your workflow
- **Chord input mode** - Build chords note by note
- **Fragment management** - Capture, edit, and transmit musical fragments
- **TypeScript support** - Full type definitions included
- **Event-driven architecture** - React to musical input and state changes

## Installation

```bash
npm install realtime-music-notation
```

## Basic Usage

```javascript
import { NotationCapture } from 'realtime-music-notation';

// Initialize the notation capture system
const notationSystem = new NotationCapture({
  container: '#notation-preview',
  renderer: 'vexflow', // or 'abcjs', 'osmd'
  onFragmentCommit: (fragment) => {
    // Send fragment to performers
    sendToPerformers(fragment);
  }
});

// Start capturing keyboard input
notationSystem.start();
```

## Default Keyboard Mappings

### Note Input
- **C, D, E, F, G, A, B** - Natural notes
- **Shift + Note** - Sharp
- **Alt + Note** - Flat

### Durations
- **1** - Whole note
- **2** - Half note
- **4** - Quarter note (default)
- **8** - Eighth note
- **6** - Sixteenth note

### Controls
- **Space** - Rest
- **Enter** - Commit fragment
- **Backspace** - Delete last element
- **Tab** - Insert bar line
- **↑/↓** - Change octave
- **0** - Reset to middle octave

### Articulations
- **'** - Staccato
- **>** - Accent
- **-** - Tenuto

## Advanced Features

### Chord Mode
```javascript
// Press Ctrl + Note to enter chord mode
// Add notes to build chord
// Press Enter to complete chord
```

### Custom Key Mappings
```javascript
const customMappings = {
  durations: {
    'q': 'quarter',
    'h': 'half',
    'w': 'whole'
  },
  // ... other mappings
};

notationSystem.setKeyMapping(customMappings);
```

### Event Handling
```javascript
notationSystem.on('noteAdded', (event) => {
  console.log('Note added:', event.note);
});

notationSystem.on('fragmentCommitted', (event) => {
  console.log('Fragment ready:', event.fragment);
});
```

## Fragment Structure

```typescript
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
      articulations: ["staccato"]
    },
    // ... more elements
  ],
  metadata: {
    measures: 1,
    totalDuration: "4/4"
  }
}
```

## API Reference

### Core Methods

```typescript
// Control methods
notationSystem.start()           // Begin capture mode
notationSystem.stop()            // Stop capture mode  
notationSystem.pause()           // Temporarily pause input
notationSystem.clear()           // Clear current fragment
notationSystem.commit()          // Commit and send fragment
notationSystem.undo()            // Undo last element

// Configuration methods
notationSystem.setKeyMapping(mappings)
notationSystem.setTimeSignature(4, 4)
notationSystem.setKeySignature('C', 'major')
notationSystem.setTempo(120)
```

### Events

- `noteAdded` - When a note is added
- `fragmentCommitted` - When a fragment is sent
- `modeChanged` - When input mode changes
- `error` - When an error occurs

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT