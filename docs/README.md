# Real-Time Music Notation Documentation

Welcome to the documentation for the Real-Time Music Notation library!

## Quick Links

- **[Tutorial](./tutorial.md)** - Step-by-step guide to get started
- **[API Reference](./api.md)** - Complete API documentation
- **[Examples](../examples/)** - Working examples and demos

## What is Real-Time Music Notation?

Real-Time Music Notation is a browser-based JavaScript library that enables musicians, conductors, and educators to quickly capture musical ideas through keyboard shortcuts. It's designed for scenarios where traditional notation software is too slow or cumbersome.

## Key Features

- **Fast Input**: Optimized keyboard shortcuts for rapid note entry
- **Real-Time Preview**: See your notation as you type
- **Multiple Renderers**: Support for VexFlow, ABC.js, and OpenSheetMusicDisplay
- **Customizable**: Flexible key mappings and configuration options
- **Event-Driven**: Rich event system for integration
- **Automatic Beaming**: Smart grouping of eighth and sixteenth notes

## Use Cases

### For Conductors
Quickly notate musical phrases during rehearsals to communicate with performers.

### For Educators
Create musical examples on-the-fly during lessons.

### For Composers
Capture fleeting musical ideas before they disappear.

### For Developers
Build musical applications with real-time notation capabilities.

## Getting Started

1. **Install the library**:
   ```bash
   npm install realtime-music-notation
   ```

2. **Include a rendering library** (VexFlow recommended):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/vexflow@4.2.2/build/cjs/vexflow.js"></script>
   ```

3. **Initialize and start capturing**:
   ```javascript
   import { NotationCapture } from 'realtime-music-notation';
   
   const notationSystem = new NotationCapture({
     container: '#notation-preview',
     renderer: 'vexflow'
   });
   
   notationSystem.start();
   ```

## Documentation Structure

### [Tutorial](./tutorial.md)
A comprehensive guide that walks you through:
- Installation and setup
- Basic usage patterns
- Keyboard shortcuts
- Working with notes, rests, and chords
- Advanced features
- Common patterns and use cases
- Troubleshooting

### [API Reference](./api.md)
Complete technical documentation including:
- Class methods and properties
- Configuration options
- Event descriptions
- Type definitions
- Rendering adapter interface

### [Examples](../examples/)
- `basic-example-server.html` - Basic implementation with all features
- More examples coming soon!

## Keyboard Shortcuts Quick Reference

| Action | Key |
|--------|-----|
| Notes | C, D, E, F, G, A, B |
| Sharp | Shift + Note |
| Flat | Alt + Note |
| Quarter note | 4 |
| Eighth note | 8 |
| Rest | Space |
| Commit | Enter |
| Undo | Ctrl+Z |

See the [full keyboard reference](./tutorial.md#keyboard-shortcuts) in the tutorial.

## Contributing

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License. See the [LICENSE](../LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: support@your-domain.com

## Version History

See [CHANGELOG.md](../CHANGELOG.md) for release notes and version history.