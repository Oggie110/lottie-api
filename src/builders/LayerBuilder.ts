// ============================================================================
// Layer Builder - Fluent API for creating Lottie layers
// ============================================================================

import type {
  Layer,
  ShapeLayer,
  ShapeElement,
  GroupShape,
  RectShape,
  EllipseShape,
  PathShape,
  FillShape,
  StrokeShape,
  TrimShape,
  TransformShape,
  RepeaterShape,
  Transform,
  AnimatedProperty,
  BlendMode,
  MatteMode,
  ShapePath,
  EasingType,
} from '../types';
import {
  staticProperty,
  animatedProperty,
  createKeyframe,
  createDefaultTransform,
  hexToRgba,
  createPolygonPath,
  createStarPath,
} from '../utils';

type LayerType = 'shape' | 'solid' | 'text' | 'null' | 'image' | 'precomp';

export class LayerBuilder {
  private layer: Partial<Layer>;
  private shapes: ShapeElement[] = [];
  private currentGroup: ShapeElement[] | null = null;

  constructor(
    type: LayerType,
    options: {
      name?: string;
      index?: number;
      inPoint?: number;
      outPoint?: number;
    } = {}
  ) {
    const typeMap: Record<LayerType, 0 | 1 | 2 | 3 | 4 | 5> = {
      precomp: 0,
      solid: 1,
      image: 2,
      null: 3,
      shape: 4,
      text: 5,
    };

    this.layer = {
      ty: typeMap[type] as 0 | 1 | 2 | 3 | 4 | 5,
      ind: options.index ?? 0,
      nm: options.name ?? 'Layer',
      ks: createDefaultTransform(),
      ip: options.inPoint ?? 0,
      op: options.outPoint ?? 60,
      st: 0,
      ddd: 0,
    };
  }

  // --------------------------------------------------------------------------
  // Layer Properties
  // --------------------------------------------------------------------------

  setName(name: string): this {
    this.layer.nm = name;
    return this;
  }

  setBlendMode(mode: BlendMode): this {
    this.layer.bm = mode;
    return this;
  }

  setMatteMode(mode: MatteMode): this {
    this.layer.tt = mode;
    return this;
  }

  setParent(parentIndex: number): this {
    this.layer.parent = parentIndex;
    return this;
  }

  setHidden(hidden: boolean): this {
    this.layer.hidden = hidden;
    return this;
  }

  // --------------------------------------------------------------------------
  // Transform Properties
  // --------------------------------------------------------------------------

  setPosition(x: number, y: number, z = 0): this {
    (this.layer.ks as Transform).p = staticProperty([x, y, z]);
    return this;
  }

  setAnchor(x: number, y: number, z = 0): this {
    (this.layer.ks as Transform).a = staticProperty([x, y, z]);
    return this;
  }

  setScale(x: number, y: number, z = 100): this {
    (this.layer.ks as Transform).s = staticProperty([x, y, z]);
    return this;
  }

  setRotation(degrees: number): this {
    (this.layer.ks as Transform).r = staticProperty(degrees);
    return this;
  }

  setOpacity(opacity: number): this {
    (this.layer.ks as Transform).o = staticProperty(opacity);
    return this;
  }

  // --------------------------------------------------------------------------
  // Animated Transforms
  // --------------------------------------------------------------------------

  animatePosition(keyframes: Array<{ time: number; value: number[]; easing?: EasingType }>): this {
    (this.layer.ks as Transform).p = animatedProperty(
      keyframes.map((kf) => createKeyframe(kf.time, kf.value, { easing: kf.easing }))
    );
    return this;
  }

  animateScale(keyframes: Array<{ time: number; value: number[]; easing?: EasingType }>): this {
    (this.layer.ks as Transform).s = animatedProperty(
      keyframes.map((kf) => createKeyframe(kf.time, kf.value, { easing: kf.easing }))
    );
    return this;
  }

  animateRotation(keyframes: Array<{ time: number; value: number; easing?: EasingType }>): this {
    // Lottie expects scalar values wrapped in arrays for keyframes
    (this.layer.ks as Transform).r = animatedProperty(
      keyframes.map((kf) => createKeyframe(kf.time, [kf.value], { easing: kf.easing }))
    ) as unknown as AnimatedProperty<number>;
    return this;
  }

  animateOpacity(keyframes: Array<{ time: number; value: number; easing?: EasingType }>): this {
    // Lottie expects scalar values wrapped in arrays for keyframes
    (this.layer.ks as Transform).o = animatedProperty(
      keyframes.map((kf) => createKeyframe(kf.time, [kf.value], { easing: kf.easing }))
    ) as unknown as AnimatedProperty<number>;
    return this;
  }

