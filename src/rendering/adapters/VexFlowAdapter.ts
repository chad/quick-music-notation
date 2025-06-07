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

    // Create voice with SOFT mode to allow incomplete measures
    const voice = new Voice({ 
      num_beats: fragment.timeSignature.numerator,
      beat_value: fragment.timeSignature.denominator,
      resolution: Vex.Flow.RESOLUTION
    });
    
    // Set voice to SOFT mode to allow incomplete measures
    voice.setMode(Voice.Mode.SOFT);
    voice.addTickables(notes);

    // Apply automatic beaming BEFORE formatting and drawing
    const beams = this.createBeams(notes);
    
    // Format and draw
    const formatter = new Formatter();
    // Use preCalculateMinTotalWidth to avoid strict formatting
    formatter.joinVoices([voice]);
    
    try {
      formatter.format([voice], staveWidth - 120);
    } catch (e) {
      // If formatting fails, try with auto-width
      console.warn('Voice formatting failed, using auto-width:', e);
      formatter.preCalculateMinTotalWidth([voice]);
      formatter.format([voice], 0);
    }
    
    voice.draw(this.context, this.currentStave);
    
    // Draw the beams after drawing the voice
    for (const beam of beams) {
      beam.setContext(this.context).draw();
    }
  }

  private createVexNote(note: any): any {
    const { StaveNote } = Vex.Flow;
    
    // Parse pitch - VexFlow expects format like "c/4"
    const pitchMatch = note.pitch.match(/^([A-G])([#b]?)(\d)$/);
    if (!pitchMatch) {
      console.error('Invalid pitch format:', note.pitch);
      return null;
    }
    
    const [, noteName, pitchAccidental, octave] = pitchMatch;
    // Don't include accidental in the key if we have a separate accidental property
    // This handles cases where the pitch string already has the accidental
    const baseNoteName = noteName.toLowerCase();
    const vexPitch = note.accidental ? `${baseNoteName}/${octave}` : `${baseNoteName}${pitchAccidental}/${octave}`;
    const duration = this.mapDuration(note.duration);
    
    const vexNote = new StaveNote({
      keys: [vexPitch],
      duration: duration
    });

    // Add accidental if specified separately from pitch
    if (note.accidental || pitchAccidental) {
      const accidentalType = note.accidental ? 
        (note.accidental === 'sharp' ? '#' : note.accidental === 'flat' ? 'b' : 'n') :
        pitchAccidental;
      
      if (accidentalType && typeof vexNote.addModifier === 'function') {
        vexNote.addModifier(new Vex.Flow.Accidental(accidentalType), 0);
      } else if (accidentalType && typeof vexNote.addAccidental === 'function') {
        vexNote.addAccidental(0, new Vex.Flow.Accidental(accidentalType));
      }
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
    
    // Convert pitches to VexFlow format
    const keys = chord.pitches.map((p: string) => {
      const pitchMatch = p.match(/^([A-G])([#b]?)(\d)$/);
      if (!pitchMatch) {
        console.error('Invalid pitch format in chord:', p);
        return 'c/4'; // fallback
      }
      const [, noteName, accidental, octave] = pitchMatch;
      return `${noteName.toLowerCase()}${accidental}/${octave}`;
    });
    
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

  private createBeams(notes: any[]): any[] {
    const beams: any[] = [];
    
    // Collect all beamable notes first
    let beamableNotes: any[] = [];
    
    for (let i = 0; i < notes.length; i++) {
      if (this.isBeamable(notes[i])) {
        beamableNotes.push({ note: notes[i], index: i });
      } else if (beamableNotes.length > 0) {
        // Process accumulated beamable notes when we hit a non-beamable note
        beams.push(...this.createBeamGroups(beamableNotes));
        beamableNotes = [];
      }
    }
    
    // Process any remaining beamable notes
    if (beamableNotes.length > 0) {
      beams.push(...this.createBeamGroups(beamableNotes));
    }
    
    return beams;
  }
  
  private createBeamGroups(beamableNotes: Array<{note: any, index: number}>): any[] {
    const { Beam } = Vex.Flow;
    const beams: any[] = [];
    
    // Group by 4s for sixteenth notes, by 2s for eighth notes
    let groupSize = 4;
    if (beamableNotes.length > 0) {
      const duration = beamableNotes[0].note.getDuration();
      if (duration.includes('8') && !duration.includes('16')) {
        groupSize = 2;
      }
    }
    
    // Create groups
    for (let i = 0; i < beamableNotes.length; i += groupSize) {
      const groupEnd = Math.min(i + groupSize, beamableNotes.length);
      const group = beamableNotes.slice(i, groupEnd);
      
      // Only beam if we have at least 2 notes
      if (group.length >= 2) {
        // Check if notes are consecutive in the original array
        let consecutive = true;
        for (let j = 1; j < group.length; j++) {
          if (group[j].index !== group[j-1].index + 1) {
            consecutive = false;
            break;
          }
        }
        
        if (consecutive) {
          const beam = new Beam(group.map(g => g.note));
          beams.push(beam);
        }
      }
    }
    
    return beams;
  }

  private isBeamable(note: any): boolean {
    // Check if this is a StaveNote (not a rest) with a beamable duration
    if (!note || typeof note.getDuration !== 'function') return false;
    
    const duration = note.getDuration();
    // Check if it's a note (not a rest) and has eighth or shorter duration
    return !duration.includes('r') && 
           (duration.includes('8') || 
            duration.includes('16') || 
            duration.includes('32') || 
            duration.includes('64'));
  }
}