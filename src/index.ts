// ============================================================================
// Lottie Creator API
// A TypeScript SDK for creating and manipulating Lottie animations
// ============================================================================

// Types
export * from './types';

// Utilities
export * from './utils';

// Builders
export { AnimationBuilder } from './builders/AnimationBuilder';
export { LayerBuilder } from './builders/LayerBuilder';
export { StateMachineBuilder, StateBuilder } from './builders/StateMachineBuilder';

// AI Features
export { MotionCopilot } from './ai/MotionCopilot';
export type { MotionPrompt, MotionResult, ParsedMotion } from './ai/MotionCopilot';
export { PromptToVector } from './ai/PromptToVector';
export type { VectorPrompt, VectorResult } from './ai/PromptToVector';

// Theme Management
export { ThemeManager } from './theme/ThemeManager';
export type { ThemeDefinition, ExtractedColor } from './theme/ThemeManager';

// Export
export { Exporter } from './export/Exporter';
export type { DotLottieManifest, DotLottieOptions } from './export/Exporter';

// Import
export { SVGImporter } from './import/SVGImporter';
export type { SVGImportOptions, ParsedSVGShape } from './import/SVGImporter';

// ============================================================================
// Convenience Factory Functions
// ============================================================================

import { AnimationBuilder } from './builders/AnimationBuilder';
import { LayerBuilder } from './builders/LayerBuilder';
import { StateMachineBuilder } from './builders/StateMachineBuilder';
import { MotionCopilot } from './ai/MotionCopilot';
import { PromptToVector } from './ai/PromptToVector';
import { ThemeManager } from './theme/ThemeManager';
import { Exporter } from './export/Exporter';
import { SVGImporter } from './import/SVGImporter';

/**
 * Create a new animation
 */
export function createAnimation(options?: {
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  name?: string;
}): AnimationBuilder {
  return AnimationBuilder.create(options);
}

/**
 * Create a new shape layer
 */
export function createShapeLayer(name?: string): LayerBuilder {
  return LayerBuilder.shape(name);
}

/**
 * Create a state machine for interactive animations
 */
export function createStateMachine(name?: string): StateMachineBuilder {
  return StateMachineBuilder.create(name);
}

/**
 * Create a motion copilot for AI-powered keyframe generation
 */
export function createMotionCopilot(fps = 60): MotionCopilot {
  return new MotionCopilot(fps);
}

/**
 * Create a prompt-to-vector generator
 */
export function createVectorGenerator(): PromptToVector {
  return new PromptToVector();
}

/**
 * Create a theme manager
 */
export function createThemeManager(): ThemeManager {
  return ThemeManager.create();
}

// ============================================================================
// Quick Start Helpers
// ============================================================================

import type { LottieAnimation } from './types';

/**
 * Quick: Create a simple shape animation
 */
export function quickShape(options: {
  shape: 'circle' | 'square' | 'star' | 'triangle';
  color?: string;
  size?: number;
  animation?: 'pulse' | 'spin' | 'bounce' | 'fadeIn';
  duration?: number;
}): LottieAnimation {
  const {
    shape,
    color = '#4285F4',
    size = 100,
    animation: animationType,
    duration = 2,
  } = options;

  const fps = 60;
  const frames = fps * duration;
  const center = size * 1.5;

  const builder = createAnimation({
    width: center * 2,
    height: center * 2,
    fps,
    duration,
  });

  builder.addShapeLayer('Shape', (layer) => {
    layer.setPosition(center, center);

    layer.beginGroup();

    switch (shape) {
      case 'circle':
        layer.addCircle({ radius: size / 2 });
        break;
      case 'square':
        layer.addRect({ width: size, height: size, roundness: 8 });
        break;
      case 'star':
        layer.addStar({ outerRadius: size / 2, innerRadius: size / 4, points: 5 });
        break;
      case 'triangle':
        layer.addPolygon({ radius: size / 2, sides: 3 });
        break;
    }

    layer.addFill({ color });
    layer.endGroup();

    // Apply animation
    if (animationType) {
      switch (animationType) {
        case 'pulse':
          layer.animateScale([
            { time: 0, value: [100, 100, 100], easing: 'easeInOut' },
            { time: frames / 2, value: [120, 120, 100], easing: 'easeInOut' },
            { time: frames, value: [100, 100, 100] },
          ]);
          break;
        case 'spin':
          layer.animateRotation([
            { time: 0, value: 0, easing: 'linear' },
            { time: frames, value: 360 },
          ]);
          break;
        case 'bounce':
          layer.animatePosition([
            { time: 0, value: [center, center, 0], easing: 'easeOut' },
            { time: frames / 4, value: [center, center - 50, 0], easing: 'easeIn' },
            { time: frames / 2, value: [center, center, 0], easing: 'easeOut' },
            { time: frames * 3 / 4, value: [center, center - 25, 0], easing: 'easeIn' },
            { time: frames, value: [center, center, 0] },
          ]);
          break;
        case 'fadeIn':
          layer.animateOpacity([
            { time: 0, value: 0, easing: 'easeOut' },
            { time: frames, value: 100 },
          ]);
          break;
      }
    }
  });

  return builder.build();
}

