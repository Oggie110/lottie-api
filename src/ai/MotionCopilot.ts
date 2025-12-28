// ============================================================================
// Motion Copilot - AI-powered keyframe generation
// ============================================================================

import type {
  AnimatedProperty,
  Keyframe,
  EasingType,
  LottieAnimation,
  Layer,
  ShapeLayer,
} from '../types';
import { createKeyframe, animatedProperty, getEasingCurve } from '../utils';

export interface MotionPrompt {
  prompt: string;
  target?: 'position' | 'scale' | 'rotation' | 'opacity' | 'all';
  duration?: number; // in frames
  fps?: number;
  style?: 'smooth' | 'bouncy' | 'snappy' | 'elastic' | 'organic';
}

export interface MotionResult {
  property: string;
  keyframes: Keyframe<number | number[]>[];
}

export interface ParsedMotion {
  type: 'move' | 'scale' | 'rotate' | 'fade' | 'bounce' | 'shake' | 'pulse' | 'spin';
  params: Record<string, number | string>;
  timing: {
    duration: number;
    delay?: number;
    repeat?: number;
  };
  easing: EasingType;
}

// Common motion patterns
const MOTION_PATTERNS: Record<string, (params: Record<string, number>, duration: number, fps: number) => MotionResult[]> = {
  // Movement patterns
  slideIn: (params, duration, fps) => {
    const direction = params.direction ?? 0; // 0=left, 1=right, 2=top, 3=bottom
    const distance = params.distance ?? 500;
    const startX = direction === 0 ? -distance : direction === 1 ? distance : 0;
    const startY = direction === 2 ? -distance : direction === 3 ? distance : 0;
    return [{
      property: 'position',
      keyframes: [
        createKeyframe(0, [startX, startY, 0], { easing: 'easeOut' }),
        createKeyframe(duration, [0, 0, 0]),
      ],
    }];
  },

  slideOut: (params, duration) => {
    const direction = params.direction ?? 1;
    const distance = params.distance ?? 500;
    const endX = direction === 0 ? -distance : direction === 1 ? distance : 0;
    const endY = direction === 2 ? -distance : direction === 3 ? distance : 0;
    return [{
      property: 'position',
      keyframes: [
        createKeyframe(0, [0, 0, 0], { easing: 'easeIn' }),
        createKeyframe(duration, [endX, endY, 0]),
      ],
    }];
  },

  // Scale patterns
  popIn: (params, duration) => {
    const overshoot = params.overshoot ?? 1.2;
    return [
      {
        property: 'scale',
        keyframes: [
          createKeyframe(0, [0, 0, 100]),
          createKeyframe(duration * 0.6, [overshoot * 100, overshoot * 100, 100], { easing: 'easeOut' }),
          createKeyframe(duration, [100, 100, 100], { easing: 'easeInOut' }),
        ],
      },
      {
        property: 'opacity',
        keyframes: [
          createKeyframe(0, 0),
          createKeyframe(duration * 0.3, 100, { easing: 'easeOut' }),
        ],
      },
    ];
  },

  popOut: (params, duration) => {
    const shrinkFirst = params.shrinkFirst ?? 0.9;
    return [
      {
        property: 'scale',
        keyframes: [
          createKeyframe(0, [100, 100, 100]),
          createKeyframe(duration * 0.2, [shrinkFirst * 100, shrinkFirst * 100, 100], { easing: 'easeIn' }),
          createKeyframe(duration, [0, 0, 100], { easing: 'easeIn' }),
        ],
      },
      {
        property: 'opacity',
        keyframes: [
          createKeyframe(duration * 0.5, 100),
          createKeyframe(duration, 0, { easing: 'easeIn' }),
        ],
      },
    ];
  },

  pulse: (params, duration) => {
    const intensity = params.intensity ?? 1.1;
    const pulses = params.pulses ?? 3;
    const keyframes: Keyframe<number[]>[] = [];
    const pulseLength = duration / pulses;

    for (let i = 0; i < pulses; i++) {
      keyframes.push(
        createKeyframe(i * pulseLength, [100, 100, 100], { easing: 'easeInOut' }),
        createKeyframe(i * pulseLength + pulseLength / 2, [intensity * 100, intensity * 100, 100], { easing: 'easeInOut' })
      );
    }
    keyframes.push(createKeyframe(duration, [100, 100, 100]));

    return [{ property: 'scale', keyframes }];
  },

  // Rotation patterns
  spin: (params, duration) => {
    const rotations = params.rotations ?? 1;
    const direction = params.direction ?? 1;
    return [{
      property: 'rotation',
      keyframes: [
        createKeyframe(0, 0, { easing: 'linear' }),
        createKeyframe(duration, 360 * rotations * direction),
      ],
    }];
  },

  wobble: (params, duration) => {
    const intensity = params.intensity ?? 15;
    const wobbles = params.wobbles ?? 3;
    const keyframes: Keyframe<number>[] = [];
    const wobbleLength = duration / (wobbles * 2);

    for (let i = 0; i < wobbles * 2; i++) {
      const angle = (i % 2 === 0 ? -1 : 1) * intensity * (1 - i / (wobbles * 2));
      keyframes.push(createKeyframe(i * wobbleLength, angle, { easing: 'easeInOut' }));
    }
    keyframes.push(createKeyframe(duration, 0));

    return [{ property: 'rotation', keyframes }];
  },

  // Opacity patterns
  fadeIn: (params, duration) => [{
    property: 'opacity',
    keyframes: [
      createKeyframe(0, 0, { easing: 'easeOut' }),
      createKeyframe(duration, 100),
    ],
  }],

  fadeOut: (params, duration) => [{
    property: 'opacity',
    keyframes: [
      createKeyframe(0, 100, { easing: 'easeIn' }),
      createKeyframe(duration, 0),
    ],
  }],

  blink: (params, duration) => {
    const blinks = params.blinks ?? 3;
    const keyframes: Keyframe<number>[] = [];
    const blinkLength = duration / blinks;

    for (let i = 0; i < blinks; i++) {
      keyframes.push(
        createKeyframe(i * blinkLength, 100, { hold: true }),
        createKeyframe(i * blinkLength + blinkLength / 2, 0, { hold: true })
      );
    }
    keyframes.push(createKeyframe(duration, 100));

    return [{ property: 'opacity', keyframes }];
  },

  // Complex patterns
  bounce: (params, duration) => {
    const height = params.height ?? 100;
    const bounces = params.bounces ?? 3;
    const keyframes: Keyframe<number[]>[] = [];
    let currentTime = 0;

    for (let i = 0; i < bounces; i++) {
      const bounceFactor = Math.pow(0.6, i);
      const bounceHeight = height * bounceFactor;
      const bounceDuration = (duration / bounces) * bounceFactor;

      keyframes.push(
        createKeyframe(currentTime, [0, 0, 0], { easing: 'easeOut' }),
        createKeyframe(currentTime + bounceDuration / 2, [0, -bounceHeight, 0], { easing: 'easeIn' }),
        createKeyframe(currentTime + bounceDuration, [0, 0, 0], { easing: 'easeOut' })
      );
      currentTime += bounceDuration;
    }

    // Squash and stretch on landing
    return [
      { property: 'position', keyframes },
    ];
  },

  shake: (params, duration) => {
    const intensity = params.intensity ?? 10;
    const shakes = params.shakes ?? 5;
    const keyframes: Keyframe<number[]>[] = [];
    const shakeLength = duration / (shakes * 2);

    for (let i = 0; i < shakes * 2; i++) {
      const offset = (Math.random() - 0.5) * intensity * 2;
      const offsetY = (Math.random() - 0.5) * intensity;
      keyframes.push(createKeyframe(i * shakeLength, [offset, offsetY, 0]));
    }
    keyframes.push(createKeyframe(duration, [0, 0, 0]));

    return [{ property: 'position', keyframes }];
  },

  float: (params, duration) => {
    const distance = params.distance ?? 20;
    const cycles = params.cycles ?? 2;
    const keyframes: Keyframe<number[]>[] = [];
    const cycleLength = duration / cycles;

    for (let i = 0; i < cycles; i++) {
      keyframes.push(
        createKeyframe(i * cycleLength, [0, 0, 0], { easing: 'easeInOut' }),
        createKeyframe(i * cycleLength + cycleLength / 2, [0, -distance, 0], { easing: 'easeInOut' })
      );
    }
    keyframes.push(createKeyframe(duration, [0, 0, 0]));

    return [{ property: 'position', keyframes }];
  },

  heartbeat: (params, duration) => {
    const scale = params.scale ?? 1.3;
    return [{
      property: 'scale',
      keyframes: [
        createKeyframe(0, [100, 100, 100], { easing: 'easeOut' }),
        createKeyframe(duration * 0.14, [scale * 100, scale * 100, 100], { easing: 'easeIn' }),
        createKeyframe(duration * 0.28, [100, 100, 100], { easing: 'easeOut' }),
        createKeyframe(duration * 0.42, [scale * 0.85 * 100, scale * 0.85 * 100, 100], { easing: 'easeIn' }),
        createKeyframe(duration * 0.7, [100, 100, 100]),
        createKeyframe(duration, [100, 100, 100]),
      ],
    }];
  },
};

