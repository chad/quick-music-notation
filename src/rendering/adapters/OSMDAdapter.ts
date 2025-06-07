import { RendererAdapter } from '../interfaces';
import { MusicalFragment, MusicalElement } from '../../types/musical';
import { RenderingConfig } from '../../types/config';

declare const opensheetmusicdisplay: any; // OSMD global

export class OSMDAdapter implements RendererAdapter {
  name = 'osmd';
  private container: HTMLElement | null = null;
  private osmd: any = null;
  private currentMusicXML: string = '';

  initialize(container: HTMLElement, _config: RenderingConfig): void {
    this.container = container;

    if (!this.isAvailable()) {
      throw new Error('OpenSheetMusicDisplay library not found. Please include OSMD in your project.');
    }

    // Clear container
    container.innerHTML = '';

    // Initialize OSMD
    this.osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container, {
      autoResize: true,
      backend: 'svg',
      drawTitle: false,
      drawComposer: false,
      drawLyricist: false,
      drawSubtitle: false,
      drawPartNames: false,
      drawingParameters: 'compact'
    });
  }

  render(fragment: MusicalFragment): void {
    if (!this.osmd || !this.container) return;

    // Convert fragment to MusicXML
    this.currentMusicXML = this.fragmentToMusicXML(fragment);

    // Load and render
    this.osmd.load(this.currentMusicXML).then(() => {
      this.osmd.render();
    }).catch((error: any) => {
      console.error('OSMD rendering error:', error);
    });
  }

  private fragmentToMusicXML(fragment: MusicalFragment): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n';
    xml += '<score-partwise version="3.1">\n';
    
    // Part list
    xml += '  <part-list>\n';
    xml += '    <score-part id="P1">\n';
    xml += '      <part-name>Music</part-name>\n';
    xml += '    </score-part>\n';
    xml += '  </part-list>\n';
    
    // Part
    xml += '  <part id="P1">\n';
    xml += '    <measure number="1">\n';
    
    // Attributes
    xml += '      <attributes>\n';
    xml += '        <divisions>4</divisions>\n';
    xml += `        <key>\n`;
    xml += `          <fifths>${this.keyToFifths(fragment.keySignature.key)}</fifths>\n`;
    xml += `          <mode>${fragment.keySignature.mode}</mode>\n`;
    xml += `        </key>\n`;
    xml += `        <time>\n`;
    xml += `          <beats>${fragment.timeSignature.numerator}</beats>\n`;
    xml += `          <beat-type>${fragment.timeSignature.denominator}</beat-type>\n`;
    xml += `        </time>\n`;
    xml += '        <clef>\n';
    xml += '          <sign>G</sign>\n';
    xml += '          <line>2</line>\n';
    xml += '        </clef>\n';
    xml += '      </attributes>\n';
    
    // Tempo
    xml += `      <direction placement="above">\n`;
    xml += `        <direction-type>\n`;
    xml += `          <metronome>\n`;
    xml += `            <beat-unit>quarter</beat-unit>\n`;
    xml += `            <per-minute>${fragment.tempo}</per-minute>\n`;
    xml += `          </metronome>\n`;
    xml += `        </direction-type>\n`;
    xml += `      </direction>\n`;
    
    // Convert elements
    let measureNumber = 1;
    for (const element of fragment.elements) {
      if (element.type === 'note') {
        xml += this.noteToMusicXML(element);
      } else if (element.type === 'rest') {
        xml += this.restToMusicXML(element);
      } else if (element.type === 'chord') {
        xml += this.chordToMusicXML(element);
      } else if (element.type === 'barline') {
        xml += '    </measure>\n';
        measureNumber++;
        xml += `    <measure number="${measureNumber}">\n`;
      }
    }
    
    xml += '    </measure>\n';
    xml += '  </part>\n';
    xml += '</score-partwise>\n';
    
    return xml;
  }

  private keyToFifths(key: string): number {
    const fifthsMap: Record<string, number> = {
      'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6,
      'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6
    };
    return fifthsMap[key] || 0;
  }

  private noteToMusicXML(note: any): string {
    const pitch = this.parsePitch(note.pitch);
    const duration = this.durationToMusicXML(note.duration);
    
    let xml = '      <note>\n';
    xml += '        <pitch>\n';
    xml += `          <step>${pitch.step}</step>\n`;
    if (pitch.alter) {
      xml += `          <alter>${pitch.alter}</alter>\n`;
    }
    xml += `          <octave>${pitch.octave}</octave>\n`;
    xml += '        </pitch>\n';
    xml += `        <duration>${duration}</duration>\n`;
    xml += `        <type>${this.durationToType(note.duration)}</type>\n`;
    
    if (typeof note.duration === 'object' && note.duration.dots > 0) {
      for (let i = 0; i < note.duration.dots; i++) {
        xml += '        <dot/>\n';
      }
    }
    
    // Articulations
    if (note.articulations && note.articulations.length > 0) {
      xml += '        <notations>\n';
      xml += '          <articulations>\n';
      for (const articulation of note.articulations) {
        xml += `            <${this.articulationToMusicXML(articulation)}/>\n`;
      }
      xml += '          </articulations>\n';
      xml += '        </notations>\n';
    }
    
    xml += '      </note>\n';
    return xml;
  }

  private restToMusicXML(rest: any): string {
    const duration = this.durationToMusicXML(rest.duration);
    
    let xml = '      <note>\n';
    xml += '        <rest/>\n';
    xml += `        <duration>${duration}</duration>\n`;
    xml += `        <type>${this.durationToType(rest.duration)}</type>\n`;
    
    if (typeof rest.duration === 'object' && rest.duration.dots > 0) {
      for (let i = 0; i < rest.duration.dots; i++) {
        xml += '        <dot/>\n';
      }
    }
    
    xml += '      </note>\n';
    return xml;
  }

  private chordToMusicXML(chord: any): string {
    let xml = '';
    
    for (let i = 0; i < chord.pitches.length; i++) {
      const pitch = this.parsePitch(chord.pitches[i]);
      const duration = this.durationToMusicXML(chord.duration);
      
      xml += '      <note>\n';
      if (i > 0) {
        xml += '        <chord/>\n';
      }
      xml += '        <pitch>\n';
      xml += `          <step>${pitch.step}</step>\n`;
      if (pitch.alter) {
        xml += `          <alter>${pitch.alter}</alter>\n`;
      }
      xml += `          <octave>${pitch.octave}</octave>\n`;
      xml += '        </pitch>\n';
      xml += `        <duration>${duration}</duration>\n`;
      xml += `        <type>${this.durationToType(chord.duration)}</type>\n`;
      xml += '      </note>\n';
    }
    
    return xml;
  }

  private parsePitch(pitch: string): { step: string; alter?: number; octave: number } {
    const step = pitch[0].toUpperCase();
    let alter: number | undefined;
    let octave: number;
    
    if (pitch.includes('#')) {
      alter = 1;
      octave = parseInt(pitch[2]);
    } else if (pitch.includes('b')) {
      alter = -1;
      octave = parseInt(pitch[2]);
    } else {
      octave = parseInt(pitch[1]);
    }
    
    return { step, alter, octave };
  }

  private durationToMusicXML(duration: any): number {
    const baseDuration = typeof duration === 'object' ? duration.duration : duration;
    
    const durationMap: Record<string, number> = {
      'whole': 16,
      'half': 8,
      'quarter': 4,
      'eighth': 2,
      'sixteenth': 1,
      'thirty-second': 0.5,
      'sixty-fourth': 0.25
    };
    
    let value = durationMap[baseDuration] || 4;
    
    if (typeof duration === 'object' && duration.dots > 0) {
      let dotValue = value;
      for (let i = 0; i < duration.dots; i++) {
        dotValue /= 2;
        value += dotValue;
      }
    }
    
    return value;
  }

  private durationToType(duration: any): string {
    const baseDuration = typeof duration === 'object' ? duration.duration : duration;
    return baseDuration;
  }

  private articulationToMusicXML(articulation: string): string {
    const articulationMap: Record<string, string> = {
      'staccato': 'staccato',
      'accent': 'accent',
      'marcato': 'strong-accent',
      'tenuto': 'tenuto',
      'trill': 'trill-mark'
    };
    
    return articulationMap[articulation] || articulation;
  }

  update(elements: MusicalElement[]): void {
    // OSMD requires full re-render
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
    // OSMD doesn't have built-in highlighting
    // Would need to implement custom solution
  }

  clearHighlight(): void {
    // Clear any custom highlighting
  }

  clear(): void {
    if (this.osmd) {
      this.osmd.clear();
    }
  }

  resize(_width: number, _height: number): void {
    if (this.osmd) {
      this.osmd.render();
    }
  }

  destroy(): void {
    if (this.osmd) {
      this.osmd.clear();
    }
    this.osmd = null;
    this.container = null;
  }

  isAvailable(): boolean {
    return typeof opensheetmusicdisplay !== 'undefined';
  }
}