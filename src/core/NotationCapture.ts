import { EventEmitter } from './EventEmitter';
import { ShortcutEngine, KeyboardInput } from './ShortcutEngine';
import { FragmentManager } from './FragmentManager';
import { ConfigurationManager } from './ConfigurationManager';
import { PreviewRenderer } from '../rendering/PreviewRenderer';
import { 
  InputMode, 
  ModeChangedEvent,
  NoteAddedEvent,
  ElementDeletedEvent,
  FragmentClearedEvent,
  FragmentCommittedEvent,
  ErrorEvent,
  PreviewUpdatedEvent,
  ModifierChangedEvent
} from '../types/events';
import { 
  NotationCaptureOptions
} from '../types/config';
import { 
  MusicalFragment,
  Note,
  Chord
} from '../types/musical';
import { RendererAdapter } from '../rendering/interfaces';

export class NotationCapture extends EventEmitter {
  private mode: InputMode = 'STOPPED';
  private shortcutEngine: ShortcutEngine;
  private fragmentManager: FragmentManager;
  private configManager: ConfigurationManager;
  private previewRenderer: PreviewRenderer;
  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null;
  private chordModeTimer: NodeJS.Timeout | null = null;
  private onFragmentCommit?: (fragment: MusicalFragment) => void | Promise<void>;
  private debug: boolean = false;

  constructor(options: NotationCaptureOptions) {
    super();
    
    this.debug = options.debug || false;
    this.onFragmentCommit = options.onFragmentCommit;

    // Initialize configuration
    this.configManager = new ConfigurationManager({
      keyMappings: options.keyMappings || 'default',
      rendering: options.rendering,
      behavior: options.behavior
    });

    // Initialize core components
    const keyMappings = this.configManager.getKeyMappings();
    this.shortcutEngine = new ShortcutEngine(keyMappings);
    
    const behaviorConfig = this.configManager.getBehaviorConfig();
    this.fragmentManager = new FragmentManager(behaviorConfig.undoHistorySize);

    // Initialize preview renderer
    const renderingConfig = this.configManager.getRenderingConfig();
    this.previewRenderer = new PreviewRenderer(options.container, renderingConfig, behaviorConfig.debounceDelay);

    // Set up renderer adapter based on option
    this.initializeRenderer(options.renderer);

    this.debugLog('NotationCapture initialized', options);
  }

  private async initializeRenderer(rendererType: 'vexflow' | 'abcjs' | 'osmd'): Promise<void> {
    // Dynamic import of renderer adapters
    try {
      let adapter: RendererAdapter;
      
      switch (rendererType) {
        case 'vexflow':
          const { VexFlowAdapter } = await import('../rendering/adapters/VexFlowAdapter');
          adapter = new VexFlowAdapter();
          break;
        case 'abcjs':
          const { ABCJSAdapter } = await import('../rendering/adapters/ABCJSAdapter');
          adapter = new ABCJSAdapter();
          break;
        case 'osmd':
          const { OSMDAdapter } = await import('../rendering/adapters/OSMDAdapter');
          adapter = new OSMDAdapter();
          break;
      }

      this.previewRenderer.setAdapter(adapter);
    } catch (error) {
      console.error(`Failed to load ${rendererType} adapter:`, error);
      this.emitError('RENDERER_INIT_FAILED', `Failed to initialize ${rendererType} renderer`);
    }
  }

  start(): void {
    if (this.mode !== 'STOPPED') {
      return;
    }

    this.changeMode('CAPTURE');
    this.attachKeyboardListener();
    this.updatePreview();
    
    this.debugLog('NotationCapture started');
  }

  stop(): void {
    if (this.mode === 'STOPPED') {
      return;
    }

    this.changeMode('STOPPED');
    this.detachKeyboardListener();
    this.clearChordMode();
    this.previewRenderer.clear();
    
    this.debugLog('NotationCapture stopped');
  }

  pause(): void {
    if (this.mode !== 'CAPTURE' && this.mode !== 'CHORD_MODE') {
      return;
    }

    const previousMode = this.mode;
    this.changeMode('PAUSED');
    this.clearChordMode();
    
    this.debugLog('NotationCapture paused', { previousMode });
  }

