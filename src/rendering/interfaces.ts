import { MusicalFragment, MusicalElement } from '../types/musical';
import { RenderingConfig } from '../types/config';

export interface RendererAdapter {
  name: string;
  
  initialize(container: HTMLElement, config: RenderingConfig): void;
  
  render(fragment: MusicalFragment): void;
  
  update(elements: MusicalElement[]): void;
  
  highlight(elementIndex: number): void;
  
  clearHighlight(): void;
  
  clear(): void;
  
  resize(width: number, height: number): void;
  
  destroy(): void;
  
  isAvailable(): boolean;
}

export interface RenderContext {
  width: number;
  height: number;
  scale: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
}

export interface RenderOptions {
  context: RenderContext;
  showCursor: boolean;
  cursorPosition?: number;
  errorElements?: number[];
  theme?: 'light' | 'dark';
}

export type RendererFactory = (container: HTMLElement, config: RenderingConfig) => RendererAdapter;