import { 
  MusicalFragment, 
  MusicalElement,
  TimeSignature
} from '../types/musical';
import { 
  calculateFragmentDuration, 
  countMeasures,
  createEmptyFragment
} from '../utils/musical-helpers';
import { validateMusicalElement, canAddElementToFragment } from '../utils/validation';

export interface FragmentHistoryEntry {
  fragment: MusicalFragment;
  timestamp: Date;
  action: 'add' | 'delete' | 'clear' | 'modify';
}

export class FragmentManager {
  private currentFragment: MusicalFragment;
  private history: FragmentHistoryEntry[] = [];
  private historyIndex: number = -1;
  private maxHistorySize: number;
  private committedFragments: MusicalFragment[] = [];

  constructor(
    maxHistorySize: number = 20,
    initialTimeSignature = { numerator: 4, denominator: 4 },
    initialKeySignature = { key: 'C', mode: 'major' as const },
    initialTempo = 120
  ) {
    this.maxHistorySize = maxHistorySize;
    this.currentFragment = createEmptyFragment(
      initialTimeSignature,
      initialKeySignature,
      initialTempo
    );
    this.saveToHistory('clear');
  }

  getCurrentFragment(): MusicalFragment {
    return {
      ...this.currentFragment,
      elements: [...this.currentFragment.elements],
      metadata: { ...this.currentFragment.metadata }
    };
  }

  addElement(element: MusicalElement): { success: boolean; error?: string } {
    // Validate element
    const validationErrors = validateMusicalElement(element);
    if (validationErrors.length > 0) {
      return { success: false, error: validationErrors.join('; ') };
    }

    // Check if element can be added
    const canAdd = canAddElementToFragment(element, this.currentFragment.elements);
    if (!canAdd.valid) {
      return { success: false, error: canAdd.reason };
    }

    // Add element
    this.currentFragment.elements.push(element);
    this.updateMetadata();
    this.saveToHistory('add');

    return { success: true };
  }

  deleteLastElement(): MusicalElement | null {
    if (this.currentFragment.elements.length === 0) {
      return null;
    }

    const deleted = this.currentFragment.elements.pop()!;
    this.updateMetadata();
    this.saveToHistory('delete');

    return deleted;
  }

  deleteElementAt(index: number): MusicalElement | null {
    if (index < 0 || index >= this.currentFragment.elements.length) {
      return null;
    }

    const [deleted] = this.currentFragment.elements.splice(index, 1);
    this.updateMetadata();
    this.saveToHistory('delete');

    return deleted;
  }

  clear(): void {
    const { timeSignature, keySignature, tempo } = this.currentFragment;
    this.currentFragment = createEmptyFragment(timeSignature, keySignature, tempo);
    this.saveToHistory('clear');
  }

  undo(): boolean {
    if (this.historyIndex <= 0) {
      return false;
    }

    this.historyIndex--;
    const entry = this.history[this.historyIndex];
    this.currentFragment = {
      ...entry.fragment,
      elements: [...entry.fragment.elements],
      metadata: { ...entry.fragment.metadata }
    };

    return true;
  }

  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) {
      return false;
    }

    this.historyIndex++;
    const entry = this.history[this.historyIndex];
    this.currentFragment = {
      ...entry.fragment,
      elements: [...entry.fragment.elements],
      metadata: { ...entry.fragment.metadata }
    };

    return true;
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  commit(): MusicalFragment {
    const committed = this.getCurrentFragment();
    committed.timestamp = new Date().toISOString();
    this.committedFragments.push(committed);
    
    // Clear current fragment but keep settings
    const { timeSignature, keySignature, tempo } = this.currentFragment;
    this.currentFragment = createEmptyFragment(timeSignature, keySignature, tempo);
    this.history = [];
    this.historyIndex = -1;
    this.saveToHistory('clear');

    return committed;
  }

  getCommittedFragments(): MusicalFragment[] {
    return [...this.committedFragments];
  }

  setTimeSignature(numerator: number, denominator: number): void {
    this.currentFragment.timeSignature = { numerator, denominator };
    this.updateMetadata();
    this.saveToHistory('modify');
  }

  setKeySignature(key: string, mode: 'major' | 'minor'): void {
    this.currentFragment.keySignature = { key, mode };
    this.saveToHistory('modify');
  }

  setTempo(bpm: number): void {
    this.currentFragment.tempo = bpm;
    this.saveToHistory('modify');
  }

  private updateMetadata(): void {
    this.currentFragment.metadata = {
      measures: countMeasures(this.currentFragment.elements),
      totalDuration: calculateFragmentDuration(
        this.currentFragment.elements,
        this.currentFragment.timeSignature as TimeSignature
      )
    };
  }

  private saveToHistory(action: FragmentHistoryEntry['action']): void {
    // Remove any history after current index (for redo functionality)
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Add new entry
    const entry: FragmentHistoryEntry = {
      fragment: {
        ...this.currentFragment,
        elements: [...this.currentFragment.elements],
        metadata: { ...this.currentFragment.metadata }
      },
      timestamp: new Date(),
      action
    };

    this.history.push(entry);
    this.historyIndex++;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  isEmpty(): boolean {
    return this.currentFragment.elements.length === 0;
  }

  getElementCount(): number {
    return this.currentFragment.elements.length;
  }

  getLastElement(): MusicalElement | null {
    const elements = this.currentFragment.elements;
    return elements.length > 0 ? elements[elements.length - 1] : null;
  }

  getElementAt(index: number): MusicalElement | null {
    const elements = this.currentFragment.elements;
    return index >= 0 && index < elements.length ? elements[index] : null;
  }
}