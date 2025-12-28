// ============================================================================
// Prompt to Vector - AI-powered shape generation
// ============================================================================

import type { ShapeLayer, ShapeElement, GroupShape, FillShape, StrokeShape } from '../types';
import { LayerBuilder } from '../builders/LayerBuilder';
import { hexToRgba, staticProperty, createPolygonPath, createStarPath, createCirclePath } from '../utils';

export interface VectorPrompt {
  prompt: string;
  style?: 'minimal' | 'detailed' | 'geometric' | 'organic';
  colors?: string[];
  size?: { width: number; height: number };
}

export interface VectorResult {
  layer: ShapeLayer;
  description: string;
}

// Shape presets for common objects
interface ShapePreset {
  name: string;
  keywords: string[];
  generate: (options: { colors: string[]; width: number; height: number }) => ShapeLayer;
}

const SHAPE_PRESETS: ShapePreset[] = [
  // Basic shapes
  {
    name: 'circle',
    keywords: ['circle', 'dot', 'ball', 'sphere', 'round'],
    generate: ({ colors, width, height }) => {
      const size = Math.min(width, height) * 0.8;
      return new LayerBuilder('shape', { name: 'Circle' })
        .setPosition(width / 2, height / 2)
        .beginGroup()
        .addCircle({ radius: size / 2 })
        .addFill({ color: colors[0] ?? '#4285F4' })
        .endGroup('Circle')
        .build() as ShapeLayer;
    },
  },
  {
    name: 'square',
    keywords: ['square', 'box', 'rectangle', 'rect'],
    generate: ({ colors, width, height }) => {
      const size = Math.min(width, height) * 0.7;
      return new LayerBuilder('shape', { name: 'Square' })
        .setPosition(width / 2, height / 2)
        .beginGroup()
        .addRect({ width: size, height: size, roundness: 8 })
        .addFill({ color: colors[0] ?? '#34A853' })
        .endGroup('Square')
        .build() as ShapeLayer;
    },
  },
  {
    name: 'triangle',
    keywords: ['triangle', 'pyramid', 'arrow'],
    generate: ({ colors, width, height }) => {
      const size = Math.min(width, height) * 0.7;
      return new LayerBuilder('shape', { name: 'Triangle' })
        .setPosition(width / 2, height / 2)
        .beginGroup()
        .addPolygon({ radius: size / 2, sides: 3 })
        .addFill({ color: colors[0] ?? '#FBBC05' })
        .endGroup('Triangle')
        .build() as ShapeLayer;
    },
  },
  {
    name: 'star',
    keywords: ['star', 'sparkle', 'twinkle'],
    generate: ({ colors, width, height }) => {
      const size = Math.min(width, height) * 0.8;
      return new LayerBuilder('shape', { name: 'Star' })
        .setPosition(width / 2, height / 2)
        .beginGroup()
        .addStar({ outerRadius: size / 2, innerRadius: size / 4, points: 5 })
        .addFill({ color: colors[0] ?? '#FBBC05' })
        .endGroup('Star')
        .build() as ShapeLayer;
    },
  },
  {
    name: 'heart',
    keywords: ['heart', 'love', 'like'],
    generate: ({ colors, width, height }) => {
      const size = Math.min(width, height) * 0.6;
      const builder = new LayerBuilder('shape', { name: 'Heart' })
        .setPosition(width / 2, height / 2);

      // Heart shape using two circles and a triangle
      builder.beginGroup()
        .addCircle({ x: -size / 4, y: -size / 8, radius: size / 3 })
        .addFill({ color: colors[0] ?? '#EA4335' })
        .endGroup('Left Circle');

      builder.beginGroup()
        .addCircle({ x: size / 4, y: -size / 8, radius: size / 3 })
        .addFill({ color: colors[0] ?? '#EA4335' })
        .endGroup('Right Circle');

      builder.beginGroup()
        .addPath({
          name: 'Bottom',
          path: {
            c: true,
            v: [
              [0, size / 2],
              [-size / 2, -size / 8],
              [size / 2, -size / 8],
            ],
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
          },
        })
        .addFill({ color: colors[0] ?? '#EA4335' })
        .endGroup('Bottom');

      return builder.build() as ShapeLayer;
    },
  },
  // Icons
  {
    name: 'checkmark',
    keywords: ['check', 'checkmark', 'tick', 'done', 'complete', 'success'],
    generate: ({ colors, width, height }) => {
      const size = Math.min(width, height) * 0.6;
      return new LayerBuilder('shape', { name: 'Checkmark' })
        .setPosition(width / 2, height / 2)
        .beginGroup()
        .addPath({
          name: 'Check',
          path: {
            c: false,
            v: [
              [-size / 2, 0],
              [-size / 6, size / 3],
              [size / 2, -size / 3],
            ],
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
          },
        })
        .addStroke({ color: colors[0] ?? '#34A853', width: size / 6, lineCap: 2, lineJoin: 2 })
        .endGroup('Checkmark')
        .build() as ShapeLayer;
    },
  },
  {
    name: 'cross',
    keywords: ['cross', 'x', 'close', 'cancel', 'delete', 'remove'],
    generate: ({ colors, width, height }) => {
      const size = Math.min(width, height) * 0.5;
      const builder = new LayerBuilder('shape', { name: 'Cross' })
        .setPosition(width / 2, height / 2);

      builder.beginGroup()
        .addPath({
          name: 'Line1',
          path: {
            c: false,
            v: [[-size / 2, -size / 2], [size / 2, size / 2]],
            i: [[0, 0], [0, 0]],
            o: [[0, 0], [0, 0]],
          },
        })
        .addStroke({ color: colors[0] ?? '#EA4335', width: size / 6, lineCap: 2 })
        .endGroup('Line 1');

      builder.beginGroup()
        .addPath({
          name: 'Line2',
          path: {
            c: false,
            v: [[size / 2, -size / 2], [-size / 2, size / 2]],
            i: [[0, 0], [0, 0]],
            o: [[0, 0], [0, 0]],
          },
        })
        .addStroke({ color: colors[0] ?? '#EA4335', width: size / 6, lineCap: 2 })
        .endGroup('Line 2');

      return builder.build() as ShapeLayer;
    },
  },
  {
    name: 'plus',
    keywords: ['plus', 'add', 'new', 'create'],
    generate: ({ colors, width, height }) => {
      const size = Math.min(width, height) * 0.5;
      const builder = new LayerBuilder('shape', { name: 'Plus' })
        .setPosition(width / 2, height / 2);

      builder.beginGroup()
        .addPath({
          name: 'Horizontal',
          path: {
            c: false,
            v: [[-size / 2, 0], [size / 2, 0]],
            i: [[0, 0], [0, 0]],
            o: [[0, 0], [0, 0]],
          },
        })
        .addStroke({ color: colors[0] ?? '#4285F4', width: size / 6, lineCap: 2 })
        .endGroup('Horizontal');

      builder.beginGroup()
        .addPath({
          name: 'Vertical',
          path: {
            c: false,
            v: [[0, -size / 2], [0, size / 2]],
            i: [[0, 0], [0, 0]],
            o: [[0, 0], [0, 0]],
          },
        })
        .addStroke({ color: colors[0] ?? '#4285F4', width: size / 6, lineCap: 2 })
        .endGroup('Vertical');

      return builder.build() as ShapeLayer;
    },
  },
  {
    name: 'arrow',
    keywords: ['arrow', 'pointer', 'direction', 'next', 'forward'],
    generate: ({ colors, width, height }) => {
      const size = Math.min(width, height) * 0.5;
      return new LayerBuilder('shape', { name: 'Arrow' })
        .setPosition(width / 2, height / 2)
        .beginGroup()
        .addPath({
          name: 'Arrow',
          path: {
            c: false,
            v: [
              [-size / 4, -size / 3],
              [size / 4, 0],
              [-size / 4, size / 3],
            ],
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
          },
        })
        .addStroke({ color: colors[0] ?? '#4285F4', width: size / 8, lineCap: 2, lineJoin: 2 })
        .endGroup('Arrow')
        .build() as ShapeLayer;
    },
  },
  // UI Elements
  {
    name: 'button',
    keywords: ['button', 'btn', 'cta'],
    generate: ({ colors, width, height }) => {
      const btnWidth = width * 0.7;
      const btnHeight = height * 0.3;
      return new LayerBuilder('shape', { name: 'Button' })
        .setPosition(width / 2, height / 2)
        .beginGroup()
        .addRect({ width: btnWidth, height: btnHeight, roundness: btnHeight / 2 })
        .addFill({ color: colors[0] ?? '#4285F4' })
        .endGroup('Button')
        .build() as ShapeLayer;
    },
  },
  {
    name: 'loader',
    keywords: ['loader', 'loading', 'spinner', 'progress'],
    generate: ({ colors, width, height }) => {
      const size = Math.min(width, height) * 0.6;
      return new LayerBuilder('shape', { name: 'Loader' })
        .setPosition(width / 2, height / 2)
        .beginGroup()
        .addCircle({ radius: size / 2 })
        .addStroke({ color: colors[0] ?? '#4285F4', width: size / 10, lineCap: 2 })
        .addTrim({ start: 0, end: 75 })
        .endGroup('Loader')
        .build() as ShapeLayer;
    },
  },
  // Nature
  {
    name: 'sun',
    keywords: ['sun', 'sunny', 'day', 'light'],
    generate: ({ colors, width, height }) => {
      const size = Math.min(width, height) * 0.4;
      const builder = new LayerBuilder('shape', { name: 'Sun' })
        .setPosition(width / 2, height / 2);

      // Core
      builder.beginGroup()
        .addCircle({ radius: size / 2 })
        .addFill({ color: colors[0] ?? '#FBBC05' })
        .endGroup('Core');

      // Rays
      const rayCount = 8;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const innerRadius = size * 0.7;
        const outerRadius = size * 1.1;
        builder.beginGroup()
          .addPath({
            name: `Ray ${i + 1}`,
            path: {
              c: false,
              v: [
                [Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius],
                [Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius],
              ],
              i: [[0, 0], [0, 0]],
              o: [[0, 0], [0, 0]],
            },
          })
          .addStroke({ color: colors[0] ?? '#FBBC05', width: size / 10, lineCap: 2 })
          .endGroup(`Ray ${i + 1}`);
      }

      return builder.build() as ShapeLayer;
    },
  },
  {
    name: 'moon',
    keywords: ['moon', 'night', 'crescent'],
    generate: ({ colors, width, height }) => {
      const size = Math.min(width, height) * 0.7;
      const builder = new LayerBuilder('shape', { name: 'Moon' })
        .setPosition(width / 2, height / 2);

      builder.beginGroup()
        .addCircle({ radius: size / 2 })
        .addFill({ color: colors[0] ?? '#F4F4F4' })
        .endGroup('Main Circle');

      // Subtract circle for crescent
      builder.beginGroup()
        .addCircle({ x: size / 3, y: -size / 6, radius: size / 2.5 })
        .addFill({ color: colors[1] ?? '#1A1A2E' })
        .endGroup('Cutout');

      return builder.build() as ShapeLayer;
    },
  },
];