  resume(): void {
    if (this.mode !== 'PAUSED') {
      return;
    }

    this.changeMode('CAPTURE');
    this.debugLog('NotationCapture resumed');
  }

  clear(): void {
    this.fragmentManager.clear();
    this.shortcutEngine.reset();
    this.updatePreview();
    
    this.emit<FragmentClearedEvent>({
      type: 'fragmentCleared',
      previousFragment: null
    });
    
    this.debugLog('Fragment cleared');
  }

  async commit(): Promise<void> {
    if (this.fragmentManager.isEmpty()) {
      this.emitError('EMPTY_FRAGMENT', 'Cannot commit empty fragment');
      return;
    }

    const fragment = this.fragmentManager.commit();
    
    this.emit<FragmentCommittedEvent>({
      type: 'fragmentCommitted',
      fragment
    });

    // Call user's commit handler
    if (this.onFragmentCommit) {
      try {
        await this.onFragmentCommit(fragment);
      } catch (error) {
        this.emitError('COMMIT_HANDLER_ERROR', `Commit handler failed: ${error}`);
      }
    }

    this.updatePreview();
    this.debugLog('Fragment committed', fragment);
  }

  undo(): void {
    const success = this.fragmentManager.undo();
    if (success) {
      this.updatePreview();
      this.debugLog('Undo performed');
    }
  }

  redo(): void {
    const success = this.fragmentManager.redo();
    if (success) {
      this.updatePreview();
      this.debugLog('Redo performed');
    }
  }

  setTimeSignature(numerator: number, denominator: number): void {
    this.fragmentManager.setTimeSignature(numerator, denominator);
    this.updatePreview();
    this.debugLog('Time signature set', { numerator, denominator });
  }

  setKeySignature(key: string, mode: 'major' | 'minor'): void {
    this.fragmentManager.setKeySignature(key, mode);
    this.updatePreview();
    this.debugLog('Key signature set', { key, mode });
  }

  setTempo(bpm: number): void {
    this.fragmentManager.setTempo(bpm);
    this.updatePreview();
    this.debugLog('Tempo set', { bpm });
  }

  setKeyMapping(mappings: any): void {
    this.configManager.setKeyMappings(mappings);
    this.shortcutEngine.updateKeyMappings(this.configManager.getKeyMappings());
    this.debugLog('Key mappings updated', mappings);
  }

  private attachKeyboardListener(): void {
    this.keyboardHandler = (event: KeyboardEvent) => {
      // Don't capture if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Prevent default for our mapped keys
      const input: KeyboardInput = {
        key: event.key,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey
      };

      const processed = this.shortcutEngine.processKeyInput(input, this.mode);
      
      if (processed.type !== 'invalid') {
        event.preventDefault();
        this.handleProcessedInput(processed);
      }
    };

    document.addEventListener('keydown', this.keyboardHandler);
  }

