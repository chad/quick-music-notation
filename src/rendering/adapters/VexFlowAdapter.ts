import { RendererAdapter } from '../interfaces';
import { MusicalFragment, MusicalElement } from '../../types/musical';
import { RenderingConfig } from '../../types/config';

declare const Vex: any; // VexFlow global

export class VexFlowAdapter implements RendererAdapter {
  name = 'vexflow';
  private container: HTMLElement | null = null;
  private renderer: any = null;
  private context: any = null;
  private config: RenderingConfig | null = null;
  private currentStave: any = null;

  initialize(container: HTMLElement, config: RenderingConfig): void {
    this.container = container;
    this.config = config;

    if (!this.isAvailable()) {
      throw new Error('VexFlow library not found. Please include VexFlow in your project.');
    }

    // Clear container
    container.innerHTML = '';

    // Create renderer
    const { Renderer } = Vex.Flow;
    this.renderer = new Renderer(container, Renderer.Backends.SVG);
    
    // Size based on container
    const width = container.offsetWidth || 600;
    const height = container.offsetHeight || 200;
    this.renderer.resize(width, height);
    
    this.context = this.renderer.getContext();
  }

  render(fragment: MusicalFragment): void {
    if (!this.context || !this.container) return;

    // Clear previous render
    this.container.innerHTML = '';
    this.renderer = new Vex.Flow.Renderer(this.container, Vex.Flow.Renderer.Backends.SVG);
    const width = this.container.offsetWidth || 600;
    const height = this.container.offsetHeight || 200;
    this.renderer.resize(width, height);
    this.context = this.renderer.getContext();

    const { Stave, Voice, Formatter } = Vex.Flow;

    // Create stave
    const staveX = 10;
    const staveY = 40;
    const staveWidth = width - 20;
    
    this.currentStave = new Stave(staveX, staveY, staveWidth);

    // Add clef and time signature if configured
    if (this.config?.showKeySignature) {
      this.currentStave.addClef('treble');
    }
    
    if (this.config?.showTimeSignature) {
      this.currentStave.addTimeSignature(
        `${fragment.timeSignature.numerator}/${fragment.timeSignature.denominator}`
      );
    }

    this.currentStave.setContext(this.context).draw();

    // Convert elements to VexFlow notes
    const notes: any[] = [];
    
    for (const element of fragment.elements) {
      if (element.type === 'note') {
        const vexNote = this.createVexNote(element);
        if (vexNote) notes.push(vexNote);
      } else if (element.type === 'rest') {
        const vexRest = this.createVexRest(element);
        if (vexRest) notes.push(vexRest);
      } else if (element.type === 'chord') {
        const vexChord = this.createVexChord(element);
        if (vexChord) notes.push(vexChord);
      }
    }

    if (notes.length === 0) return;

    // Create voice and add notes
    const voice = new Voice({ 
      num_beats: fragment.timeSignature.numerator,
      beat_value: fragment.timeSignature.denominator 
    });
    voice.addTickables(notes);

    // Format and draw
    new Formatter().joinVoices([voice]).format([voice], staveWidth - 120);
    voice.draw(this.context, this.currentStave);
  }

  private createVexNote(note: any): any {
    const { StaveNote } = Vex.Flow;
    
    // Parse pitch - VexFlow expects format like "c/4"
    const pitchMatch = note.pitch.match(/^([A-G])([#b]?)(\d)$/);
    if (!pitchMatch) {
      console.error('Invalid pitch format:', note.pitch);
      return null;
    }
    
    const [, noteName, accidental, octave] = pitchMatch;
    const vexPitch = `${noteName.toLowerCase()}${accidental}/${octave}`;
    const duration = this.mapDuration(note.duration);
    
    const vexNote = new StaveNote({
      keys: [vexPitch],
      duration: duration
    });

    // Add accidental if needed
    if (note.accidental) {
      const accidental = note.accidental === 'sharp' ? '#' : 
                        note.accidental === 'flat' ? 'b' : 'n';
      vexNote.addAccidental(0, new Vex.Flow.Accidental(accidental));
    }

    // Add articulations
    if (note.articulations) {
      note.articulations.forEach((articulation: string) => {
        this.addArticulation(vexNote, articulation);
      });
    }

    return vexNote;
  }

  private createVexRest(rest: any): any {
    const { StaveNote } = Vex.Flow;
    const duration = this.mapDuration(rest.duration);
    
    return new StaveNote({
      keys: ['b/4'],
      duration: duration + 'r'
    });
  }

  private createVexChord(chord: any): any {
    const { StaveNote } = Vex.Flow;
    
    const keys = chord.pitches.map((p: string) => p.toLowerCase());
    const duration = this.mapDuration(chord.duration);
    
    const vexChord = new StaveNote({
      keys: keys,
      duration: duration
    });

    // Add articulations
    if (chord.articulations) {
      chord.articulations.forEach((articulation: string) => {
        this.addArticulation(vexChord, articulation);
      });
    }

    return vexChord;
  }

  private mapDuration(duration: any): string {
    if (typeof duration === 'object') {
      // Handle dotted notes
      const base = this.mapBaseDuration(duration.duration);
      return base + 'd'.repeat(duration.dots);
    }
    
    return this.mapBaseDuration(duration);
  }

  private mapBaseDuration(duration: string): string {
    const durationMap: Record<string, string> = {
      'whole': 'w',
      'half': 'h',
      'quarter': 'q',
      'eighth': '8',
      'sixteenth': '16',
      'thirty-second': '32',
      'sixty-fourth': '64'
    };
    
    return durationMap[duration] || 'q';
  }

  private addArticulation(note: any, articulation: string): void {
    const { Articulation } = Vex.Flow;
    
    const articulationMap: Record<string, string> = {
      'staccato': 'a.',
      'tenuto': 'a-',
      'accent': 'a>',
      'marcato': 'a^',
      'fermata': 'a@a'
    };
    
    const vexArticulation = articulationMap[articulation];
    if (vexArticulation) {
      note.addArticulation(0, new Articulation(vexArticulation));
    }
  }

  update(elements: MusicalElement[]): void {
    // For incremental updates, we'll re-render the whole fragment
    // This is a simplified implementation
    if (elements.length > 0) {
      const fragment: MusicalFragment = {
        id: 'temp',
        timestamp: new Date().toISOString(),
        timeSignature: { numerator: 4, denominator: 4 },
        keySignature: { key: 'C', mode: 'major' },
        tempo: 120,
        elements,
        metadata: { measures: 0, totalDuration: '0' }
      };
      this.render(fragment);
    }
  }

  highlight(_elementIndex: number): void {
    // In a real implementation, we would highlight the specific note
    // This requires tracking note positions during rendering
  }

  clearHighlight(): void {
    // Clear any highlighting
  }

  clear(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  resize(width: number, height: number): void {
    if (this.renderer) {
      this.renderer.resize(width, height);
    }
  }

  destroy(): void {
    this.clear();
    this.container = null;
    this.renderer = null;
    this.context = null;
    this.currentStave = null;
  }

  isAvailable(): boolean {
    return typeof Vex !== 'undefined' && Vex.Flow !== undefined;
  }
}