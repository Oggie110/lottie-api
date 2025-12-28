// ============================================================================
// Exporter - Export Lottie animations to various formats
// ============================================================================

import type { LottieAnimation, ExportFormat, ExportOptions, ExportResult, StateMachine, Theme } from '../types';

export interface DotLottieManifest {
  animations: Array<{
    id: string;
    speed?: number;
    themeColor?: string;
    loop?: boolean;
    autoplay?: boolean;
    direction?: 1 | -1;
    playMode?: 'normal' | 'bounce';
    defaultTheme?: string;
  }>;
  states?: StateMachine[];
  themes?: Theme[];
  author?: string;
  description?: string;
  generator?: string;
  keywords?: string[];
  revision?: number;
  version?: string;
}

export interface DotLottieOptions {
  animations: Array<{
    animation: LottieAnimation;
    id?: string;
    autoplay?: boolean;
    loop?: boolean;
    speed?: number;
    direction?: 1 | -1;
  }>;
  stateMachines?: StateMachine[];
  themes?: Theme[];
  author?: string;
  description?: string;
}

export class Exporter {
  // --------------------------------------------------------------------------
  // JSON Export
  // --------------------------------------------------------------------------

  static toJSON(animation: LottieAnimation, pretty = false): string {
    return pretty
      ? JSON.stringify(animation, null, 2)
      : JSON.stringify(animation);
  }

  static toBlob(animation: LottieAnimation): Blob {
    return new Blob([this.toJSON(animation)], { type: 'application/json' });
  }

  // --------------------------------------------------------------------------
  // dotLottie Export
  // --------------------------------------------------------------------------

  static async toDotLottie(options: DotLottieOptions): Promise<Uint8Array> {
    // Note: This is a simplified implementation
    // In production, you'd use a library like @dotlottie/dotlottie-js

    const files: Record<string, string | Uint8Array> = {};

    // Add animations
    const manifestAnimations: DotLottieManifest['animations'] = [];
    for (let i = 0; i < options.animations.length; i++) {
      const anim = options.animations[i];
      const id = anim.id ?? `animation_${i}`;
      files[`animations/${id}.json`] = JSON.stringify(anim.animation);
      manifestAnimations.push({
        id,
        speed: anim.speed ?? 1,
        loop: anim.loop ?? true,
        autoplay: anim.autoplay ?? true,
        direction: anim.direction ?? 1,
      });
    }

    // Create manifest
    const manifest: DotLottieManifest = {
      animations: manifestAnimations,
      states: options.stateMachines,
      themes: options.themes,
      author: options.author,
      description: options.description,
      generator: 'lottie-creator-api',
      version: '1.0',
    };
    files['manifest.json'] = JSON.stringify(manifest, null, 2);

    // Create ZIP (simplified - in production use a real ZIP library)
    return this.createZip(files);
  }

  private static async createZip(files: Record<string, string | Uint8Array>): Promise<Uint8Array> {
    // This is a placeholder - in production you'd use a library like JSZip
    // For now, return the manifest as a hint that proper implementation is needed
    const content = JSON.stringify(
      {
        _notice: 'This is a placeholder. Use @dotlottie/dotlottie-js for proper .lottie export.',
        files: Object.keys(files),
        manifest: JSON.parse(files['manifest.json'] as string),
      },
      null,
      2
    );
    return new TextEncoder().encode(content);
  }

  // --------------------------------------------------------------------------
  // URL/Data URI Export
  // --------------------------------------------------------------------------

  static toDataURI(animation: LottieAnimation): string {
    const json = this.toJSON(animation);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return `data:application/json;base64,${base64}`;
  }

  static toObjectURL(animation: LottieAnimation): string {
    const blob = this.toBlob(animation);
    return URL.createObjectURL(blob);
  }

  // --------------------------------------------------------------------------
  // SVG Export (single frame)
  // --------------------------------------------------------------------------

