// ============================================================================
// Animation Builder - Fluent API for creating Lottie animations
// ============================================================================

import type {
  LottieAnimation,
  Layer,
  ShapeLayer,
  SolidLayer,
  TextLayer,
  NullLayer,
  ImageLayer,
  PrecompLayer,
  Asset,
  ImageAsset,
  PrecompAsset,
  Marker,
  AnimationMeta,
} from '../types';
import { LayerBuilder } from './LayerBuilder';
import { generateId, createDefaultTransform } from '../utils';

export class AnimationBuilder {
  private animation: LottieAnimation;
  private layerIndex = 0;

  constructor(options: {
    width?: number;
    height?: number;
    fps?: number;
    duration?: number;
    name?: string;
  } = {}) {
    const {
      width = 512,
      height = 512,
      fps = 60,
      duration = 3,
      name = 'Animation',
    } = options;

    this.animation = {
      v: '5.12.1',
      fr: fps,
      ip: 0,
      op: Math.round(fps * duration),
      w: width,
      h: height,
      nm: name,
      ddd: 0,
      assets: [],
      layers: [],
      markers: [],
    };
  }

  // --------------------------------------------------------------------------
  // Basic Properties
  // --------------------------------------------------------------------------

  setName(name: string): this {
    this.animation.nm = name;
    return this;
  }

  setSize(width: number, height: number): this {
    this.animation.w = width;
    this.animation.h = height;
    return this;
  }

  setFrameRate(fps: number): this {
    const ratio = fps / this.animation.fr;
    this.animation.fr = fps;
    this.animation.op = Math.round(this.animation.op * ratio);
    return this;
  }

  setDuration(seconds: number): this {
    this.animation.op = Math.round(this.animation.fr * seconds);
    return this;
  }

  setMeta(meta: Partial<AnimationMeta>): this {
    this.animation.meta = { ...this.animation.meta, ...meta };
    return this;
  }

  // --------------------------------------------------------------------------
  // Layer Management
  // --------------------------------------------------------------------------

  addLayer(layer: Layer): this {
    if (layer.ind === undefined) {
      layer.ind = this.layerIndex++;
    }
    this.animation.layers.push(layer);
    return this;
  }

  addShapeLayer(
    name: string,
    configure?: (builder: LayerBuilder) => void
  ): this {
    const builder = new LayerBuilder('shape', {
      name,
      index: this.layerIndex++,
      inPoint: 0,
      outPoint: this.animation.op,
    });

    if (configure) {
      configure(builder);
    }

    this.animation.layers.push(builder.build() as ShapeLayer);
    return this;
  }

  addSolidLayer(options: {
    name: string;
    color: string;
    width?: number;
    height?: number;
  }): this {
    const layer: SolidLayer = {
      ty: 1,
      ind: this.layerIndex++,
      nm: options.name,
      ks: createDefaultTransform(),
      ip: 0,
      op: this.animation.op,
      st: 0,
      sw: options.width ?? this.animation.w,
      sh: options.height ?? this.animation.h,
      sc: options.color,
    };
    this.animation.layers.push(layer);
    return this;
  }

  addTextLayer(options: {
    name: string;
    text: string;
    fontSize?: number;
    fontFamily?: string;
    color?: number[];
    position?: number[];
  }): this {
    const layer: TextLayer = {
      ty: 5,
      ind: this.layerIndex++,
      nm: options.name,
      ks: {
        ...createDefaultTransform(),
        p: { a: 0, k: options.position ?? [this.animation.w / 2, this.animation.h / 2, 0] },
      },
      ip: 0,
      op: this.animation.op,
      st: 0,
      t: {
        d: {
          k: [
            {
              t: 0,
              s: {
                s: options.fontSize ?? 24,
                f: options.fontFamily ?? 'Arial',
                t: options.text,
                fc: options.color ?? [1, 1, 1],
                j: 2,
              },
            },
          ],
        },
      },
    };
    this.animation.layers.push(layer);
    return this;
  }

  addNullLayer(name: string): this {
    const layer: NullLayer = {
      ty: 3,
      ind: this.layerIndex++,
      nm: name,
      ks: createDefaultTransform(),
      ip: 0,
      op: this.animation.op,
      st: 0,
    };
    this.animation.layers.push(layer);
    return this;
  }

  addImageLayer(options: {
    name: string;
    assetId: string;
    position?: number[];
    scale?: number[];
  }): this {
    const layer: ImageLayer = {
      ty: 2,
      ind: this.layerIndex++,
      nm: options.name,
      refId: options.assetId,
      ks: {
        ...createDefaultTransform(),
        p: { a: 0, k: options.position ?? [this.animation.w / 2, this.animation.h / 2, 0] },
        s: { a: 0, k: options.scale ?? [100, 100, 100] },
      },
      ip: 0,
      op: this.animation.op,
      st: 0,
    };
    this.animation.layers.push(layer);
    return this;
  }

