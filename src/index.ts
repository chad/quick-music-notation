// Main exports
export { NotationCapture } from './core/NotationCapture';
export { EventEmitter } from './core/EventEmitter';

// Type exports
export * from './types/musical';
export * from './types/events';
export * from './types/config';

// Renderer interfaces
export { RendererAdapter, RenderContext, RenderOptions } from './rendering/interfaces';

// Utility exports
export * from './utils/musical-helpers';
export * from './utils/validation';

// Version
export const VERSION = '1.0.0';