/**
 * Quick: Create a loading spinner
 */
export function quickLoader(options?: {
  color?: string;
  size?: number;
  strokeWidth?: number;
  duration?: number;
}): LottieAnimation {
  const {
    color = '#4285F4',
    size = 100,
    strokeWidth = 8,
    duration = 1.5,
  } = options ?? {};

  const fps = 60;
  const frames = fps * duration;
  const center = size * 0.75;

  return createAnimation({
    width: center * 2,
    height: center * 2,
    fps,
    duration,
  })
    .addShapeLayer('Spinner', (layer) => {
      layer
        .setPosition(center, center)
        .animateRotation([
          { time: 0, value: 0, easing: 'linear' },
          { time: frames, value: 360 },
        ])
        .beginGroup()
        .addCircle({ radius: size / 2 - strokeWidth / 2 })
        .addStroke({ color, width: strokeWidth, lineCap: 2 })
        .addAnimatedTrim({
          start: [
            { time: 0, value: 0, easing: 'easeInOut' },
            { time: frames / 2, value: 25, easing: 'easeInOut' },
            { time: frames, value: 0 },
          ],
          end: [
            { time: 0, value: 25, easing: 'easeInOut' },
            { time: frames / 2, value: 100, easing: 'easeInOut' },
            { time: frames, value: 25 },
          ],
        })
        .endGroup();
    })
    .build();
}

/**
 * Quick: Create a checkmark animation
 */
export function quickCheckmark(options?: {
  color?: string;
  size?: number;
  strokeWidth?: number;
  duration?: number;
}): LottieAnimation {
  const {
    color = '#34A853',
    size = 100,
    strokeWidth = 8,
    duration = 0.5,
  } = options ?? {};

  const fps = 60;
  const frames = fps * duration;
  const center = size * 0.75;

  return createAnimation({
    width: center * 2,
    height: center * 2,
    fps,
    duration,
  })
    .addShapeLayer('Checkmark', (layer) => {
      layer
        .setPosition(center, center)
        .beginGroup()
        .addPath({
          name: 'Check',
          path: {
            c: false,
            v: [
              [-size / 3, 0],
              [-size / 8, size / 4],
              [size / 3, -size / 4],
            ],
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
          },
        })
        .addStroke({ color, width: strokeWidth, lineCap: 2, lineJoin: 2 })
        .addAnimatedTrim({
          end: [
            { time: 0, value: 0, easing: 'easeOut' },
            { time: frames, value: 100 },
          ],
        })
        .endGroup();
    })
    .build();
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  // Factories
  createAnimation,
  createShapeLayer,
  createStateMachine,
  createMotionCopilot,
  createVectorGenerator,
  createThemeManager,

  // Quick helpers
  quickShape,
  quickLoader,
  quickCheckmark,

  // Classes
  AnimationBuilder,
  LayerBuilder,
  StateMachineBuilder,
  MotionCopilot,
  PromptToVector,
  ThemeManager,
  Exporter,
  SVGImporter,
};
