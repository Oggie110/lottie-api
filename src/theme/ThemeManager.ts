// ============================================================================
// Theme Manager - Manage color themes for Lottie animations
// ============================================================================

import type { LottieAnimation, Theme, ThemeColor, ShapeLayer, FillShape, StrokeShape, GradientFillShape, GradientStrokeShape } from '../types';
import { deepClone, hexToRgba, rgbaToHex, getPropertyPath, setPropertyPath } from '../utils';

export interface ThemeDefinition {
  id: string;
  name: string;
  colors: Record<string, string>; // name -> hex color
}

export interface ExtractedColor {
  path: string;
  value: string;
  type: 'fill' | 'stroke' | 'gradient' | 'solid' | 'text';
  layerName?: string;
  shapeName?: string;
}

// Preset themes
const PRESET_THEMES: Record<string, ThemeDefinition> = {
  light: {
    id: 'light',
    name: 'Light Mode',
    colors: {
      primary: '#4285F4',
      secondary: '#5F6368',
      background: '#FFFFFF',
      surface: '#F1F3F4',
      text: '#202124',
      accent: '#1A73E8',
    },
  },
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      primary: '#8AB4F8',
      secondary: '#9AA0A6',
      background: '#202124',
      surface: '#303134',
      text: '#E8EAED',
      accent: '#8AB4F8',
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      primary: '#FF6B6B',
      secondary: '#FEC89A',
      background: '#2B2D42',
      surface: '#3D405B',
      text: '#F8EDEB',
      accent: '#FFD93D',
    },
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      primary: '#0077B6',
      secondary: '#48CAE4',
      background: '#03045E',
      surface: '#023E8A',
      text: '#CAF0F8',
      accent: '#90E0EF',
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    colors: {
      primary: '#2D6A4F',
      secondary: '#40916C',
      background: '#1B4332',
      surface: '#2D6A4F',
      text: '#D8F3DC',
      accent: '#95D5B2',
    },
  },
  candy: {
    id: 'candy',
    name: 'Candy',
    colors: {
      primary: '#FF69B4',
      secondary: '#DDA0DD',
      background: '#FFF0F5',
      surface: '#FFB6C1',
      text: '#8B008B',
      accent: '#FF1493',
    },
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    colors: {
      primary: '#333333',
      secondary: '#666666',
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#000000',
      accent: '#999999',
    },
  },
};

export class ThemeManager {
  private themes: Map<string, ThemeDefinition> = new Map();
  private colorMap: Map<string, string> = new Map(); // original color -> name

  constructor() {
    // Load preset themes
    Object.values(PRESET_THEMES).forEach((theme) => {
      this.themes.set(theme.id, theme);
    });
  }

  // --------------------------------------------------------------------------
  // Theme Management
  // --------------------------------------------------------------------------

  addTheme(theme: ThemeDefinition): this {
    this.themes.set(theme.id, theme);
    return this;
  }

  getTheme(id: string): ThemeDefinition | undefined {
    return this.themes.get(id);
  }

  removeTheme(id: string): boolean {
    return this.themes.delete(id);
  }

  listThemes(): ThemeDefinition[] {
    return Array.from(this.themes.values());
  }

  // --------------------------------------------------------------------------
  // Color Extraction
  // --------------------------------------------------------------------------

  extractColors(animation: LottieAnimation): ExtractedColor[] {
    const colors: ExtractedColor[] = [];

    // Extract from layers
    for (let i = 0; i < animation.layers.length; i++) {
      const layer = animation.layers[i];
      const layerPath = `layers.${i}`;

      // Solid layer color
      if (layer.ty === 1) {
        colors.push({
          path: `${layerPath}.sc`,
          value: (layer as any).sc,
          type: 'solid',
          layerName: layer.nm,
        });
      }

      // Shape layer
      if (layer.ty === 4) {
        const shapeLayer = layer as ShapeLayer;
        this.extractShapeColors(shapeLayer.shapes, `${layerPath}.shapes`, colors, layer.nm);
      }

      // Text layer
      if (layer.ty === 5) {
        const textLayer = layer as any;
        if (textLayer.t?.d?.k) {
          for (let j = 0; j < textLayer.t.d.k.length; j++) {
            const doc = textLayer.t.d.k[j];
            if (doc.s?.fc) {
              colors.push({
                path: `${layerPath}.t.d.k.${j}.s.fc`,
                value: rgbaToHex(doc.s.fc),
                type: 'text',
                layerName: layer.nm,
              });
            }
            if (doc.s?.sc) {
              colors.push({
                path: `${layerPath}.t.d.k.${j}.s.sc`,
                value: rgbaToHex(doc.s.sc),
                type: 'text',
                layerName: layer.nm,
              });
            }
          }
        }
      }
    }

    return colors;
  }

