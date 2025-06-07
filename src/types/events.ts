import { MusicalElement, MusicalFragment, Note } from './musical';
import { KeyMappings } from './config';

export interface NoteAddedEvent {
  type: 'noteAdded';
  note: Note;
  index: number;
}

export interface ElementDeletedEvent {
  type: 'elementDeleted';
  element: MusicalElement;
  index: number;
}

export interface FragmentClearedEvent {
  type: 'fragmentCleared';
  previousFragment: MusicalFragment | null;
}

export interface FragmentCommittedEvent {
  type: 'fragmentCommitted';
  fragment: MusicalFragment;
}

export interface ModeChangedEvent {
  type: 'modeChanged';
  previousMode: InputMode;
  newMode: InputMode;
}

export interface ErrorEvent {
  type: 'error';
  error: NotationError;
  context?: any;
}

export interface KeyMappingChangedEvent {
  type: 'keyMappingChanged';
  previousMappings: KeyMappings;
  newMappings: KeyMappings;
}

export interface PreviewUpdatedEvent {
  type: 'previewUpdated';
  fragment: MusicalFragment;
  renderData?: any;
}

export type NotationEvent = 
  | NoteAddedEvent
  | ElementDeletedEvent
  | FragmentClearedEvent
  | FragmentCommittedEvent
  | ModeChangedEvent
  | ErrorEvent
  | KeyMappingChangedEvent
  | PreviewUpdatedEvent;

export type InputMode = 
  | 'CAPTURE'
  | 'PAUSED'
  | 'STOPPED'
  | 'CHORD_MODE'
  | 'ERROR';

export interface NotationError {
  code: string;
  message: string;
  severity: 'warning' | 'error';
  recoverable: boolean;
}


export type EventListener<T extends NotationEvent> = (event: T) => void;

export interface EventEmitter {
  on<T extends NotationEvent>(eventType: T['type'], listener: EventListener<T>): void;
  off<T extends NotationEvent>(eventType: T['type'], listener: EventListener<T>): void;
  emit<T extends NotationEvent>(event: T): void;
}