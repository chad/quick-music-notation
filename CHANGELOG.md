# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-06

### Added
- Initial release of Real-Time Music Notation library
- Core notation capture system with keyboard shortcuts
- Support for notes, rests, chords, and barlines
- VexFlow rendering adapter with automatic beaming
- Comprehensive event system
- Customizable key mappings
- Real-time preview rendering
- Undo/redo functionality
- Time and key signature support
- Articulation marks (staccato, accent, tenuto, marcato)
- Dynamic markings (pp through ffff)
- Dotted notes and triplets
- Octave control
- Fragment management and commit system
- TypeScript support with full type definitions
- Comprehensive documentation and tutorials
- Example implementations

### Features
- **Keyboard Input**: Fast note entry with intuitive shortcuts
- **Duration Control**: Number keys for note durations
- **Accidentals**: Shift for sharp, Alt for flat
- **Chord Mode**: Ctrl+Note to build chords
- **Auto-beaming**: Groups of 2 for eighths, 4 for sixteenths
- **Preview**: Real-time visual feedback
- **Events**: Rich event system for integration

### Technical
- Built with TypeScript
- Rollup for bundling (ESM, UMD, and CommonJS)
- Jest for testing
- Support for VexFlow, ABC.js, and OSMD renderers
- Browser compatibility: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Known Issues
- Dynamics (F-keys) may conflict with browser shortcuts
- Some articulations require renderer-specific implementation

## [Unreleased]

### Planned Features
- MIDI input support
- ABC notation export
- MusicXML import/export
- Additional articulations and ornaments
- Lyrics support
- Multiple voice support
- Improved touch device support
- Plugin system for custom renderers