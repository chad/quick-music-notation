import { VexFlowAdapter } from '../src/rendering/adapters/VexFlowAdapter';
import { MusicalFragment, Note, Rest, Chord, Barline } from '../src/types/musical';
import { RenderingConfig } from '../src/types/config';

// Mock VexFlow
const mockStave = {
  addClef: jest.fn().mockReturnThis(),
  addTimeSignature: jest.fn().mockReturnThis(),
  setContext: jest.fn().mockReturnThis(),
  draw: jest.fn()
};

const mockStaveNote = jest.fn();
const mockVoice = {
  setMode: jest.fn(),
  addTickables: jest.fn(),
  draw: jest.fn()
};

const mockFormatter = {
  joinVoices: jest.fn().mockReturnThis(),
  format: jest.fn(),
  preCalculateMinTotalWidth: jest.fn()
};

const mockBeam = {
  setContext: jest.fn().mockReturnThis(),
  draw: jest.fn()
};

const mockAccidental = jest.fn();

const mockRenderer = {
  resize: jest.fn(),
  getContext: jest.fn().mockReturnValue({})
};

// Global Vex mock
(global as any).Vex = {
  Flow: {
    Stave: jest.fn(() => mockStave),
    StaveNote: mockStaveNote,
    Voice: jest.fn(() => mockVoice),
    Formatter: jest.fn(() => mockFormatter),
    Beam: jest.fn(() => mockBeam),
    Accidental: mockAccidental,
    Renderer: jest.fn(() => mockRenderer),
    RESOLUTION: 16384
  }
};

(global as any).Vex.Flow.Renderer.Backends = { SVG: 'SVG' };
(global as any).Vex.Flow.Voice.Mode = { SOFT: 1 };

