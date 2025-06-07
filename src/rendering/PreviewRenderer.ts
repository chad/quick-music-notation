import { MusicalFragment, MusicalElement } from '../types/musical';
import { RenderingConfig } from '../types/config';
import { RendererAdapter } from './interfaces';

export class PreviewRenderer {
  private container: HTMLElement;
  private adapter: RendererAdapter | null = null;
  private config: RenderingConfig;
  private debounceDelay: number;
  private lastRenderedFragment: MusicalFragment | null = null;
  private highlightedElement: number = -1;
  private updateTimer: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor(
    container: string | HTMLElement,
    config: RenderingConfig,
    debounceDelay: number = 50
  ) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) as HTMLElement 
      : container;
      
    if (!this.container) {
      throw new Error('Preview container not found');
    }

    this.config = config;
    this.debounceDelay = debounceDelay;
    this.setupContainer();
  }

  private setupContainer(): void {
    // Apply basic styles to container
    this.container.style.position = 'relative';
    this.container.style.overflow = 'auto';
    
    // Set size based on config
    const sizes = {
      small: { width: '400px', height: '150px' },
      medium: { width: '600px', height: '200px' },
      large: { width: '800px', height: '300px' }
    };
    
    const size = sizes[this.config.previewSize];
    this.container.style.width = size.width;
    this.container.style.height = size.height;
    
    // Apply theme
    if (this.config.theme === 'dark') {
      this.container.style.backgroundColor = '#1e1e1e';
      this.container.style.color = '#ffffff';
    } else {
      this.container.style.backgroundColor = '#ffffff';
      this.container.style.color = '#000000';
    }
  }

  setAdapter(adapter: RendererAdapter): void {
    if (this.adapter) {
      this.adapter.destroy();
    }
    
    this.adapter = adapter;
    this.adapter.initialize(this.container, this.config);
    this.isInitialized = true;
    
    // Re-render if we have a fragment
    if (this.lastRenderedFragment) {
      this.render(this.lastRenderedFragment);
    }
  }

  render(fragment: MusicalFragment): void {
    if (!this.adapter || !this.isInitialized) {
      console.warn('Renderer not initialized');
      return;
    }

    // Debounce rendering
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(() => {
      this.performRender(fragment);
    }, this.debounceDelay);
  }

  private performRender(fragment: MusicalFragment): void {
    try {
      this.adapter!.render(fragment);
      this.lastRenderedFragment = fragment;
      
      // Restore highlight if needed
      if (this.highlightedElement >= 0 && this.config.highlightCurrentElement) {
        this.adapter!.highlight(this.highlightedElement);
      }
    } catch (error) {
      console.error('Rendering error:', error);
      this.showError('Failed to render notation');
    }
  }

  update(elements: MusicalElement[]): void {
    if (!this.adapter || !this.isInitialized) {
      return;
    }

    try {
      this.adapter.update(elements);
    } catch (error) {
      console.error('Update error:', error);
    }
  }

  highlight(elementIndex: number): void {
    if (!this.adapter || !this.config.highlightCurrentElement) {
      return;
    }

    this.highlightedElement = elementIndex;
    this.adapter.highlight(elementIndex);
  }

  clearHighlight(): void {
    if (!this.adapter) {
      return;
    }

    this.highlightedElement = -1;
    this.adapter.clearHighlight();
  }

  clear(): void {
    if (!this.adapter) {
      return;
    }

    this.adapter.clear();
    this.lastRenderedFragment = null;
    this.highlightedElement = -1;
  }

  updateConfig(newConfig: Partial<RenderingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.setupContainer();
    
    if (this.adapter && this.lastRenderedFragment) {
      this.performRender(this.lastRenderedFragment);
    }
  }

  resize(width: number, height: number): void {
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;
    
    if (this.adapter) {
      this.adapter.resize(width, height);
    }
  }

  destroy(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    
    if (this.adapter) {
      this.adapter.destroy();
      this.adapter = null;
    }
    
    this.isInitialized = false;
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: #ff6b6b;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 1000;
    `;
    errorDiv.textContent = message;
    
    this.container.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }

  isReady(): boolean {
    return this.isInitialized && this.adapter !== null;
  }

  getContainer(): HTMLElement {
    return this.container;
  }

  getCurrentFragment(): MusicalFragment | null {
    return this.lastRenderedFragment;
  }
}