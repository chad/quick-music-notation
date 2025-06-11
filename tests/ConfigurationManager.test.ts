import { ConfigurationManager } from '../src/core/ConfigurationManager';
import { 
  KeyMappings, 
  RenderingConfig, 
  BehaviorConfig,
  DEFAULT_KEY_MAPPINGS,
  DEFAULT_RENDERING_CONFIG,
  DEFAULT_BEHAVIOR_CONFIG
} from '../src/types/config';

describe('ConfigurationManager', () => {
  let configManager: ConfigurationManager;

  beforeEach(() => {
    configManager = new ConfigurationManager();
  });

  describe('Initialization', () => {
    it('should initialize with default configurations', () => {
      const keyMappings = configManager.getKeyMappings();
      const rendering = configManager.getRenderingConfig();
      const behavior = configManager.getBehaviorConfig();

      expect(keyMappings).toEqual(DEFAULT_KEY_MAPPINGS);
      expect(rendering).toEqual(DEFAULT_RENDERING_CONFIG);
      expect(behavior).toEqual(DEFAULT_BEHAVIOR_CONFIG);
    });

    it('should accept partial configuration overrides', () => {
      const customConfig = new ConfigurationManager({
        rendering: {
          previewSize: 'large',
          showKeySignature: false
        }
      });

      const rendering = customConfig.getRenderingConfig();
      
      expect(rendering.previewSize).toBe('large');
      expect(rendering.showKeySignature).toBe(false);
      expect(rendering.showTimeSignature).toBe(DEFAULT_RENDERING_CONFIG.showTimeSignature);
    });

    it('should accept custom key mappings', () => {
      const customMappings: KeyMappings = {
        durations: { 'q': 'quarter' },
        pitches: { 'do': 'C' },
        modifiers: {},
        controls: {},
        articulations: {},
        dynamics: {}
      };

      const customConfig = new ConfigurationManager({
        keyMappings: customMappings
      });

      expect(customConfig.getKeyMappings()).toEqual(customMappings);
    });

    it('should use default mappings when specified', () => {
      const customConfig = new ConfigurationManager({
        keyMappings: 'default'
      });

      expect(customConfig.getKeyMappings()).toEqual(DEFAULT_KEY_MAPPINGS);
    });
  });

  describe('Key Mappings', () => {
    it('should update key mappings', () => {
      const newMappings: KeyMappings = {
        durations: { 'w': 'whole' },
        pitches: { 'c': 'C' },
        modifiers: {},
        controls: {},
        articulations: {},
        dynamics: {}
      };

      configManager.setKeyMappings(newMappings);
      
      expect(configManager.getKeyMappings()).toEqual(newMappings);
    });

    it('should reset to default key mappings', () => {
      const customMappings: KeyMappings = {
        durations: { 'x': 'quarter' },
        pitches: {},
        modifiers: {},
        controls: {},
        articulations: {},
        dynamics: {}
      };

      configManager.setKeyMappings(customMappings);
      configManager.setKeyMappings('default');
      
      expect(configManager.getKeyMappings()).toEqual(DEFAULT_KEY_MAPPINGS);
    });

    it('should update individual key mapping', () => {
      configManager.updateKeyMapping('durations', 'q', 'quarter');
      
      const mappings = configManager.getKeyMappings();
      expect(mappings.durations['q']).toBe('quarter');
      // Ensure other mappings remain unchanged
      expect(mappings.durations['1']).toBe('whole');
    });

    it('should handle updating non-existent category gracefully', () => {
      const mappings = configManager.getKeyMappings();
      configManager.updateKeyMapping('durations', 'new', 'value');
      
      expect(mappings.durations['new']).toBeUndefined();
      // The update still happens
      const updatedMappings = configManager.getKeyMappings();
      expect(updatedMappings.durations['new']).toBe('value');
    });
  });

  describe('Custom Mapping Management', () => {
    it('should save and load custom mappings', () => {
      const customMappings: KeyMappings = {
        durations: { 'h': 'half' },
        pitches: { 'la': 'A' },
        modifiers: {},
        controls: {},
        articulations: {},
        dynamics: {}
      };

      configManager.saveCustomMapping('myCustom', customMappings);
      const loaded = configManager.loadCustomMapping('myCustom');
      
      expect(loaded).toEqual(customMappings);
    });

    it('should return null for non-existent custom mapping', () => {
      const loaded = configManager.loadCustomMapping('nonExistent');
      expect(loaded).toBeNull();
    });

    it('should list custom mapping names', () => {
      configManager.saveCustomMapping('preset1', DEFAULT_KEY_MAPPINGS);
      configManager.saveCustomMapping('preset2', DEFAULT_KEY_MAPPINGS);
      
      const names = configManager.getCustomMappingNames();
      expect(names).toContain('preset1');
      expect(names).toContain('preset2');
      expect(names).toHaveLength(2);
    });

    it('should overwrite existing custom mapping', () => {
      const mapping1: KeyMappings = {
        durations: { '1': 'whole' },
        pitches: {},
        modifiers: {},
        controls: {},
        articulations: {},
        dynamics: {}
      };

      const mapping2: KeyMappings = {
        durations: { '2': 'half' },
        pitches: {},
        modifiers: {},
        controls: {},
        articulations: {},
        dynamics: {}
      };

      configManager.saveCustomMapping('test', mapping1);
      configManager.saveCustomMapping('test', mapping2);
      
      const loaded = configManager.loadCustomMapping('test');
      expect(loaded).toEqual(mapping2);
    });
  });

  describe('Rendering Configuration', () => {
    it('should update rendering config', () => {
      const updates: Partial<RenderingConfig> = {
        previewSize: 'small',
        autoScroll: false,
        theme: 'dark'
      };

      configManager.updateRenderingConfig(updates);
      const config = configManager.getRenderingConfig();
      
      expect(config.previewSize).toBe('small');
      expect(config.autoScroll).toBe(false);
      expect(config.theme).toBe('dark');
      expect(config.showKeySignature).toBe(DEFAULT_RENDERING_CONFIG.showKeySignature);
    });

    it('should return a copy of rendering config', () => {
      const config1 = configManager.getRenderingConfig();
      config1.previewSize = 'large';
      
      const config2 = configManager.getRenderingConfig();
      expect(config2.previewSize).toBe(DEFAULT_RENDERING_CONFIG.previewSize);
    });
  });

  describe('Behavior Configuration', () => {
    it('should update behavior config', () => {
      const updates: Partial<BehaviorConfig> = {
        autoCommitDelay: 3000,
        undoHistorySize: 50,
        defaultOctave: 5
      };

      configManager.updateBehaviorConfig(updates);
      const config = configManager.getBehaviorConfig();
      
      expect(config.autoCommitDelay).toBe(3000);
      expect(config.undoHistorySize).toBe(50);
      expect(config.defaultOctave).toBe(5);
      expect(config.defaultDuration).toBe(DEFAULT_BEHAVIOR_CONFIG.defaultDuration);
    });

    it('should return a copy of behavior config', () => {
      const config1 = configManager.getBehaviorConfig();
      config1.defaultDuration = 'whole';
      
      const config2 = configManager.getBehaviorConfig();
      expect(config2.defaultDuration).toBe(DEFAULT_BEHAVIOR_CONFIG.defaultDuration);
    });
  });

  describe('Full Configuration', () => {
    it('should get full configuration object', () => {
      const fullConfig = configManager.getFullConfig();
      
      expect(fullConfig).toHaveProperty('keyMappings');
      expect(fullConfig).toHaveProperty('rendering');
      expect(fullConfig).toHaveProperty('behavior');
      expect(fullConfig.keyMappings).toEqual(DEFAULT_KEY_MAPPINGS);
    });

    it('should return independent copy of full config', () => {
      const config1 = configManager.getFullConfig();
      config1.rendering.previewSize = 'large';
      
      const config2 = configManager.getFullConfig();
      expect(config2.rendering.previewSize).toBe(DEFAULT_RENDERING_CONFIG.previewSize);
    });
  });

  describe('Import/Export', () => {
    it('should export configuration as JSON', () => {
      const exported = configManager.exportConfig();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('keyMappings');
      expect(parsed).toHaveProperty('rendering');
      expect(parsed).toHaveProperty('behavior');
    });

    it('should import valid configuration', () => {
      const customConfig = {
        keyMappings: {
          durations: { 'q': 'quarter' },
          pitches: { 'c': 'C' },
          modifiers: {},
          controls: {},
          articulations: {},
          dynamics: {}
        },
        rendering: {
          previewSize: 'medium' as const,
          showKeySignature: false,
          showTimeSignature: true,
          autoScroll: true,
          highlightCurrentElement: true
        },
        behavior: {
          autoCommitDelay: 2000,
          undoHistorySize: 30,
          defaultDuration: 'eighth' as const,
          defaultOctave: 3 as const,
          chordModeTimeout: 1000,
          errorRecoveryMode: 'strict' as const,
          debounceDelay: 100
        }
      };

      configManager.importConfig(JSON.stringify(customConfig));
      
      const imported = configManager.getFullConfig();
      expect(imported.keyMappings.durations['q']).toBe('quarter');
      expect(imported.rendering.showKeySignature).toBe(false);
      expect(imported.behavior.defaultOctave).toBe(3);
    });

    it('should throw on invalid JSON import', () => {
      expect(() => {
        configManager.importConfig('invalid json');
      }).toThrow('Failed to import configuration');
    });

    it('should validate imported configuration', () => {
      const invalidConfig = {
        keyMappings: 'default',
        rendering: {
          previewSize: 'invalid' as any,
          showKeySignature: true,
          showTimeSignature: true,
          autoScroll: true,
          highlightCurrentElement: true
        },
        behavior: {
          autoCommitDelay: null,
          undoHistorySize: 20,
          defaultDuration: 'quarter',
          defaultOctave: 4,
          chordModeTimeout: 500,
          errorRecoveryMode: 'strict',
          debounceDelay: 50
        }
      };

      expect(() => {
        configManager.importConfig(JSON.stringify(invalidConfig));
      }).toThrow('Invalid preview size');
    });

    it('should validate behavior config values', () => {
      const invalidBehavior = {
        keyMappings: DEFAULT_KEY_MAPPINGS,
        rendering: DEFAULT_RENDERING_CONFIG,
        behavior: {
          ...DEFAULT_BEHAVIOR_CONFIG,
          undoHistorySize: 0 // Invalid
        }
      };

      expect(() => {
        configManager.importConfig(JSON.stringify(invalidBehavior));
      }).toThrow('Undo history size must be at least 1');
    });

    it('should validate octave range', () => {
      const invalidOctave = {
        keyMappings: DEFAULT_KEY_MAPPINGS,
        rendering: DEFAULT_RENDERING_CONFIG,
        behavior: {
          ...DEFAULT_BEHAVIOR_CONFIG,
          defaultOctave: 9 as any // Invalid
        }
      };

      expect(() => {
        configManager.importConfig(JSON.stringify(invalidOctave));
      }).toThrow('Default octave must be between 0 and 8');
    });

    it('should validate required key mapping categories', () => {
      const incompleteMapping = {
        keyMappings: {
          durations: {},
          pitches: {}
          // Missing required categories
        },
        rendering: DEFAULT_RENDERING_CONFIG,
        behavior: DEFAULT_BEHAVIOR_CONFIG
      };

      expect(() => {
        configManager.importConfig(JSON.stringify(incompleteMapping));
      }).toThrow('Missing required key mapping category');
    });
  });

  describe('Reset', () => {
    it('should reset to defaults', () => {
      // Make some changes
      configManager.updateRenderingConfig({ previewSize: 'large' });
      configManager.updateBehaviorConfig({ defaultOctave: 5 });
      configManager.saveCustomMapping('test', DEFAULT_KEY_MAPPINGS);
      
      // Reset
      configManager.reset();
      
      // Verify everything is back to defaults
      const rendering = configManager.getRenderingConfig();
      const behavior = configManager.getBehaviorConfig();
      const customMappings = configManager.getCustomMappingNames();
      
      expect(rendering).toEqual(DEFAULT_RENDERING_CONFIG);
      expect(behavior).toEqual(DEFAULT_BEHAVIOR_CONFIG);
      expect(customMappings).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty initialization', () => {
      const emptyConfig = new ConfigurationManager({});
      
      expect(emptyConfig.getKeyMappings()).toEqual(DEFAULT_KEY_MAPPINGS);
      expect(emptyConfig.getRenderingConfig()).toEqual(DEFAULT_RENDERING_CONFIG);
      expect(emptyConfig.getBehaviorConfig()).toEqual(DEFAULT_BEHAVIOR_CONFIG);
    });

    it('should handle partial nested configs', () => {
      const partialConfig = new ConfigurationManager({
        behavior: {
          defaultDuration: 'half'
          // Other fields should use defaults
        }
      });

      const behavior = partialConfig.getBehaviorConfig();
      expect(behavior.defaultDuration).toBe('half');
      expect(behavior.defaultOctave).toBe(DEFAULT_BEHAVIOR_CONFIG.defaultOctave);
    });
  });
});