  addPrecompLayer(options: {
    name: string;
    assetId: string;
    width?: number;
    height?: number;
  }): this {
    const layer: PrecompLayer = {
      ty: 0,
      ind: this.layerIndex++,
      nm: options.name,
      refId: options.assetId,
      ks: createDefaultTransform(),
      ip: 0,
      op: this.animation.op,
      st: 0,
      w: options.width ?? this.animation.w,
      h: options.height ?? this.animation.h,
    };
    this.animation.layers.push(layer);
    return this;
  }

  // --------------------------------------------------------------------------
  // Asset Management
  // --------------------------------------------------------------------------

  addAsset(asset: Asset): this {
    this.animation.assets = this.animation.assets ?? [];
    this.animation.assets.push(asset);
    return this;
  }

  addImageAsset(options: {
    id?: string;
    path: string;
    width: number;
    height: number;
    embedded?: boolean;
  }): string {
    const id = options.id ?? generateId('img');
    const asset: ImageAsset = {
      id,
      w: options.width,
      h: options.height,
      p: options.path,
      e: options.embedded ? 1 : 0,
    };
    this.addAsset(asset);
    return id;
  }

  addPrecompAsset(options: {
    id?: string;
    name?: string;
    layers: Layer[];
  }): string {
    const id = options.id ?? generateId('comp');
    const asset: PrecompAsset = {
      id,
      nm: options.name,
      layers: options.layers,
    };
    this.addAsset(asset);
    return id;
  }

  // --------------------------------------------------------------------------
  // Markers
  // --------------------------------------------------------------------------

  addMarker(time: number, name: string, duration?: number): this {
    const marker: Marker = {
      tm: time,
      cm: name,
    };
    if (duration !== undefined) {
      marker.dr = duration;
    }
    this.animation.markers = this.animation.markers ?? [];
    this.animation.markers.push(marker);
    return this;
  }

  addMarkerAtSecond(timeInSeconds: number, name: string, durationInSeconds?: number): this {
    const frame = Math.round(timeInSeconds * this.animation.fr);
    const durationFrames = durationInSeconds
      ? Math.round(durationInSeconds * this.animation.fr)
      : undefined;
    return this.addMarker(frame, name, durationFrames);
  }

  // --------------------------------------------------------------------------
  // Layer Parenting
  // --------------------------------------------------------------------------

  setParent(layerIndex: number, parentIndex: number): this {
    const layer = this.animation.layers.find((l) => l.ind === layerIndex);
    if (layer) {
      layer.parent = parentIndex;
    }
    return this;
  }

  // --------------------------------------------------------------------------
  // Layer Visibility
  // --------------------------------------------------------------------------

  setLayerTiming(
    layerIndex: number,
    options: { inPoint?: number; outPoint?: number; startTime?: number }
  ): this {
    const layer = this.animation.layers.find((l) => l.ind === layerIndex);
    if (layer) {
      if (options.inPoint !== undefined) layer.ip = options.inPoint;
      if (options.outPoint !== undefined) layer.op = options.outPoint;
      if (options.startTime !== undefined) layer.st = options.startTime;
    }
    return this;
  }

  // --------------------------------------------------------------------------
  // Build
  // --------------------------------------------------------------------------

  build(): LottieAnimation {
    return this.animation;
  }

  toJSON(): string {
    return JSON.stringify(this.animation);
  }

  toPrettyJSON(): string {
    return JSON.stringify(this.animation, null, 2);
  }

  // --------------------------------------------------------------------------
  // Static Factory Methods
  // --------------------------------------------------------------------------

  static create(options?: {
    width?: number;
    height?: number;
    fps?: number;
    duration?: number;
    name?: string;
  }): AnimationBuilder {
    return new AnimationBuilder(options);
  }

  static fromJSON(json: string | LottieAnimation): AnimationBuilder {
    const animation =
      typeof json === 'string' ? (JSON.parse(json) as LottieAnimation) : json;
    const builder = new AnimationBuilder({
      width: animation.w,
      height: animation.h,
      fps: animation.fr,
      duration: animation.op / animation.fr,
      name: animation.nm,
    });
    builder.animation = animation;
    builder.layerIndex = Math.max(0, ...animation.layers.map((l) => (l.ind ?? 0) + 1));
    return builder;
  }
}
