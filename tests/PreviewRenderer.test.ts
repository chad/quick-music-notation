import { PreviewRenderer } from '../src/rendering/PreviewRenderer';
import { VexFlowAdapter } from '../src/rendering/adapters/VexFlowAdapter';
import { MusicalFragment } from '../src/types/musical';
import { RenderingConfig } from '../src/types/config';

// Mock the adapter
jest.mock('../src/rendering/adapters/VexFlowAdapter');
jest.mock('../src/rendering/adapters/ABCJSAdapter');
jest.mock('../src/rendering/adapters/OSMDAdapter');

describe('PreviewRenderer', () => {
  let renderer: PreviewRenderer;
  let container: HTMLElement;
  let config: RenderingConfig;
  let mockAdapter: jest.Mocked<VexFlowAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);
    
    config = {
      previewSize: 'medium',
      showKeySignature: true,
      showTimeSignature: true,
      autoScroll: false,
      highlightCurrentElement: false
    };

    // Create mock adapter
    mockAdapter = {
      name: 'vexflow',
      initialize: jest.fn(),
      render: jest.fn(),
      update: jest.fn(),
      highlight: jest.fn(),
      clearHighlight: jest.fn(),
      clear: jest.fn(),
      resize: jest.fn(),
      destroy: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true)
    } as any;

    // Mock the VexFlowAdapter constructor
    (VexFlowAdapter as jest.MockedClass<typeof VexFlowAdapter>).mockImplementation(() => mockAdapter);
  });

  afterEach(() => {
    if (renderer) {
      renderer.destroy();
    }
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should initialize with VexFlow adapter', () => {
      renderer = new PreviewRenderer(container, 'vexflow', config);
      
      expect(VexFlowAdapter).toHaveBeenCalled();
      expect(mockAdapter.initialize).toHaveBeenCalledWith(container, config);
    });

    it('should throw for unsupported renderer', () => {
      expect(() => {
        new PreviewRenderer(container, 'unsupported' as any, config);
      }).toThrow('Unsupported renderer: unsupported');
    });

    it('should accept container selector', () => {
      container.id = 'notation-container';
      renderer = new PreviewRenderer('#notation-container', 'vexflow', config);
      
      expect(mockAdapter.initialize).toHaveBeenCalled();
    });

    it('should throw if container not found', () => {
      expect(() => {
        new PreviewRenderer('#non-existent', 'vexflow', config);
      }).toThrow('Container element not found: #non-existent');
    });

    it('should set up resize observer', () => {
      // Mock ResizeObserver
      const mockObserve = jest.fn();
      const mockDisconnect = jest.fn();
      
      (global as any).ResizeObserver = jest.fn().mockImplementation((callback) => ({
        observe: mockObserve,
        disconnect: mockDisconnect
      }));

      renderer = new PreviewRenderer(container, 'vexflow', config);
      
      expect(mockObserve).toHaveBeenCalledWith(container);
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      renderer = new PreviewRenderer(container, 'vexflow', config);
    });

    it('should render fragment', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [],
        metadata: { measures: 0, totalDuration: '0' }
      };

      renderer.render(fragment);
      
      expect(mockAdapter.render).toHaveBeenCalledWith(fragment);
    });

    it('should debounce rapid renders', () => {
      jest.useFakeTimers();
      
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [],
        metadata: { measures: 0, totalDuration: '0' }
      };

      // Call render multiple times rapidly
      renderer.render(fragment);
      renderer.render(fragment);
      renderer.render(fragment);
      
      expect(mockAdapter.render).not.toHaveBeenCalled();
      
      // Fast forward past debounce delay
      jest.advanceTimersByTime(100);
      
      // Should only render once
      expect(mockAdapter.render).toHaveBeenCalledTimes(1);
      
      jest.useRealTimers();
    });

    it('should handle render errors gracefully', () => {
      mockAdapter.render.mockImplementation(() => {
        throw new Error('Render failed');
      });
      
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [],
        metadata: { measures: 0, totalDuration: '0' }
      };

      // Should not throw
      expect(() => renderer.render(fragment)).not.toThrow();
      
      // Should log error
      expect(consoleError).toHaveBeenCalledWith('Rendering error:', expect.any(Error));
      
      consoleError.mockRestore();
    });
  });

  describe('Element Updates', () => {
    beforeEach(() => {
      renderer = new PreviewRenderer(container, 'vexflow', config);
    });

    it('should update elements', () => {
      const elements = [
        {
          type: 'note' as const,
          pitch: 'C4',
          duration: 'quarter' as const,
          accidental: null
        }
      ];

      renderer.update(elements);
      
      expect(mockAdapter.update).toHaveBeenCalledWith(elements);
    });

    it('should handle update errors', () => {
      mockAdapter.update.mockImplementation(() => {
        throw new Error('Update failed');
      });
      
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => renderer.update([])).not.toThrow();
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });
  });

  describe('Highlighting', () => {
    beforeEach(() => {
      renderer = new PreviewRenderer(container, 'vexflow', config);
    });

    it('should highlight element when enabled', () => {
      renderer.updateConfig({ ...config, highlightCurrentElement: true });
      
      renderer.highlight(2);
      
      expect(mockAdapter.highlight).toHaveBeenCalledWith(2);
    });

    it('should not highlight when disabled', () => {
      renderer.updateConfig({ ...config, highlightCurrentElement: false });
      
      renderer.highlight(2);
      
      expect(mockAdapter.highlight).not.toHaveBeenCalled();
    });

    it('should clear highlight', () => {
      renderer.clearHighlight();
      
      expect(mockAdapter.clearHighlight).toHaveBeenCalled();
    });
  });

  describe('Container Management', () => {
    beforeEach(() => {
      renderer = new PreviewRenderer(container, 'vexflow', config);
    });

    it('should clear container', () => {
      renderer.clear();
      
      expect(mockAdapter.clear).toHaveBeenCalled();
    });

    it('should handle resize', () => {
      renderer['handleResize']({ width: 1000, height: 300 });
      
      expect(mockAdapter.resize).toHaveBeenCalledWith(1000, 300);
    });

    it('should get adapter name', () => {
      expect(renderer.getAdapterName()).toBe('vexflow');
    });
  });

  describe('Configuration Updates', () => {
    beforeEach(() => {
      renderer = new PreviewRenderer(container, 'vexflow', config);
    });

    it('should update configuration', () => {
      const newConfig: RenderingConfig = {
        ...config,
        previewSize: 'large',
        showKeySignature: false
      };

      renderer.updateConfig(newConfig);
      
      // Should re-initialize adapter with new config
      expect(mockAdapter.initialize).toHaveBeenCalledWith(container, newConfig);
    });

    it('should change renderer type', () => {
      // Mock ABCJSAdapter
      const mockABCAdapter = {
        name: 'abcjs',
        initialize: jest.fn(),
        destroy: jest.fn(),
        isAvailable: jest.fn().mockReturnValue(true)
      } as any;

      const ABCJSAdapter = require('../src/rendering/adapters/ABCJSAdapter').ABCJSAdapter;
      (ABCJSAdapter as jest.MockedClass<any>).mockImplementation(() => mockABCAdapter);

      renderer.changeRenderer('abcjs');
      
      // Should destroy old adapter
      expect(mockAdapter.destroy).toHaveBeenCalled();
      
      // Should create new adapter
      expect(ABCJSAdapter).toHaveBeenCalled();
      expect(mockABCAdapter.initialize).toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    it('should destroy renderer and cleanup', () => {
      const mockDisconnect = jest.fn();
      (global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        disconnect: mockDisconnect
      }));

      renderer = new PreviewRenderer(container, 'vexflow', config);
      
      // Clear any pending renders
      jest.useFakeTimers();
      renderer.render({} as any);
      
      renderer.destroy();
      
      expect(mockAdapter.destroy).toHaveBeenCalled();
      expect(mockDisconnect).toHaveBeenCalled();
      
      // Should handle multiple destroy calls
      expect(() => renderer.destroy()).not.toThrow();
      
      jest.useRealTimers();
    });

    it('should cancel pending renders on destroy', () => {
      jest.useFakeTimers();
      
      renderer = new PreviewRenderer(container, 'vexflow', config);
      
      // Start a render
      renderer.render({} as any);
      
      // Destroy before render completes
      renderer.destroy();
      
      // Advance timers
      jest.advanceTimersByTime(100);
      
      // Render should not be called
      expect(mockAdapter.render).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('Error Recovery', () => {
    beforeEach(() => {
      renderer = new PreviewRenderer(container, 'vexflow', config);
    });

    it('should continue working after render error', () => {
      const fragment: MusicalFragment = {
        id: 'test',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements: [],
        metadata: { measures: 0, totalDuration: '0' }
      };

      // First render fails
      mockAdapter.render.mockImplementationOnce(() => {
        throw new Error('Render error');
      });
      
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      renderer.render(fragment);
      
      // Reset mock
      mockAdapter.render.mockClear();
      
      // Second render should work
      renderer.render(fragment);
      
      expect(mockAdapter.render).toHaveBeenCalledWith(fragment);
      
      consoleError.mockRestore();
    });
  });
});