export class MotionCopilot {
  private fps: number;

  constructor(fps = 60) {
    this.fps = fps;
  }

  // --------------------------------------------------------------------------
  // Pattern-based Generation
  // --------------------------------------------------------------------------

  generate(patternName: string, options: {
    duration?: number;
    params?: Record<string, number>;
  } = {}): MotionResult[] {
    const pattern = MOTION_PATTERNS[patternName];
    if (!pattern) {
      throw new Error(`Unknown motion pattern: ${patternName}`);
    }

    const duration = options.duration ?? this.fps; // Default 1 second
    return pattern(options.params ?? {}, duration, this.fps);
  }

  // --------------------------------------------------------------------------
  // Prompt-based Generation (simplified NLP)
  // --------------------------------------------------------------------------

  fromPrompt(prompt: string, duration?: number): MotionResult[] {
    const parsed = this.parsePrompt(prompt);
    return this.generateFromParsed(parsed, duration ?? this.fps);
  }

  private parsePrompt(prompt: string): ParsedMotion {
    const lowerPrompt = prompt.toLowerCase();

    // Detect motion type
    let type: ParsedMotion['type'] = 'move';
    const params: Record<string, number | string> = {};
    let easing: EasingType = 'easeInOut';

    // Movement detection
    if (lowerPrompt.includes('slide') || lowerPrompt.includes('move')) {
      type = 'move';
      if (lowerPrompt.includes('left')) params.direction = 0;
      else if (lowerPrompt.includes('right')) params.direction = 1;
      else if (lowerPrompt.includes('up') || lowerPrompt.includes('top')) params.direction = 2;
      else if (lowerPrompt.includes('down') || lowerPrompt.includes('bottom')) params.direction = 3;
    } else if (lowerPrompt.includes('grow') || lowerPrompt.includes('shrink') || lowerPrompt.includes('scale')) {
      type = 'scale';
    } else if (lowerPrompt.includes('rotate') || lowerPrompt.includes('spin')) {
      type = 'spin';
    } else if (lowerPrompt.includes('fade')) {
      type = 'fade';
    } else if (lowerPrompt.includes('bounce')) {
      type = 'bounce';
    } else if (lowerPrompt.includes('shake')) {
      type = 'shake';
    } else if (lowerPrompt.includes('pulse') || lowerPrompt.includes('throb')) {
      type = 'pulse';
    }

    // Easing detection
    if (lowerPrompt.includes('smooth') || lowerPrompt.includes('gentle')) {
      easing = 'easeInOut';
    } else if (lowerPrompt.includes('snap') || lowerPrompt.includes('quick')) {
      easing = 'easeOut';
    } else if (lowerPrompt.includes('slow')) {
      easing = 'easeIn';
    } else if (lowerPrompt.includes('linear') || lowerPrompt.includes('constant')) {
      easing = 'linear';
    }

    // Speed/intensity extraction
    const speedMatch = prompt.match(/(\d+)\s*(times|x|px|degrees|%)/i);
    if (speedMatch) {
      params.amount = parseInt(speedMatch[1], 10);
    }

    // Duration detection (in seconds)
    const durationMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(?:second|sec|s)/i);
    const timing: { duration: number; delay?: number; repeat?: number } = {
      duration: durationMatch ? parseFloat(durationMatch[1]) * this.fps : this.fps,
    };