  // --------------------------------------------------------------------------
  // Shape Creation
  // --------------------------------------------------------------------------

  beginGroup(_name = 'Group'): this {
    this.currentGroup = [];
    return this;
  }

  endGroup(name = 'Group'): this {
    if (this.currentGroup) {
      // Sort shapes in correct Lottie order:
      // 1. Paths/shapes (rc, el, sr, sh)
      // 2. Modifiers (tm, rd, rp, mm)
      // 3. Fill/stroke (fl, st, gf, gs)
      // 4. Transform (tr) - always last
      const shapeOrder: Record<string, number> = {
        'rc': 1, 'el': 1, 'sr': 1, 'sh': 1, 'pl': 1, // Paths
        'tm': 2, 'rd': 2, 'rp': 2, 'mm': 2, 'pb': 2, 'tw': 2, 'op': 2, // Modifiers
        'fl': 3, 'st': 3, 'gf': 3, 'gs': 3, // Fill/stroke
        'tr': 4, // Transform
      };

      this.currentGroup.sort((a, b) => {
        const orderA = shapeOrder[a.ty] ?? 2;
        const orderB = shapeOrder[b.ty] ?? 2;
        return orderA - orderB;
      });

      // Add default transform to group if not present
      const hasTransform = this.currentGroup.some(s => s.ty === 'tr');
      if (!hasTransform) {
        const groupTransform: TransformShape = {
          ty: 'tr',
          p: staticProperty([0, 0]),
          a: staticProperty([0, 0]),
          s: staticProperty([100, 100]),
          r: staticProperty(0),
          o: staticProperty(100),
        };
        this.currentGroup.push(groupTransform);
      }

      const group: GroupShape = {
        ty: 'gr',
        nm: name,
        it: this.currentGroup,
        np: this.currentGroup.length - 1,
      };
      this.shapes.push(group);
      this.currentGroup = null;
    }
    return this;
  }

  private addShape(shape: ShapeElement): void {
    if (this.currentGroup) {
      this.currentGroup.push(shape);
    } else {
      this.shapes.push(shape);
    }
  }

  addRect(options: {
    name?: string;
    x?: number;
    y?: number;
    width: number;
    height: number;
    roundness?: number;
  }): this {
    const rect: RectShape = {
      ty: 'rc',
      nm: options.name ?? 'Rectangle',
      p: staticProperty([options.x ?? 0, options.y ?? 0]),
      s: staticProperty([options.width, options.height]),
      r: staticProperty(options.roundness ?? 0),
    };
    this.addShape(rect);
    return this;
  }

  addEllipse(options: {
    name?: string;
    x?: number;
    y?: number;
    width: number;
    height: number;
  }): this {
    const ellipse: EllipseShape = {
      ty: 'el',
      nm: options.name ?? 'Ellipse',
      p: staticProperty([options.x ?? 0, options.y ?? 0]),
      s: staticProperty([options.width, options.height]),
    };
    this.addShape(ellipse);
    return this;
  }

  addCircle(options: { name?: string; x?: number; y?: number; radius: number }): this {
    return this.addEllipse({
      name: options.name ?? 'Circle',
      x: options.x,
      y: options.y,
      width: options.radius * 2,
      height: options.radius * 2,
    });
  }

  addPath(options: { name?: string; path: ShapePath; closed?: boolean }): this {
    const path: PathShape = {
      ty: 'sh',
      nm: options.name ?? 'Path',
      ks: staticProperty({ ...options.path, c: options.closed ?? options.path.c ?? true }),
    };
    this.addShape(path);
    return this;
  }

  addPolygon(options: {
    name?: string;
    x?: number;
    y?: number;
    radius: number;
    sides: number;
  }): this {
    const path = createPolygonPath(
      options.x ?? 0,
      options.y ?? 0,
      options.radius,
      options.sides
    );
    return this.addPath({ name: options.name ?? 'Polygon', path, closed: true });
  }

  addStar(options: {
    name?: string;
    x?: number;
    y?: number;
    outerRadius: number;
    innerRadius: number;
    points: number;
  }): this {
    const path = createStarPath(
      options.x ?? 0,
      options.y ?? 0,
      options.outerRadius,
      options.innerRadius,
      options.points
    );
    return this.addPath({ name: options.name ?? 'Star', path, closed: true });
  }

  // --------------------------------------------------------------------------
  // Fill & Stroke
  // --------------------------------------------------------------------------

