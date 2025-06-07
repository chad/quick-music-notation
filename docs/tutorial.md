# Real-Time Music Notation Tutorial

Welcome to the Real-Time Music Notation library! This tutorial will guide you through creating your first musical notation capture system.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Basic Usage](#basic-usage)
3. [Keyboard Shortcuts](#keyboard-shortcuts)
4. [Working with Notes](#working-with-notes)
5. [Advanced Features](#advanced-features)
6. [Common Patterns](#common-patterns)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

```bash
npm install realtime-music-notation
```

### Basic Setup

Create an HTML file with a container for the notation preview:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Music Notation Demo</title>
  <!-- Include a rendering library (VexFlow recommended) -->
  <script src="https://cdn.jsdelivr.net/npm/vexflow@4.2.2/build/cjs/vexflow.js"></script>
</head>
<body>
  <div id="notation-preview" style="width: 800px; height: 200px;"></div>
  <script type="module" src="app.js"></script>
</body>
</html>
```

### Initialize the Library

```javascript
import { NotationCapture } from 'realtime-music-notation';

// Create a new notation capture instance
const notationSystem = new NotationCapture({
  container: '#notation-preview',
  renderer: 'vexflow',
  keyMappings: 'default',
  onFragmentCommit: (fragment) => {
    console.log('Fragment committed:', fragment);
    // Send to your backend or process as needed
  }
});

// Start capturing keyboard input
notationSystem.start();
```

## Basic Usage

### Starting and Stopping

```javascript
// Start capturing musical input
notationSystem.start();

// Pause temporarily (preserves current fragment)
notationSystem.pause();

// Resume from pause
notationSystem.resume();

// Stop completely (clears fragment)
notationSystem.stop();
```

### Entering Your First Notes

1. Start the capture system with `notationSystem.start()`
2. Press letter keys C, D, E, F, G, A, or B to enter notes
3. Press Enter to commit your fragment

Example sequence:
- Press `4` to select quarter note duration
- Press `C` to add a C note
- Press `D` to add a D note
- Press `E` to add an E note
- Press `Enter` to commit

### Managing Fragments

```javascript
// Clear the current fragment
notationSystem.clear();

// Undo the last action
notationSystem.undo();

// Get the current fragment
const currentFragment = notationSystem.getCurrentFragment();

// Commit the current fragment
notationSystem.commit();
```

## Keyboard Shortcuts

### Note Input
| Key | Action |
|-----|--------|
| C, D, E, F, G, A, B | Enter natural notes |
| Shift + Note | Enter sharp note (e.g., Shift+C = C#) |
| Alt + Note | Enter flat note (e.g., Alt+D = Db) |

### Duration Selection
| Key | Duration |
|-----|----------|
| 1 | Whole note |
| 2 | Half note |
| 4 | Quarter note (default) |
| 8 | Eighth note |
| 6 | Sixteenth note |
| 3 | Dotted quarter note |
| 7 | Triplet eighth note |

### Octave Control
| Key | Action |
|-----|--------|
| ↑ (Up Arrow) | Raise octave |
| ↓ (Down Arrow) | Lower octave |
| 0 | Reset to middle octave (C4) |

### Other Controls
| Key | Action |
|-----|--------|
| Space or R | Insert rest |
| . (Period) | Add dot to current duration |
| Tab | Insert bar line |
| Enter | Commit fragment |
| Backspace | Delete last element |
| Escape | Clear fragment |
| Ctrl+Z | Undo |

### Articulations
| Key | Articulation |
|-----|--------------|
| ' | Staccato |
| > | Accent |
| - | Tenuto |
| ^ | Marcato |

## Working with Notes

### Changing Duration

The duration applies to all subsequent notes until changed:

```javascript
// Via keyboard
// Press '4' for quarter notes
// Press '8' for eighth notes
// Press '2' for half notes

// Monitor duration changes
notationSystem.on('modifierChanged', (event) => {
  console.log('Duration changed:', event.modifier.duration);
});
```

### Adding Accidentals

```javascript
// Via keyboard
// Shift + C = C sharp
// Alt + D = D flat

// The library automatically handles enharmonic equivalents
```

### Creating Chords

To create a chord:
1. Hold Ctrl and press a note to start chord mode
2. Press additional notes (without Ctrl) to add to the chord
3. Press Enter to complete the chord

Example:
- Ctrl+C (starts chord with C)
- E (adds E)
- G (adds G)
- Enter (creates C major triad)

### Working with Rests

```javascript
// Insert a rest with current duration
// Press Space or R

// Rests follow the same duration rules as notes
// Press '4' then Space = quarter rest
// Press '2' then Space = half rest
```

## Advanced Features

### Custom Key Mappings

```javascript
const customMappings = {
  durations: {
    'q': 'quarter',
    'h': 'half',
    'w': 'whole'
  },
  pitches: {
    'do': 'C',
    're': 'D',
    'mi': 'E'
  },
  // ... other mappings
};

notationSystem.setKeyMapping(customMappings);
```

### Event Handling

```javascript
// Note added
notationSystem.on('noteAdded', (event) => {
  console.log('Note added:', event.note);
});

// Fragment committed
notationSystem.on('fragmentCommitted', (event) => {
  console.log('Fragment ready:', event.fragment);
});

// Mode changed
notationSystem.on('modeChanged', (event) => {
  console.log('Mode:', event.newMode);
});

// Error occurred
notationSystem.on('error', (event) => {
  console.error('Error:', event.error.message);
});
```

### Time and Key Signatures

```javascript
// Set time signature
notationSystem.setTimeSignature(3, 4); // 3/4 time

// Set key signature
notationSystem.setKeySignature('G', 'major'); // G major

// Set tempo
notationSystem.setTempo(120); // 120 BPM
```

### Automatic Beaming

The library automatically beams eighth and sixteenth notes:
- Eighth notes are beamed in groups of 2
- Sixteenth notes are beamed in groups of 4

## Common Patterns

### Real-Time Performance Capture

```javascript
// Configure for live performance
const liveSystem = new NotationCapture({
  container: '#notation',
  renderer: 'vexflow',
  behavior: {
    autoCommitDelay: 5000, // Auto-commit after 5 seconds
    debounceDelay: 50 // Fast preview updates
  },
  onFragmentCommit: async (fragment) => {
    // Send to performers immediately
    await sendToWebSocket(fragment);
  }
});
```

### Educational Tool Setup

```javascript
// Configure for teaching
const teachingSystem = new NotationCapture({
  container: '#notation',
  renderer: 'vexflow',
  rendering: {
    showKeySignature: true,
    showTimeSignature: true,
    highlightCurrentElement: true
  },
  onFragmentCommit: (fragment) => {
    // Display for students
    displayForStudents(fragment);
    // Save for later review
    saveToDatabase(fragment);
  }
});

// Monitor student progress
teachingSystem.on('noteAdded', (event) => {
  checkCorrectness(event.note);
});
```

### Conductor's Quick Notation

```javascript
// Optimized for speed
const conductorSystem = new NotationCapture({
  container: '#notation',
  renderer: 'vexflow',
  behavior: {
    defaultDuration: 'quarter',
    defaultOctave: 4,
    errorRecoveryMode: 'lenient'
  }
});

// Custom shortcuts for common patterns
document.addEventListener('keydown', (e) => {
  if (e.key === 'F1') {
    // Quick C major scale
    ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'].forEach(note => {
      // Simulate note input
    });
  }
});
```

## Troubleshooting

### Common Issues

**Notes not appearing:**
- Ensure the capture system is started (`notationSystem.start()`)
- Check that you're in CAPTURE mode, not PAUSED or STOPPED
- Verify the container element exists and has dimensions

**Rendering errors:**
- Ensure VexFlow (or chosen renderer) is loaded before initializing
- Check browser console for specific error messages
- Verify the container has sufficient width/height

**Keyboard shortcuts not working:**
- Some shortcuts may conflict with browser defaults
- Try using the library in fullscreen mode
- Check if other event listeners are intercepting keystrokes

### Performance Tips

1. **Batch Operations**: When adding multiple notes programmatically, use fragment building methods
2. **Debouncing**: Adjust `debounceDelay` for optimal preview performance
3. **Memory Management**: Commit and clear fragments regularly to prevent memory buildup

### Browser Compatibility

The library works best in modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Getting Help

- Check the [API Documentation](./api.md)
- Review the [examples](../examples/)
- File issues on [GitHub](https://github.com/your-repo/issues)

## Next Steps

Now that you understand the basics:

1. Explore the [API Documentation](./api.md) for detailed method references
2. Check out the [examples folder](../examples/) for more complex use cases
3. Customize key mappings to match your workflow
4. Integrate with your backend system for persistence

Happy composing! 🎵