  private extractShapeColors(
    shapes: any[],
    basePath: string,
    colors: ExtractedColor[],
    layerName?: string
  ): void {
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const path = `${basePath}.${i}`;

      // Group - recurse into items
      if (shape.ty === 'gr' && shape.it) {
        this.extractShapeColors(shape.it, `${path}.it`, colors, layerName);
      }

      // Fill
      if (shape.ty === 'fl') {
        const fillColor = this.getAnimatedColorValue(shape.c);
        if (fillColor) {
          colors.push({
            path: `${path}.c.k`,
            value: rgbaToHex(fillColor),
            type: 'fill',
            layerName,
            shapeName: shape.nm,
          });
        }
      }

      // Stroke
      if (shape.ty === 'st') {
        const strokeColor = this.getAnimatedColorValue(shape.c);
        if (strokeColor) {
          colors.push({
            path: `${path}.c.k`,
            value: rgbaToHex(strokeColor),
            type: 'stroke',
            layerName,
            shapeName: shape.nm,
          });
        }
      }

      // Gradient fill
      if (shape.ty === 'gf' && shape.g?.k) {
        colors.push({
          path: `${path}.g.k`,
          value: 'gradient', // Gradients are complex, just mark them
          type: 'gradient',
          layerName,
          shapeName: shape.nm,
        });
      }

      // Gradient stroke
      if (shape.ty === 'gs' && shape.g?.k) {
        colors.push({
          path: `${path}.g.k`,
          value: 'gradient',
          type: 'gradient',
          layerName,
          shapeName: shape.nm,
        });
      }
    }
  }

  private getAnimatedColorValue(prop: any): number[] | undefined {
    if (!prop) return undefined;
    if (prop.a === 1 && Array.isArray(prop.k)) {
      // Animated - return first keyframe value
      return prop.k[0]?.s;
    }
    return prop.k;
  }

  // --------------------------------------------------------------------------
  // Theme Application
  // --------------------------------------------------------------------------

  applyTheme(animation: LottieAnimation, themeId: string): LottieAnimation {
    const theme = this.themes.get(themeId);
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    const result = deepClone(animation);
    const extractedColors = this.extractColors(result);

    // Build color mapping based on similarity to theme colors
    const colorMapping = this.buildColorMapping(extractedColors, theme);

    // Apply color mapping
    for (const [originalPath, newColor] of colorMapping) {
      const colorArray = hexToRgba(newColor);
      setPropertyPath(result, originalPath, colorArray);
    }

    return result;
  }

  private buildColorMapping(
    colors: ExtractedColor[],
    theme: ThemeDefinition
  ): Map<string, string> {
    const mapping = new Map<string, string>();
    const themeColors = Object.values(theme.colors);

    for (const color of colors) {
      if (color.value === 'gradient') continue; // Skip gradients for now

      // Find closest theme color
      const originalRgba = hexToRgba(color.value);
      let closestColor = themeColors[0];
      let closestDistance = Infinity;

      for (const themeColor of themeColors) {
        const themeRgba = hexToRgba(themeColor);
        const distance = this.colorDistance(originalRgba, themeRgba);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestColor = themeColor;
        }
      }

      mapping.set(color.path, closestColor);
    }

    return mapping;
  }

  private colorDistance(c1: number[], c2: number[]): number {
    // Simple Euclidean distance in RGB space
    const dr = c1[0] - c2[0];
    const dg = c1[1] - c2[1];
    const db = c1[2] - c2[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  // --------------------------------------------------------------------------
  // Color Replacement
  // --------------------------------------------------------------------------

  replaceColor(
    animation: LottieAnimation,
    oldColor: string,
    newColor: string
  ): LottieAnimation {
    const result = deepClone(animation);
    const extractedColors = this.extractColors(result);
    const oldRgba = hexToRgba(oldColor);
    const newRgba = hexToRgba(newColor);

    for (const color of extractedColors) {
      if (color.value === 'gradient') continue;

      const colorRgba = hexToRgba(color.value);
      if (this.colorDistance(colorRgba, oldRgba) < 0.1) {
        setPropertyPath(result, color.path, newRgba);
      }
    }

    return result;
  }

  replaceAllColors(
    animation: LottieAnimation,
    colorMap: Record<string, string>
  ): LottieAnimation {
    let result = deepClone(animation);

    for (const [oldColor, newColor] of Object.entries(colorMap)) {
      result = this.replaceColor(result, oldColor, newColor);
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // Auto-Theme Generation
  // --------------------------------------------------------------------------

  generateThemeFromColors(
    name: string,
    colors: string[],
    id?: string
  ): ThemeDefinition {
    const sortedColors = this.sortColorsByLuminance(colors);
    const colorNames = ['primary', 'secondary', 'accent', 'background', 'surface', 'text'];
    const themeColors: Record<string, string> = {};

    for (let i = 0; i < Math.min(sortedColors.length, colorNames.length); i++) {
      themeColors[colorNames[i]] = sortedColors[i];
    }

    // Fill in missing colors
    if (!themeColors.background) themeColors.background = '#FFFFFF';
    if (!themeColors.surface) themeColors.surface = '#F5F5F5';
    if (!themeColors.text) themeColors.text = '#333333';

    return {
      id: id ?? name.toLowerCase().replace(/\s+/g, '-'),
      name,
      colors: themeColors,
    };
  }

  private sortColorsByLuminance(colors: string[]): string[] {
    return [...colors].sort((a, b) => {
      const lumA = this.getLuminance(hexToRgba(a));
      const lumB = this.getLuminance(hexToRgba(b));
      return lumB - lumA;
    });
  }

  private getLuminance(rgba: number[]): number {
    return 0.299 * rgba[0] + 0.587 * rgba[1] + 0.114 * rgba[2];
  }

  // --------------------------------------------------------------------------
  // Static Factory
  // --------------------------------------------------------------------------

  static create(): ThemeManager {
    return new ThemeManager();
  }

  static getPresetThemes(): ThemeDefinition[] {
    return Object.values(PRESET_THEMES);
  }
}