export class PromptToVector {
  private defaultColors = ['#4285F4', '#34A853', '#FBBC05', '#EA4335'];

  // --------------------------------------------------------------------------
  // Generate from Prompt
  // --------------------------------------------------------------------------

  generate(prompt: VectorPrompt): VectorResult {
    const colors = prompt.colors ?? this.defaultColors;
    const width = prompt.size?.width ?? 512;
    const height = prompt.size?.height ?? 512;

    // Find matching preset
    const lowerPrompt = prompt.prompt.toLowerCase();
    const preset = this.findPreset(lowerPrompt);

    if (preset) {
      return {
        layer: preset.generate({ colors, width, height }),
        description: `Generated ${preset.name} shape from prompt`,
      };
    }

    // Default to a composite shape if no preset matches
    return {
      layer: this.generateComposite(lowerPrompt, { colors, width, height }),
      description: 'Generated composite shape from prompt',
    };
  }

  private findPreset(prompt: string): ShapePreset | undefined {
    for (const preset of SHAPE_PRESETS) {
      for (const keyword of preset.keywords) {
        if (prompt.includes(keyword)) {
          return preset;
        }
      }
    }
    return undefined;
  }

  private generateComposite(
    prompt: string,
    options: { colors: string[]; width: number; height: number }
  ): ShapeLayer {
    // Analyze prompt for shape suggestions
    const hasCircular = /round|circle|curve|smooth/i.test(prompt);
    const hasAngular = /sharp|angular|geometric|edge/i.test(prompt);
    const isAbstract = /abstract|pattern|design/i.test(prompt);

    const builder = new LayerBuilder('shape', { name: 'Generated Shape' })
      .setPosition(options.width / 2, options.height / 2);

    const size = Math.min(options.width, options.height) * 0.6;

    if (isAbstract) {
      // Generate abstract pattern
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const offset = size * 0.3;
        builder.beginGroup()
          .addCircle({
            x: Math.cos(angle) * offset,
            y: Math.sin(angle) * offset,
            radius: size * 0.2,
          })
          .addFill({ color: options.colors[i % options.colors.length], opacity: 80 })
          .endGroup(`Circle ${i + 1}`);
      }
    } else if (hasCircular) {
      builder.beginGroup()
        .addCircle({ radius: size / 2 })
        .addFill({ color: options.colors[0] })
        .addStroke({ color: options.colors[1], width: 4 })
        .endGroup('Circle Shape');
    } else if (hasAngular) {
      builder.beginGroup()
        .addPolygon({ radius: size / 2, sides: 6 })
        .addFill({ color: options.colors[0] })
        .addStroke({ color: options.colors[1], width: 4 })
        .endGroup('Polygon Shape');
    } else {
      // Default: rounded rectangle
      builder.beginGroup()
        .addRect({ width: size, height: size * 0.6, roundness: 16 })
        .addFill({ color: options.colors[0] })
        .endGroup('Default Shape');
    }

    return builder.build() as ShapeLayer;
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  static getAvailableShapes(): string[] {
    return SHAPE_PRESETS.map((p) => p.name);
  }

  static getShapeKeywords(shapeName: string): string[] {
    const preset = SHAPE_PRESETS.find((p) => p.name === shapeName);
    return preset?.keywords ?? [];
  }
}
