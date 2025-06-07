import { 
  NotationConfig, 
  KeyMappings, 
  RenderingConfig, 
  BehaviorConfig,
  DEFAULT_KEY_MAPPINGS,
  DEFAULT_RENDERING_CONFIG,
  DEFAULT_BEHAVIOR_CONFIG
} from '../types/config';

export class ConfigurationManager {
  private config: NotationConfig;
  private customKeyMappings: Map<string, KeyMappings> = new Map();

  constructor(initialConfig?: {
    keyMappings?: KeyMappings | 'default';
    rendering?: Partial<RenderingConfig>;
    behavior?: Partial<BehaviorConfig>;
  }) {
    this.config = this.mergeWithDefaults(initialConfig);
  }

  private mergeWithDefaults(partial?: {
    keyMappings?: KeyMappings | 'default';
    rendering?: Partial<RenderingConfig>;
    behavior?: Partial<BehaviorConfig>;
  }): NotationConfig {
    const keyMappings = partial?.keyMappings === 'default' || !partial?.keyMappings
      ? DEFAULT_KEY_MAPPINGS
      : partial.keyMappings;

    return {
      keyMappings,
      rendering: {
        ...DEFAULT_RENDERING_CONFIG,
        ...partial?.rendering
      },
      behavior: {
        ...DEFAULT_BEHAVIOR_CONFIG,
        ...partial?.behavior
      }
    };
  }

  getKeyMappings(): KeyMappings {
    return this.config.keyMappings === 'default' 
      ? DEFAULT_KEY_MAPPINGS 
      : this.config.keyMappings;
  }

  setKeyMappings(mappings: KeyMappings | 'default'): void {
    this.config.keyMappings = mappings;
  }

  updateKeyMapping(category: keyof KeyMappings, key: string, value: string): void {
    const currentMappings = this.getKeyMappings();
    const updatedMappings = {
      ...currentMappings,
      [category]: {
        ...currentMappings[category],
        [key]: value
      }
    };
    this.config.keyMappings = updatedMappings;
  }

  saveCustomMapping(name: string, mappings: KeyMappings): void {
    this.customKeyMappings.set(name, mappings);
  }

  loadCustomMapping(name: string): KeyMappings | null {
    return this.customKeyMappings.get(name) || null;
  }

  getCustomMappingNames(): string[] {
    return Array.from(this.customKeyMappings.keys());
  }

  getRenderingConfig(): RenderingConfig {
    return { ...this.config.rendering };
  }

  updateRenderingConfig(updates: Partial<RenderingConfig>): void {
    this.config.rendering = {
      ...this.config.rendering,
      ...updates
    };
  }

  getBehaviorConfig(): BehaviorConfig {
    return { ...this.config.behavior };
  }

  updateBehaviorConfig(updates: Partial<BehaviorConfig>): void {
    this.config.behavior = {
      ...this.config.behavior,
      ...updates
    };
  }

  getFullConfig(): NotationConfig {
    return {
      keyMappings: this.getKeyMappings(),
      rendering: { ...this.config.rendering },
      behavior: { ...this.config.behavior }
    };
  }

  exportConfig(): string {
    return JSON.stringify(this.getFullConfig(), null, 2);
  }

  importConfig(configJson: string): void {
    try {
      const imported = JSON.parse(configJson) as NotationConfig;
      this.validateConfig(imported);
      this.config = imported;
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error}`);
    }
  }

  private validateConfig(config: NotationConfig): void {
    // Validate key mappings
    if (config.keyMappings !== 'default') {
      const required = ['durations', 'pitches', 'modifiers', 'controls'];
      for (const key of required) {
        if (!(key in config.keyMappings)) {
          throw new Error(`Missing required key mapping category: ${key}`);
        }
      }
    }

    // Validate rendering config
    if (!['small', 'medium', 'large'].includes(config.rendering.previewSize)) {
      throw new Error('Invalid preview size');
    }

    // Validate behavior config
    if (config.behavior.undoHistorySize < 1) {
      throw new Error('Undo history size must be at least 1');
    }

    if (config.behavior.defaultOctave < 0 || config.behavior.defaultOctave > 8) {
      throw new Error('Default octave must be between 0 and 8');
    }
  }

  reset(): void {
    this.config = this.mergeWithDefaults();
    this.customKeyMappings.clear();
  }
}