  static toSVG(animation: LottieAnimation, frame = 0): string {
    // Basic SVG export for simple animations
    // Note: This is simplified and doesn't handle all Lottie features
    const { w: width, h: height, layers } = animation;

    let svgContent = '';

    for (const layer of layers) {
      if (layer.ty === 4) {
        // Shape layer
        svgContent += this.shapeLayerToSVG(layer as any);
      } else if (layer.ty === 1) {
        // Solid layer
        const solid = layer as any;
        svgContent += `<rect width="${solid.sw}" height="${solid.sh}" fill="${solid.sc}" />`;
      }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${svgContent}
</svg>`;
  }

  private static shapeLayerToSVG(layer: any): string {
    let svg = '';
    const transform = this.getTransformString(layer.ks);

    svg += `<g transform="${transform}">`;

    for (const shape of layer.shapes || []) {
      svg += this.shapeToSVG(shape);
    }

    svg += '</g>';
    return svg;
  }

  private static shapeToSVG(shape: any): string {
    let svg = '';

    switch (shape.ty) {
      case 'gr': // Group
        svg += '<g>';
        for (const item of shape.it || []) {
          svg += this.shapeToSVG(item);
        }
        svg += '</g>';
        break;

      case 'rc': // Rectangle
        const pos = this.getStaticValue(shape.p, [0, 0]);
        const size = this.getStaticValue(shape.s, [100, 100]);
        const radius = this.getStaticValue(shape.r, 0);
        svg += `<rect x="${pos[0] - size[0] / 2}" y="${pos[1] - size[1] / 2}" width="${size[0]}" height="${size[1]}" rx="${radius}" />`;
        break;

      case 'el': // Ellipse
        const epos = this.getStaticValue(shape.p, [0, 0]);
        const esize = this.getStaticValue(shape.s, [100, 100]);
        svg += `<ellipse cx="${epos[0]}" cy="${epos[1]}" rx="${esize[0] / 2}" ry="${esize[1] / 2}" />`;
        break;

      case 'sh': // Path
        const path = this.getStaticValue(shape.ks, null);
        if (path) {
          svg += `<path d="${this.pathToSVGD(path)}" />`;
        }
        break;

      case 'fl': // Fill
        const fillColor = this.getStaticValue(shape.c, [0, 0, 0, 1]);
        const fillOpacity = this.getStaticValue(shape.o, 100) / 100;
        svg = svg.replace(/<(\w+)([^>]*)(\/?)>/g, `<$1$2 fill="${this.rgbaToSVGColor(fillColor)}" fill-opacity="${fillOpacity}"$3>`);
        break;

      case 'st': // Stroke
        const strokeColor = this.getStaticValue(shape.c, [0, 0, 0, 1]);
        const strokeWidth = this.getStaticValue(shape.w, 1);
        const strokeOpacity = this.getStaticValue(shape.o, 100) / 100;
        svg = svg.replace(/<(\w+)([^>]*)(\/?)>/g, `<$1$2 stroke="${this.rgbaToSVGColor(strokeColor)}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}" fill="none"$3>`);
        break;
    }

    return svg;
  }

  private static pathToSVGD(path: any): string {
    if (!path.v || !path.i || !path.o) return '';

    let d = '';
    const v = path.v;
    const i = path.i;
    const o = path.o;

    for (let j = 0; j < v.length; j++) {
      if (j === 0) {
        d += `M ${v[j][0]} ${v[j][1]}`;
      } else {
        const prev = v[j - 1];
        const curr = v[j];
        const cp1 = [prev[0] + o[j - 1][0], prev[1] + o[j - 1][1]];
        const cp2 = [curr[0] + i[j][0], curr[1] + i[j][1]];
        d += ` C ${cp1[0]} ${cp1[1]} ${cp2[0]} ${cp2[1]} ${curr[0]} ${curr[1]}`;
      }
    }

    if (path.c) {
      const last = v[v.length - 1];
      const first = v[0];
      const cp1 = [last[0] + o[v.length - 1][0], last[1] + o[v.length - 1][1]];
      const cp2 = [first[0] + i[0][0], first[1] + i[0][1]];
      d += ` C ${cp1[0]} ${cp1[1]} ${cp2[0]} ${cp2[1]} ${first[0]} ${first[1]} Z`;
    }

    return d;
  }

  private static getTransformString(ks: any): string {
    if (!ks) return '';

    const parts: string[] = [];

    const position = this.getStaticValue(ks.p, [0, 0, 0]);
    if (position[0] !== 0 || position[1] !== 0) {
      parts.push(`translate(${position[0]}, ${position[1]})`);
    }

    const rotation = this.getStaticValue(ks.r, 0);
    if (rotation !== 0) {
      parts.push(`rotate(${rotation})`);
    }

    const scale = this.getStaticValue(ks.s, [100, 100, 100]);
    if (scale[0] !== 100 || scale[1] !== 100) {
      parts.push(`scale(${scale[0] / 100}, ${scale[1] / 100})`);
    }

    return parts.join(' ');
  }

  private static getStaticValue(prop: any, defaultValue: any): any {
    if (!prop) return defaultValue;
    if (prop.a === 1 && Array.isArray(prop.k)) {
      return prop.k[0]?.s ?? defaultValue;
    }
    return prop.k ?? defaultValue;
  }

  private static rgbaToSVGColor(rgba: number[]): string {
    const r = Math.round(rgba[0] * 255);
    const g = Math.round(rgba[1] * 255);
    const b = Math.round(rgba[2] * 255);
    return `rgb(${r},${g},${b})`;
  }

  // --------------------------------------------------------------------------
  // Export Helpers
  // --------------------------------------------------------------------------

  static download(animation: LottieAnimation, filename = 'animation.json'): void {
    const blob = this.toBlob(animation);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async downloadDotLottie(options: DotLottieOptions, filename = 'animation.lottie'): Promise<void> {
    const data = await this.toDotLottie(options);
    const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static downloadSVG(animation: LottieAnimation, frame = 0, filename = 'frame.svg'): void {
    const svg = this.toSVG(animation, frame);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
