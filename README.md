# Real-Time Music Notation Library

A browser-based JavaScript library for real-time music notation input via keyboard shortcuts, designed for conductors and musicians who need to quickly capture and transmit musical ideas.

## Features

- 🎹 **Fast keyboard input** - Intuitive shortcuts for notes, durations, and articulations
- 👀 **Real-time preview** - See your notation as you type
- 🎵 **Smart beaming** - Automatic grouping of eighth and sixteenth notes
- 🎯 **Multiple renderers** - Support for VexFlow, ABC.js, and OpenSheetMusicDisplay
- ⚡ **Event-driven** - Rich event system for seamless integration
- 🛠️ **Fully customizable** - Configure key mappings to match your workflow
- 📦 **TypeScript support** - Full type definitions included

## Quick Start

```bash
npm install quick-music-notation
```

```javascript
import { NotationCapture } from 'quick-music-notation';

const notationSystem = new NotationCapture({
  container: '#notation-preview',
  renderer: 'vexflow',
  onFragmentCommit: (fragment) => {
    console.log('Musical fragment:', fragment);
  }
});

notationSystem.start();
```

## Documentation

📚 **[Read the full documentation](./docs/README.md)**

- **[Tutorial](./docs/tutorial.md)** - Step-by-step guide to get started
- **[API Reference](./docs/api.md)** - Complete API documentation
- **[Examples](./examples/)** - Working demos and sample code

## Basic Usage

### Keyboard Shortcuts

| Action | Key |
|--------|-----|
| **Notes** | C, D, E, F, G, A, B |
| **Sharp** | Shift + Note |
| **Flat** | Alt + Note |
| **Durations** | 1 (whole), 2 (half), 4 (quarter), 8 (eighth), 6 (sixteenth) |
| **Rest** | Space or R |
| **Octave** | ↑/↓ arrows, 0 to reset |
| **Commit** | Enter |

### Example

```javascript
// Listen for musical events
notationSystem.on('noteAdded', (event) => {
  console.log('Note added:', event.note);
});

notationSystem.on('fragmentCommitted', (event) => {
  // Send to performers, save to database, etc.
  sendToWebSocket(event.fragment);
});

// Control the system
notationSystem.start();    // Begin capture
notationSystem.pause();    // Pause temporarily  
notationSystem.commit();   // Commit current fragment
notationSystem.clear();    // Clear and start over
```

## Use Cases

- **Conductors**: Quickly notate phrases during rehearsals
- **Music Teachers**: Create examples on-the-fly during lessons  
- **Composers**: Capture ideas before they disappear
- **Live Performance**: Real-time notation for improvisation

## Browser Support

- Chrome 90+
- Firefox 88+  
- Safari 14+
- Edge 90+

## Contributing

We welcome contributions! See our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details