    // Repeat detection
    const repeatMatch = prompt.match(/(\d+)\s*(?:times|loops?)/i);
    if (repeatMatch) {
      timing.repeat = parseInt(repeatMatch[1], 10);
    }

    return { type, params, timing, easing };
  }

  private generateFromParsed(parsed: ParsedMotion, defaultDuration: number): MotionResult[] {
    const duration = parsed.timing.duration || defaultDuration;

    switch (parsed.type) {
      case 'move':
        return parsed.params.direction !== undefined
          ? MOTION_PATTERNS.slideIn({ direction: parsed.params.direction as number, distance: (parsed.params.amount as number) || 500 }, duration, this.fps)
          : MOTION_PATTERNS.float({ distance: (parsed.params.amount as number) || 20 }, duration, this.fps);

      case 'scale':
        return MOTION_PATTERNS.popIn({ overshoot: 1 + ((parsed.params.amount as number) || 20) / 100 }, duration, this.fps);

      case 'spin':
        return MOTION_PATTERNS.spin({ rotations: (parsed.params.amount as number) || 1 }, duration, this.fps);

      case 'fade':
        return MOTION_PATTERNS.fadeIn({}, duration, this.fps);

      case 'bounce':
        return MOTION_PATTERNS.bounce({ height: (parsed.params.amount as number) || 100 }, duration, this.fps);

      case 'shake':
        return MOTION_PATTERNS.shake({ intensity: (parsed.params.amount as number) || 10 }, duration, this.fps);

      case 'pulse':
        return MOTION_PATTERNS.pulse({ intensity: 1 + ((parsed.params.amount as number) || 10) / 100 }, duration, this.fps);

      default:
        return [];
    }
  }

  // --------------------------------------------------------------------------
  // Apply to Animation
  // --------------------------------------------------------------------------

  applyToLayer(
    animation: LottieAnimation,
    layerIndex: number,
    results: MotionResult[]
  ): LottieAnimation {
    const layer = animation.layers.find((l) => l.ind === layerIndex);
    if (!layer) {
      throw new Error(`Layer ${layerIndex} not found`);
    }

    for (const result of results) {
      switch (result.property) {
        case 'position':
          layer.ks.p = animatedProperty(result.keyframes as Keyframe<number[]>[]);
          break;
        case 'scale':
          layer.ks.s = animatedProperty(result.keyframes as Keyframe<number[]>[]);
          break;
        case 'rotation':
          layer.ks.r = animatedProperty(result.keyframes as Keyframe<number>[]);
          break;
        case 'opacity':
          layer.ks.o = animatedProperty(result.keyframes as Keyframe<number>[]);
          break;
      }
    }

    return animation;
  }

  // --------------------------------------------------------------------------
  // Available Patterns
  // --------------------------------------------------------------------------

  static getAvailablePatterns(): string[] {
    return Object.keys(MOTION_PATTERNS);
  }

  static getPatternDescription(name: string): string {
    const descriptions: Record<string, string> = {
      slideIn: 'Slide element in from outside the canvas',
      slideOut: 'Slide element out of the canvas',
      popIn: 'Scale up from 0 with overshoot bounce',
      popOut: 'Scale down to 0 with pre-shrink',
      pulse: 'Rhythmic scale pulsing',
      spin: 'Continuous rotation',
      wobble: 'Back-and-forth rotation that settles',
      fadeIn: 'Opacity from 0 to 100',
      fadeOut: 'Opacity from 100 to 0',
      blink: 'Rapid on/off opacity changes',
      bounce: 'Vertical bouncing with decay',
      shake: 'Random position shaking',
      float: 'Smooth up-down hovering motion',
      heartbeat: 'Double-beat scale animation',
    };
    return descriptions[name] ?? 'No description available';
  }
}