  addFill(options: { name?: string; color: string | number[]; opacity?: number }): this {
    const color = typeof options.color === 'string' ? hexToRgba(options.color) : options.color;
    const fill: FillShape = {
      ty: 'fl',
      nm: options.name ?? 'Fill',
      o: staticProperty(options.opacity ?? 100),
      c: staticProperty(color),
      r: 1,
    };
    this.addShape(fill);
    return this;
  }

  addStroke(options: {
    name?: string;
    color: string | number[];
    width?: number;
    opacity?: number;
    lineCap?: 1 | 2 | 3;
    lineJoin?: 1 | 2 | 3;
    dashes?: Array<{ type: 'o' | 'd' | 'g'; value: number }>;
  }): this {
    const color = typeof options.color === 'string' ? hexToRgba(options.color) : options.color;
    const stroke: StrokeShape = {
      ty: 'st',
      nm: options.name ?? 'Stroke',
      o: staticProperty(options.opacity ?? 100),
      c: staticProperty(color),
      w: staticProperty(options.width ?? 2),
      lc: options.lineCap ?? 2,
      lj: options.lineJoin ?? 2,
    };
    if (options.dashes) {
      stroke.d = options.dashes.map((d) => ({
        n: d.type,
        v: staticProperty(d.value),
      }));
    }
    this.addShape(stroke);
    return this;
  }

  // --------------------------------------------------------------------------
  // Shape Modifiers
  // --------------------------------------------------------------------------

  addTrim(options: {
    name?: string;
    start?: number;
    end?: number;
    offset?: number;
    animated?: boolean;
  }): this {
    const trim: TrimShape = {
      ty: 'tm',
      nm: options.name ?? 'Trim Paths',
      s: staticProperty(options.start ?? 0),
      e: staticProperty(options.end ?? 100),
      o: staticProperty(options.offset ?? 0),
      m: 1,
    };
    this.addShape(trim);
    return this;
  }

  addAnimatedTrim(keyframes: {
    start?: Array<{ time: number; value: number; easing?: EasingType }>;
    end?: Array<{ time: number; value: number; easing?: EasingType }>;
    offset?: Array<{ time: number; value: number; easing?: EasingType }>;
  }): this {
    // Lottie expects scalar keyframe values wrapped in arrays
    const trim: TrimShape = {
      ty: 'tm',
      nm: 'Trim Paths',
      s: keyframes.start
        ? animatedProperty(keyframes.start.map((kf) => createKeyframe(kf.time, [kf.value], { easing: kf.easing }))) as unknown as AnimatedProperty<number>
        : staticProperty(0),
      e: keyframes.end
        ? animatedProperty(keyframes.end.map((kf) => createKeyframe(kf.time, [kf.value], { easing: kf.easing }))) as unknown as AnimatedProperty<number>
        : staticProperty(100),
      o: keyframes.offset
        ? animatedProperty(keyframes.offset.map((kf) => createKeyframe(kf.time, [kf.value], { easing: kf.easing }))) as unknown as AnimatedProperty<number>
        : staticProperty(0),
      m: 1,
    };
    this.addShape(trim);
    return this;
  }

  addRepeater(options: {
    name?: string;
    copies: number;
    offset?: number;
    transform?: {
      position?: number[];
      scale?: number[];
      rotation?: number;
      opacity?: number;
    };
  }): this {
    const repeater: RepeaterShape = {
      ty: 'rp',
      nm: options.name ?? 'Repeater',
      c: staticProperty(options.copies),
      o: staticProperty(options.offset ?? 0),
      m: 1,
      tr: {
        ty: 'tr',
        p: staticProperty(options.transform?.position ?? [0, 0]),
        a: staticProperty([0, 0]),
        s: staticProperty(options.transform?.scale ?? [100, 100]),
        r: staticProperty(options.transform?.rotation ?? 0),
        o: staticProperty(options.transform?.opacity ?? 100),
      },
    };
    this.addShape(repeater);
    return this;
  }

  // --------------------------------------------------------------------------
  // Build
  // --------------------------------------------------------------------------

  build(): Layer {
    if (this.layer.ty === 4) {
      // Shape layer
      (this.layer as ShapeLayer).shapes = this.shapes;
    }
    return this.layer as Layer;
  }

  // --------------------------------------------------------------------------
  // Static Factory
  // --------------------------------------------------------------------------

  static shape(name?: string): LayerBuilder {
    return new LayerBuilder('shape', { name });
  }

  static solid(name?: string): LayerBuilder {
    return new LayerBuilder('solid', { name });
  }

  static null(name?: string): LayerBuilder {
    return new LayerBuilder('null', { name });
  }
}