describe('VexFlowAdapter', () => {
  let adapter: VexFlowAdapter;
  let container: HTMLElement;
  let config: RenderingConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset StaveNote mock
    mockStaveNote.mockImplementation((params) => ({
      getDuration: jest.fn(() => params.duration),
      addModifier: jest.fn(),
      addAccidental: jest.fn()
    }));

    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '200px';
    
    // Mock offsetWidth/Height
    Object.defineProperty(container, 'offsetWidth', {
      value: 800,
      configurable: true
    });
    Object.defineProperty(container, 'offsetHeight', {
      value: 200,
      configurable: true
    });

    config = {
      previewSize: 'medium',
      showKeySignature: true,
      showTimeSignature: true,
      autoScroll: false,
      highlightCurrentElement: false
    };

    adapter = new VexFlowAdapter();
  });

  describe('Initialization', () => {
    it('should have correct name', () => {
      expect(adapter.name).toBe('vexflow');
    });

    it('should check if VexFlow is available', () => {
      expect(adapter.isAvailable()).toBe(true);
      
      // Test when VexFlow is not available
      const originalVex = (global as any).Vex;
      (global as any).Vex = undefined;
      expect(adapter.isAvailable()).toBe(false);
      (global as any).Vex = originalVex;
    });

    it('should initialize with container and config', () => {
      adapter.initialize(container, config);
      
      expect(Vex.Flow.Renderer).toHaveBeenCalledWith(container, 'SVG');
      expect(mockRenderer.resize).toHaveBeenCalledWith(800, 200);
    });

    it('should throw if VexFlow is not available', () => {
      const originalVex = (global as any).Vex;
      (global as any).Vex = undefined;
      
      expect(() => {
        adapter.initialize(container, config);
      }).toThrow('VexFlow library not found');
      
      (global as any).Vex = originalVex;
    });

    it('should handle container without dimensions', () => {
      const smallContainer = document.createElement('div');
      Object.defineProperty(smallContainer, 'offsetWidth', { value: 0 });
      Object.defineProperty(smallContainer, 'offsetHeight', { value: 0 });
      
      adapter.initialize(smallContainer, config);
      
      // Should use default dimensions
      expect(mockRenderer.resize).toHaveBeenCalledWith(600, 200);
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      adapter.initialize(container, config);
    });

    it('should render empty fragment', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [],
        metadata: { measures: 0, totalDuration: '0' }
      };

      adapter.render(fragment);
      
      expect(Vex.Flow.Stave).toHaveBeenCalledWith(10, 40, 780);
      expect(mockStave.addClef).toHaveBeenCalledWith('treble');
      expect(mockStave.addTimeSignature).toHaveBeenCalledWith('4/4');
      expect(mockStave.draw).toHaveBeenCalled();
    });

    it('should render notes', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [
          {
            type: 'note',
            pitch: 'C4',
            duration: 'quarter',
            accidental: null
          },
          {
            type: 'note',
            pitch: 'D#5',
            duration: 'eighth',
            accidental: 'sharp'
          }
        ],
        metadata: { measures: 1, totalDuration: '1' }
      };

      adapter.render(fragment);
      
      expect(mockStaveNote).toHaveBeenCalledWith({
        keys: ['c/4'],
        duration: 'q'
      });
      
      expect(mockStaveNote).toHaveBeenCalledWith({
        keys: ['d#/5'],
        duration: '8'
      });
      
      expect(mockVoice.addTickables).toHaveBeenCalled();
      expect(mockVoice.draw).toHaveBeenCalled();
    });

    it('should render rests', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [
          {
            type: 'rest',
            duration: 'quarter'
          },
          {
            type: 'rest',
            duration: { duration: 'half', dots: 1 }
          }
        ],
        metadata: { measures: 1, totalDuration: '1' }
      };

      adapter.render(fragment);
      
      expect(mockStaveNote).toHaveBeenCalledWith({
        keys: ['b/4'],
        duration: 'qr'
      });
      
      expect(mockStaveNote).toHaveBeenCalledWith({
        keys: ['b/4'],
        duration: 'hdr'
      });
    });

    it('should render chords', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [
          {
            type: 'chord',
            pitches: ['C4', 'E4', 'G4'],
            duration: 'half'
          }
        ],
        metadata: { measures: 1, totalDuration: '0.5' }
      };

      adapter.render(fragment);
      
      expect(mockStaveNote).toHaveBeenCalledWith({
        keys: ['c/4', 'e/4', 'g/4'],
        duration: 'h'
      });
    });

    it('should handle accidentals in notes', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [
          {
            type: 'note',
            pitch: 'F#4',
            duration: 'quarter',
            accidental: 'sharp'
          }
        ],
        metadata: { measures: 0, totalDuration: '0.25' }
      };

      adapter.render(fragment);
      
      // Note should be created without accidental in key
      expect(mockStaveNote).toHaveBeenCalledWith({
        keys: ['f/4'],
        duration: 'q'
      });
    });

    it('should skip barlines in rendering', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [
          {
            type: 'note',
            pitch: 'C4',
            duration: 'quarter',
            accidental: null
          },
          {
            type: 'barline',
            style: 'single'
          },
          {
            type: 'note',
            pitch: 'D4',
            duration: 'quarter',
            accidental: null
          }
        ],
        metadata: { measures: 1, totalDuration: '0.5' }
      };

      adapter.render(fragment);
      
      // Should create 2 notes, not 3 elements
      expect(mockStaveNote).toHaveBeenCalledTimes(2);
    });

    it('should not show clef/time signature when configured', () => {
      const customConfig = { ...config, showKeySignature: false, showTimeSignature: false };
      adapter.initialize(container, customConfig);
      
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 3, denominator: 4 },
        keySignature: { key: 'G', mode: 'major' },
        tempo: 120,
        elements: [],
        metadata: { measures: 0, totalDuration: '0' }
      };

      adapter.render(fragment);
      
      expect(mockStave.addClef).not.toHaveBeenCalled();
      expect(mockStave.addTimeSignature).not.toHaveBeenCalled();
    });

    it('should handle dotted durations', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [
          {
            type: 'note',
            pitch: 'C4',
            duration: { duration: 'quarter', dots: 1 },
            accidental: null
          },
          {
            type: 'note',
            pitch: 'D4',
            duration: { duration: 'half', dots: 2 },
            accidental: null
          }
        ],
        metadata: { measures: 1, totalDuration: '1.125' }
      };

      adapter.render(fragment);
      
      expect(mockStaveNote).toHaveBeenCalledWith({
        keys: ['c/4'],
        duration: 'qd'
      });
      
      expect(mockStaveNote).toHaveBeenCalledWith({
        keys: ['d/4'],
        duration: 'hdd'
      });
    });
  });

  describe('Beaming', () => {
    beforeEach(() => {
      adapter.initialize(container, config);
    });

    it('should beam consecutive eighth notes', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [
          { type: 'note', pitch: 'C4', duration: 'eighth', accidental: null },
          { type: 'note', pitch: 'D4', duration: 'eighth', accidental: null }
        ],
        metadata: { measures: 0, totalDuration: '0.25' }
      };

      // Mock notes that return beamable durations
      const mockNotes = [
        { getDuration: () => '8' },
        { getDuration: () => '8' }
      ];
      
      mockStaveNote
        .mockReturnValueOnce(mockNotes[0])
        .mockReturnValueOnce(mockNotes[1]);

      adapter.render(fragment);
      
      expect(Vex.Flow.Beam).toHaveBeenCalled();
      expect(mockBeam.draw).toHaveBeenCalled();
    });

    it('should not beam rests', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [
          { type: 'note', pitch: 'C4', duration: 'eighth', accidental: null },
          { type: 'rest', duration: 'eighth' },
          { type: 'note', pitch: 'D4', duration: 'eighth', accidental: null }
        ],
        metadata: { measures: 0, totalDuration: '0.375' }
      };

      const mockNotes = [
        { getDuration: () => '8' },
        { getDuration: () => '8r' }, // Rest
        { getDuration: () => '8' }
      ];
      
      mockStaveNote
        .mockReturnValueOnce(mockNotes[0])
        .mockReturnValueOnce(mockNotes[1])
        .mockReturnValueOnce(mockNotes[2]);

      adapter.render(fragment);
      
      // Should not create beams when rest interrupts
      expect(Vex.Flow.Beam).not.toHaveBeenCalled();
    });

    it('should beam in groups of 2 for eighth notes', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [
          { type: 'note', pitch: 'C4', duration: 'eighth', accidental: null },
          { type: 'note', pitch: 'D4', duration: 'eighth', accidental: null },
          { type: 'note', pitch: 'E4', duration: 'eighth', accidental: null },
          { type: 'note', pitch: 'F4', duration: 'eighth', accidental: null }
        ],
        metadata: { measures: 0, totalDuration: '0.5' }
      };

      const mockNotes = Array(4).fill(null).map(() => ({ getDuration: () => '8' }));
      
      mockNotes.forEach(note => mockStaveNote.mockReturnValueOnce(note));

      adapter.render(fragment);
      
      // Should create 2 beams (groups of 2)
      expect(Vex.Flow.Beam).toHaveBeenCalledTimes(2);
    });

    it('should beam in groups of 4 for sixteenth notes', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: Array(8).fill(null).map((_, i) => ({
          type: 'note' as const,
          pitch: 'C4',
          duration: 'sixteenth' as const,
          accidental: null
        })),
        metadata: { measures: 0, totalDuration: '0.5' }
      };

      const mockNotes = Array(8).fill(null).map(() => ({ getDuration: () => '16' }));
      
      mockNotes.forEach(note => mockStaveNote.mockReturnValueOnce(note));

      adapter.render(fragment);
      
      // Should create 2 beams (groups of 4)
      expect(Vex.Flow.Beam).toHaveBeenCalledTimes(2);
    });
  });

  describe('Update', () => {
    beforeEach(() => {
      adapter.initialize(container, config);
    });

    it('should update with new elements', () => {
      const elements = [
        {
          type: 'note' as const,
          pitch: 'G5',
          duration: 'quarter' as const,
          accidental: null
        }
      ];

      adapter.update(elements);
      
      expect(mockStaveNote).toHaveBeenCalledWith({
        keys: ['g/5'],
        duration: 'q'
      });
    });

    it('should handle empty update', () => {
      adapter.update([]);
      
      // Should not throw and should not create notes
      expect(mockStaveNote).not.toHaveBeenCalled();
    });
  });

  describe('Other Methods', () => {
    beforeEach(() => {
      adapter.initialize(container, config);
    });

    it('should clear the container', () => {
      container.innerHTML = '<div>Some content</div>';
      
      adapter.clear();
      
      expect(container.innerHTML).toBe('');
    });

    it('should resize', () => {
      adapter.resize(1000, 300);
      
      expect(mockRenderer.resize).toHaveBeenCalledWith(1000, 300);
    });

    it('should destroy and clean up', () => {
      adapter.destroy();
      
      expect(container.innerHTML).toBe('');
      
      // Should handle multiple destroy calls
      expect(() => adapter.destroy()).not.toThrow();
    });

    it('should handle highlight (no-op in current implementation)', () => {
      expect(() => adapter.highlight(0)).not.toThrow();
    });

    it('should handle clearHighlight (no-op in current implementation)', () => {
      expect(() => adapter.clearHighlight()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      adapter.initialize(container, config);
    });

    it('should handle invalid note format gracefully', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [
          {
            type: 'note',
            pitch: 'INVALID',
            duration: 'quarter',
            accidental: null
          }
        ],
        metadata: { measures: 0, totalDuration: '0.25' }
      };

      // Should log error but not throw
      expect(() => adapter.render(fragment)).not.toThrow();
    });

    it('should handle voice formatting errors', () => {
      mockFormatter.format.mockImplementationOnce(() => {
        throw new Error('Voice formatting error');
      });

      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [
          {
            type: 'note',
            pitch: 'C4',
            duration: 'quarter',
            accidental: null
          }
        ],
        metadata: { measures: 0, totalDuration: '0.25' }
      };

      // Should catch error and try alternative formatting
      expect(() => adapter.render(fragment)).not.toThrow();
      expect(mockFormatter.preCalculateMinTotalWidth).toHaveBeenCalled();
    });
  });
});