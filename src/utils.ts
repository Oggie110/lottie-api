// ============================================================================
// Utility Functions
// ============================================================================

import type {
  AnimatedProperty,
  Keyframe,
  ShapePath,
  EasingType,
} from './types';

// ----------------------------------------------------------------------------
// Color Utilities
// ----------------------------------------------------------------------------

export function hexToRgba(hex: string): number[] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(
    hex
  );
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
    result[4] ? parseInt(result[4], 16) / 255 : 1,
  ];
}

export function rgbaToHex(rgba: number[]): string {
  const [r, g, b, a = 1] = rgba;
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${a < 1 ? toHex(a) : ''}`;
}

export function lerpColor(
  color1: number[],
  color2: number[],
  t: number
): number[] {
  return color1.map((c, i) => c + (color2[i] - c) * t);
}

// ----------------------------------------------------------------------------
// Property Utilities
// ----------------------------------------------------------------------------

export function staticProperty<T>(value: T): AnimatedProperty<T> {
  return { a: 0, k: value };
}

export function animatedProperty<T>(
  keyframes: Keyframe<T>[]
): AnimatedProperty<T> {
  return { a: 1, k: keyframes };
}

export function createKeyframe<T>(
  time: number,
  value: T,
  options: {
    easing?: EasingType | { i: { x: number; y: number }; o: { x: number; y: number } };
    hold?: boolean;
  } = {}
): Keyframe<T> {
  const kf: Keyframe<T> = { t: time, s: value };

  if (options.hold) {
    kf.h = 1;
  } else if (options.easing) {
    if (typeof options.easing === 'object') {
      kf.i = options.easing.i;
      kf.o = options.easing.o;
    } else {
      const curves = getEasingCurve(options.easing);
      kf.i = curves.i;
      kf.o = curves.o;
    }
  }

  return kf;
}

export function getEasingCurve(easing: EasingType): {
  i: { x: number; y: number };
  o: { x: number; y: number };
} {
  switch (easing) {
    case 'linear':
      return { i: { x: 1, y: 1 }, o: { x: 0, y: 0 } };
    case 'easeIn':
      return { i: { x: 0.42, y: 0 }, o: { x: 1, y: 1 } };
    case 'easeOut':
      return { i: { x: 0, y: 0 }, o: { x: 0.58, y: 1 } };
    case 'easeInOut':
      return { i: { x: 0.42, y: 0 }, o: { x: 0.58, y: 1 } };
    default:
      return { i: { x: 0.5, y: 0 }, o: { x: 0.5, y: 1 } };
  }
}

// ----------------------------------------------------------------------------
// Path Utilities
// ----------------------------------------------------------------------------

export function createRectPath(
  x: number,
  y: number,
  width: number,
  height: number
): ShapePath {
  const hw = width / 2;
  const hh = height / 2;
  return {
    c: true,
    v: [
      [x - hw, y - hh],
      [x + hw, y - hh],
      [x + hw, y + hh],
      [x - hw, y + hh],
    ],
    i: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
    o: [
      [0, 0],
      [0, 0],
      [0, 0],
      [0, 0],
    ],
  };
}

export function createCirclePath(
  cx: number,
  cy: number,
  radius: number
): ShapePath {
  const k = 0.5522847498; // Bezier approximation constant
  const r = radius;
  const c = r * k;

  return {
    c: true,
    v: [
      [cx, cy - r],
      [cx + r, cy],
      [cx, cy + r],
      [cx - r, cy],
    ],
    i: [
      [-c, 0],
      [0, -c],
      [c, 0],
      [0, c],
    ],
    o: [
      [c, 0],
      [0, c],
      [-c, 0],
      [0, -c],
    ],
  };
}

export function createPolygonPath(
  cx: number,
  cy: number,
  radius: number,
  sides: number
): ShapePath {
  const vertices: number[][] = [];
  const inTangents: number[][] = [];
  const outTangents: number[][] = [];

  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    vertices.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
    inTangents.push([0, 0]);
    outTangents.push([0, 0]);
  }

  return {
    c: true,
    v: vertices,
    i: inTangents,
    o: outTangents,
  };
}

export function createStarPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number
): ShapePath {
  const vertices: number[][] = [];
  const inTangents: number[][] = [];
  const outTangents: number[][] = [];

  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    inTangents.push([0, 0]);
    outTangents.push([0, 0]);
  }

  return {
    c: true,
    v: vertices,
    i: inTangents,
    o: outTangents,
  };
}

// ----------------------------------------------------------------------------
// Transform Utilities
// ----------------------------------------------------------------------------

export function createDefaultTransform() {
  return {
    a: staticProperty([0, 0, 0]),
    p: staticProperty([0, 0, 0]),
    s: staticProperty([100, 100, 100]),
    r: staticProperty(0),
    o: staticProperty(100),
  };
}

export function createTransform(options: {
  anchor?: number[];
  position?: number[];
  scale?: number[];
  rotation?: number;
  opacity?: number;
}) {
  return {
    a: staticProperty(options.anchor ?? [0, 0, 0]),
    p: staticProperty(options.position ?? [0, 0, 0]),
    s: staticProperty(options.scale ?? [100, 100, 100]),
    r: staticProperty(options.rotation ?? 0),
    o: staticProperty(options.opacity ?? 100),
  };
}

// ----------------------------------------------------------------------------
// Frame/Time Utilities
// ----------------------------------------------------------------------------

export function secondsToFrames(seconds: number, fps: number): number {
  return Math.round(seconds * fps);
}

export function framesToSeconds(frames: number, fps: number): number {
  return frames / fps;
}

export function msToFrames(ms: number, fps: number): number {
  return Math.round((ms / 1000) * fps);
}

// ----------------------------------------------------------------------------
// ID Generation
// ----------------------------------------------------------------------------

export function generateId(prefix = ''): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return prefix ? `${prefix}_${id}` : id;
}

// ----------------------------------------------------------------------------
// Deep Clone
// ----------------------------------------------------------------------------

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ----------------------------------------------------------------------------
// Path Manipulation
// ----------------------------------------------------------------------------

export function getPropertyPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

export function setPropertyPath(obj: unknown, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: unknown = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof current === 'object' && current !== null) {
      if (!(part in (current as Record<string, unknown>))) {
        (current as Record<string, unknown>)[part] = {};
      }
      current = (current as Record<string, unknown>)[part];
    }
  }
  if (typeof current === 'object' && current !== null) {
    (current as Record<string, unknown>)[parts[parts.length - 1]] = value;
  }
}