  private detachKeyboardListener(): void {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
      this.keyboardHandler = null;
    }
  }

  private handleProcessedInput(processed: any): void {
    this.debugLog('Processed input', processed);

    switch (processed.type) {
      case 'note':
        this.addNote(processed.data);
        break;
      
      case 'rest':
        this.addRest(processed.data);
        break;
      
      case 'chord':
        this.addChord(processed.data);
        break;
      
      case 'control':
        this.handleControlAction(processed.data);
        break;
      
      case 'modifier':
        // Modifiers update internal state, emit event and update preview
        this.emit<ModifierChangedEvent>({
          type: 'modifierChanged',
          modifier: processed.data
        });
        this.updatePreview();
        break;
      
      case 'invalid':
        this.emitError('INVALID_INPUT', processed.error || 'Invalid input');
        break;
    }
  }

  private handleControlAction(data: any): void {
    switch (data.action) {
      case 'commit':
        this.commit();
        break;
      
      case 'delete':
        this.deleteLastElement();
        break;
      
      case 'clear':
        this.clear();
        break;
      
      case 'undo':
        this.undo();
        break;
      
      case 'redo':
        this.redo();
        break;
      
      case 'enter-chord-mode':
        this.enterChordMode();
        break;
      
      default:
        if (data.element) {
          this.addElement(data.element);
        }
    }
  }

  private addNote(note: Note): void {
    const result = this.fragmentManager.addElement(note);
    
    if (result.success) {
      const index = this.fragmentManager.getElementCount() - 1;
      
      this.emit<NoteAddedEvent>({
        type: 'noteAdded',
        note,
        index
      });
      
      this.updatePreview();
      this.highlightElement(index);
    } else {
      this.emitError('ADD_NOTE_FAILED', result.error || 'Failed to add note');
    }
  }

  private addRest(rest: any): void {
    const result = this.fragmentManager.addElement(rest);
    
    if (result.success) {
      this.updatePreview();
    } else {
      this.emitError('ADD_REST_FAILED', result.error || 'Failed to add rest');
    }
  }

  private addChord(chord: Chord): void {
    const result = this.fragmentManager.addElement(chord);
    
    if (result.success) {
      this.updatePreview();
      this.exitChordMode();
    } else {
      this.emitError('ADD_CHORD_FAILED', result.error || 'Failed to add chord');
    }
  }

  private addElement(element: any): void {
    const result = this.fragmentManager.addElement(element);
    
    if (result.success) {
      this.updatePreview();
    } else {
      this.emitError('ADD_ELEMENT_FAILED', result.error || 'Failed to add element');
    }
  }

  private deleteLastElement(): void {
    const deleted = this.fragmentManager.deleteLastElement();
    
    if (deleted) {
      const index = this.fragmentManager.getElementCount();
      
      this.emit<ElementDeletedEvent>({
        type: 'elementDeleted',
        element: deleted,
        index
      });
      
      this.updatePreview();
    }
  }

  private enterChordMode(): void {
    this.changeMode('CHORD_MODE');
    this.startChordModeTimer();
  }

  private exitChordMode(): void {
    this.clearChordMode();
    this.changeMode('CAPTURE');
  }

  private startChordModeTimer(): void {
    const behaviorConfig = this.configManager.getBehaviorConfig();
    
    this.chordModeTimer = setTimeout(() => {
      if (this.shortcutEngine.checkChordModeTimeout(behaviorConfig.chordModeTimeout)) {
        // Force chord completion
        const processed = this.shortcutEngine.processKeyInput(
          { key: 'Enter', shiftKey: false, altKey: false, ctrlKey: false, metaKey: false },
          this.mode
        );
        this.handleProcessedInput(processed);
      }
    }, behaviorConfig.chordModeTimeout);
  }

  private clearChordMode(): void {
    if (this.chordModeTimer) {
      clearTimeout(this.chordModeTimer);
      this.chordModeTimer = null;
    }
    this.shortcutEngine.reset();
  }

  private changeMode(newMode: InputMode): void {
    const previousMode = this.mode;
    this.mode = newMode;
    
    this.emit<ModeChangedEvent>({
      type: 'modeChanged',
      previousMode,
      newMode
    });
  }

  private updatePreview(): void {
    const fragment = this.fragmentManager.getCurrentFragment();
    this.previewRenderer.render(fragment);
    
    this.emit<PreviewUpdatedEvent>({
      type: 'previewUpdated',
      fragment
    });
  }

  private highlightElement(index: number): void {
    if (this.configManager.getRenderingConfig().highlightCurrentElement) {
      this.previewRenderer.highlight(index);
    }
  }

  private emitError(code: string, message: string): void {
    const errorEvent: ErrorEvent = {
      type: 'error',
      error: {
        code,
        message,
        severity: 'error',
        recoverable: true
      }
    };
    
    this.emit(errorEvent);
    
    if (this.debug) {
      console.error(`[NotationCapture] ${code}: ${message}`);
    }
  }

  private debugLog(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[NotationCapture] ${message}`, data || '');
    }
  }

  getMode(): InputMode {
    return this.mode;
  }

  getCurrentFragment(): MusicalFragment {
    return this.fragmentManager.getCurrentFragment();
  }

  getCommittedFragments(): MusicalFragment[] {
    return this.fragmentManager.getCommittedFragments();
  }

  getCurrentState(): any {
    return this.shortcutEngine.getCurrentState();
  }

  destroy(): void {
    this.stop();
    this.previewRenderer.destroy();
    this.removeAllListeners();
    this.debugLog('NotationCapture destroyed');
  }
}