import { RendererAdapter } from '../interfaces';
import { MusicalFragment, MusicalElement } from '../../types/musical';
import { RenderingConfig } from '../../types/config';

declare const ABCJS: any; // ABCJS global

export class ABCJSAdapter implements RendererAdapter {
  name = 'abcjs';
  private container: HTMLElement | null = null;
  private currentABC: string = '';

  initialize(container: HTMLElement, _config: RenderingConfig): void {
    this.container = container;

    if (!this.isAvailable()) {
      throw new Error('ABCJS library not found. Please include ABCJS in your project.');
    }

    // Clear container
    container.innerHTML = '';
  }

  render(fragment: MusicalFragment): void {
    if (!this.container) return;

    // Convert fragment to ABC notation
    this.currentABC = this.fragmentToABC(fragment);

    // Render with ABCJS
    ABCJS.renderAbc(this.container, this.currentABC, {
      scale: 1.0,
      staffwidth: this.container.offsetWidth - 20,
      paddingtop: 10,
      paddingbottom: 10,
      paddingleft: 10,
      paddingright: 10,
      responsive: 'resize'
    });
  }

  private fragmentToABC(fragment: MusicalFragment): string {
    let abc = 'X:1\n'; // Reference number
    abc += 'T:Music Fragment\n'; // Title
    abc += `M:${fragment.timeSignature.numerator}/${fragment.timeSignature.denominator}\n`;
    abc += 'L:1/8\n'; // Default note length
    abc += `K:${fragment.keySignature.key}${fragment.keySignature.mode === 'minor' ? 'm' : ''}\n`;
    abc += `Q:1/4=${fragment.tempo}\n`;

    // Convert elements
    let notesABC = '';
    for (const element of fragment.elements) {
      if (element.type === 'note') {
        notesABC += this.noteToABC(element) + ' ';
      } else if (element.type === 'rest') {
        notesABC += this.restToABC(element) + ' ';
      } else if (element.type === 'chord') {
        notesABC += this.chordToABC(element) + ' ';
      } else if (element.type === 'barline') {
        notesABC += '| ';
      }
    }

    abc += notesABC.trim();
    return abc;
  }

  private noteToABC(note: any): string {
    // Parse pitch
    const pitch = note.pitch;
    const noteName = pitch[0];
    const accidental = pitch.includes('#') ? '^' : pitch.includes('b') ? '_' : '';
    const octave = parseInt(pitch[pitch.length - 1]);
    
    // Convert note name to ABC
    let abcNote = noteName;
    
    // Handle octave (ABC uses lowercase for higher octave)
    if (octave >= 5) {
      abcNote = abcNote.toLowerCase();
      // Add comma for each octave above 5
      for (let i = 5; i < octave; i++) {
        abcNote += "'";
      }
    } else if (octave < 4) {
      abcNote = abcNote.toUpperCase();
      // Add apostrophe for each octave below 4
      for (let i = octave; i < 3; i++) {
        abcNote += ",";
      }
    }

    // Add accidental
    abcNote = accidental + abcNote;

    // Add duration
    const duration = this.durationToABC(note.duration);
    abcNote += duration;

    // Add articulations
    if (note.articulations) {
      for (const articulation of note.articulations) {
        abcNote += this.articulationToABC(articulation);
      }
    }

    return abcNote;
  }

  private restToABC(rest: any): string {
    const duration = this.durationToABC(rest.duration);
    return 'z' + duration;
  }

  private chordToABC(chord: any): string {
    let abcChord = '[';
    
    for (const pitch of chord.pitches) {
      const noteObj = { pitch, duration: chord.duration };
      abcChord += this.noteToABC(noteObj).replace(/\d+$/, ''); // Remove duration from individual notes
    }
    
    abcChord += ']';
    
    // Add duration to the chord
    const duration = this.durationToABC(chord.duration);
    abcChord += duration;

    return abcChord;
  }

  private durationToABC(duration: any): string {
    let baseDuration: string;
    let dots = 0;

    if (typeof duration === 'object') {
      baseDuration = duration.duration;
      dots = duration.dots || 0;
    } else {
      baseDuration = duration;
    }

    // ABC duration values (based on L:1/8)
    const durationMap: Record<string, string> = {
      'whole': '8',
      'half': '4',
      'quarter': '2',
      'eighth': '1',
      'sixteenth': '/2',
      'thirty-second': '/4',
      'sixty-fourth': '/8'
    };

    let abcDuration = durationMap[baseDuration] || '2';

    // Handle dots
    for (let i = 0; i < dots; i++) {
      abcDuration += '>';
    }

    return abcDuration;
  }

  private articulationToABC(articulation: string): string {
    const articulationMap: Record<string, string> = {
      'staccato': '.',
      'accent': 'L',
      'marcato': 'M',
      'tenuto': '-',
      'trill': 'T'
    };

    return articulationMap[articulation] || '';
  }

  update(elements: MusicalElement[]): void {
    // For ABC.js, we need to re-render the whole score
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
    // ABC.js doesn't have built-in highlighting, would need custom implementation
  }

  clearHighlight(): void {
    // Clear any custom highlighting
  }

  clear(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.currentABC = '';
  }

  resize(width: number, _height: number): void {
    // Re-render with new dimensions
    if (this.currentABC && this.container) {
      ABCJS.renderAbc(this.container, this.currentABC, {
        scale: 1.0,
        staffwidth: width - 20,
        responsive: 'resize'
      });
    }
  }

  destroy(): void {
    this.clear();
    this.container = null;
  }

  isAvailable(): boolean {
    return typeof ABCJS !== 'undefined';
  }
}