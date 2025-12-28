// ============================================================================
// Lottie Creator API Types
// ============================================================================

// ----------------------------------------------------------------------------
// Core Animation Types
// ----------------------------------------------------------------------------

export interface LottieAnimation {
  v: string; // Version
  fr: number; // Frame rate
  ip: number; // In-point (start frame)
  op: number; // Out-point (end frame)
  w: number; // Width
  h: number; // Height
  nm?: string; // Name
  ddd?: 0 | 1; // 3D flag
  assets?: Asset[];
  layers: Layer[];
  markers?: Marker[];
  meta?: AnimationMeta;
}

export interface AnimationMeta {
  g?: string; // Generator
  a?: string; // Author
  k?: string; // Keywords
  d?: string; // Description
  tc?: string; // Theme color
}

export interface Marker {
  tm: number; // Time
  cm: string; // Comment/name
  dr?: number; // Duration
}

// ----------------------------------------------------------------------------
// Asset Types
// ----------------------------------------------------------------------------

export type Asset = ImageAsset | PrecompAsset | AudioAsset;

export interface ImageAsset {
  id: string;
  w: number;
  h: number;
  u?: string; // Path
  p: string; // Filename or embedded data
  e?: 0 | 1; // Embedded flag
}

export interface PrecompAsset {
  id: string;
  nm?: string;
  fr?: number;
  layers: Layer[];
}

export interface AudioAsset {
  id: string;
  nm?: string;
  p: string;
  u?: string;
  e?: 0 | 1;
}

// ----------------------------------------------------------------------------
// Layer Types
// ----------------------------------------------------------------------------

export type Layer =
  | PrecompLayer
  | SolidLayer
  | ImageLayer
  | NullLayer
  | ShapeLayer
  | TextLayer
  | AudioLayer;

export interface BaseLayer {
  ddd?: 0 | 1;
  ind?: number; // Index
  ty: number; // Type
  nm?: string; // Name
  sr?: number; // Stretch
  ks: Transform;
  ao?: 0 | 1; // Auto-orient
  ip: number; // In-point
  op: number; // Out-point
  st: number; // Start time
  bm?: BlendMode;
  parent?: number;
  tt?: MatteMode;
  td?: 0 | 1; // Track matte target
  hasMask?: boolean;
  masksProperties?: Mask[];
  ef?: Effect[];
  hidden?: boolean;
}

export interface PrecompLayer extends BaseLayer {
  ty: 0;
  refId: string;
  w: number;
  h: number;
  tm?: AnimatedProperty<number>;
}

export interface SolidLayer extends BaseLayer {
  ty: 1;
  sw: number;
  sh: number;
  sc: string; // Color hex
}

export interface ImageLayer extends BaseLayer {
  ty: 2;
  refId: string;
}

export interface NullLayer extends BaseLayer {
  ty: 3;
}

export interface ShapeLayer extends BaseLayer {
  ty: 4;
  shapes: ShapeElement[];
}

export interface TextLayer extends BaseLayer {
  ty: 5;
  t: TextData;
}

export interface AudioLayer extends BaseLayer {
  ty: 6;
  refId: string;
}

// ----------------------------------------------------------------------------
// Transform Types
// ----------------------------------------------------------------------------

export interface Transform {
  a?: AnimatedProperty<number[]>; // Anchor point
  p?: AnimatedProperty<number[]>; // Position
  s?: AnimatedProperty<number[]>; // Scale
  r?: AnimatedProperty<number>; // Rotation
  o?: AnimatedProperty<number>; // Opacity
  sk?: AnimatedProperty<number>; // Skew
  sa?: AnimatedProperty<number>; // Skew axis
}

export interface AnimatedProperty<T> {
  a?: 0 | 1; // Animated flag
  k: T | Keyframe<T>[];
  ix?: number; // Property index
  x?: string; // Expression
}

export interface Keyframe<T> {
  t: number; // Time
  s: T; // Start value
  e?: T; // End value (deprecated in newer versions)
  i?: { x: number | number[]; y: number | number[] }; // In tangent
  o?: { x: number | number[]; y: number | number[] }; // Out tangent
  h?: 0 | 1; // Hold keyframe
}

// ----------------------------------------------------------------------------
// Shape Types
// ----------------------------------------------------------------------------

export type ShapeElement =
  | GroupShape
  | RectShape
  | EllipseShape
  | StarShape
  | PathShape
  | FillShape
  | StrokeShape
  | GradientFillShape
  | GradientStrokeShape
  | TrimShape
  | RoundCornersShape
  | MergeShape
  | TransformShape
  | RepeaterShape;

export interface BaseShape {
  ty: string;
  nm?: string;
  hd?: boolean; // Hidden
  ix?: number;
  cix?: number;
  bm?: BlendMode;
}

export interface GroupShape extends BaseShape {
  ty: 'gr';
  it: ShapeElement[];
  np?: number;
}

export interface RectShape extends BaseShape {
  ty: 'rc';
  d?: number; // Direction
  p: AnimatedProperty<number[]>; // Position
  s: AnimatedProperty<number[]>; // Size
  r: AnimatedProperty<number>; // Rounded corners
}

export interface EllipseShape extends BaseShape {
  ty: 'el';
  d?: number;
  p: AnimatedProperty<number[]>;
  s: AnimatedProperty<number[]>;
}

export interface StarShape extends BaseShape {
  ty: 'sr';
  sy?: 1 | 2; // Star type (1 = star, 2 = polygon)
  d?: number;
  pt: AnimatedProperty<number>; // Points
  p: AnimatedProperty<number[]>; // Position
  or: AnimatedProperty<number>; // Outer radius
  os?: AnimatedProperty<number>; // Outer roundness
  ir?: AnimatedProperty<number>; // Inner radius
  is?: AnimatedProperty<number>; // Inner roundness
  r: AnimatedProperty<number>; // Rotation
}

export interface PathShape extends BaseShape {
  ty: 'sh';
  d?: number;
  ks: AnimatedProperty<ShapePath>;
}

export interface ShapePath {
  c: boolean; // Closed
  v: number[][]; // Vertices
  i: number[][]; // In tangents
  o: number[][]; // Out tangents
}

export interface FillShape extends BaseShape {
  ty: 'fl';
  o: AnimatedProperty<number>; // Opacity
  c: AnimatedProperty<number[]>; // Color [r, g, b, a]
  r?: 1 | 2; // Fill rule
}

export interface StrokeShape extends BaseShape {
  ty: 'st';
  o: AnimatedProperty<number>;
  c: AnimatedProperty<number[]>;
  w: AnimatedProperty<number>; // Width
  lc?: 1 | 2 | 3; // Line cap
  lj?: 1 | 2 | 3; // Line join
  ml?: number; // Miter limit
  ml2?: AnimatedProperty<number>;
  d?: DashItem[];
}

export interface DashItem {
  n: 'o' | 'd' | 'g'; // Offset, dash, gap
  v: AnimatedProperty<number>;
}

export interface GradientFillShape extends BaseShape {
  ty: 'gf';
  o: AnimatedProperty<number>;
  s: AnimatedProperty<number[]>; // Start point
  e: AnimatedProperty<number[]>; // End point
  t: 1 | 2; // Type (1 = linear, 2 = radial)
  g: GradientColors;
  r?: 1 | 2;
  h?: AnimatedProperty<number>; // Highlight length
  a?: AnimatedProperty<number>; // Highlight angle
}

export interface GradientStrokeShape extends BaseShape {
  ty: 'gs';
  o: AnimatedProperty<number>;
  s: AnimatedProperty<number[]>;
  e: AnimatedProperty<number[]>;
  t: 1 | 2;
  g: GradientColors;
  w: AnimatedProperty<number>;
  lc?: 1 | 2 | 3;
  lj?: 1 | 2 | 3;
  ml?: number;
}

export interface GradientColors {
  p: number; // Number of colors
  k: AnimatedProperty<number[]>; // Color data
}

export interface TrimShape extends BaseShape {
  ty: 'tm';
  s: AnimatedProperty<number>; // Start
  e: AnimatedProperty<number>; // End
  o: AnimatedProperty<number>; // Offset
  m?: 1 | 2; // Multiple shapes mode
}

export interface RoundCornersShape extends BaseShape {
  ty: 'rd';
  r: AnimatedProperty<number>; // Radius
}

export interface MergeShape extends BaseShape {
  ty: 'mm';
  mm: 1 | 2 | 3 | 4 | 5; // Mode
}

export interface TransformShape extends BaseShape {
  ty: 'tr';
  a?: AnimatedProperty<number[]>;
  p: AnimatedProperty<number[]>;
  s?: AnimatedProperty<number[]>;
  r?: AnimatedProperty<number>;
  o?: AnimatedProperty<number>;
  sk?: AnimatedProperty<number>;
  sa?: AnimatedProperty<number>;
}

export interface RepeaterShape extends BaseShape {
  ty: 'rp';
  c: AnimatedProperty<number>; // Copies
  o: AnimatedProperty<number>; // Offset
  m?: 1 | 2; // Composite mode
  tr: TransformShape;
}

// ----------------------------------------------------------------------------
// Text Types
// ----------------------------------------------------------------------------

export interface TextData {
  d: TextDocument;
  p?: TextPath;
  m?: TextMore;
  a?: TextAnimator[];
}

export interface TextDocument {
  k: TextDocumentKeyframe[];
}

export interface TextDocumentKeyframe {
  s: TextDocumentData;
  t: number;
}

export interface TextDocumentData {
  s: number; // Size
  f: string; // Font family
  t: string; // Text
  ca?: number; // Caps
  j?: 0 | 1 | 2; // Justify
  tr?: number; // Tracking
  lh?: number; // Line height
  ls?: number; // Baseline shift
  fc?: number[]; // Fill color
  sc?: number[]; // Stroke color
  sw?: number; // Stroke width
  of?: boolean; // Stroke over fill
  sz?: number[]; // Size
  ps?: number[]; // Position
}

export interface TextPath {
  m?: number; // Mask index
  f?: AnimatedProperty<number>; // First margin
  l?: AnimatedProperty<number>; // Last margin
  a?: number; // Reverse path
  p?: number; // Perpendicular to path
}

export interface TextMore {
  g?: number; // Grouping alignment
  a?: AnimatedProperty<number[]>;
}

export interface TextAnimator {
  nm?: string;
  s?: TextSelector;
  a?: TextAnimatorProperties;
}

export interface TextSelector {
  t?: number;
  xe?: AnimatedProperty<number>;
  ne?: AnimatedProperty<number>;
  a?: AnimatedProperty<number>;
  b?: number;
  rn?: number;
  sh?: number;
  s?: AnimatedProperty<number>;
  e?: AnimatedProperty<number>;
  o?: AnimatedProperty<number>;
  r?: number;
}

export interface TextAnimatorProperties {
  a?: AnimatedProperty<number[]>;
  s?: AnimatedProperty<number[]>;
  r?: AnimatedProperty<number>;
  o?: AnimatedProperty<number>;
  t?: AnimatedProperty<number[]>;
  fc?: AnimatedProperty<number[]>;
  sc?: AnimatedProperty<number[]>;
  sw?: AnimatedProperty<number>;
  fh?: AnimatedProperty<number>;
  fs?: AnimatedProperty<number>;
  fb?: AnimatedProperty<number>;
  ls?: AnimatedProperty<number>;
  tr?: AnimatedProperty<number>;
}

// ----------------------------------------------------------------------------
// Mask Types
// ----------------------------------------------------------------------------

export interface Mask {
  nm?: string;
  inv?: boolean;
  mode: 'a' | 's' | 'i' | 'f' | 'd' | 'n'; // Add, subtract, intersect, etc.
  pt: AnimatedProperty<ShapePath>;
  o: AnimatedProperty<number>;
  x?: AnimatedProperty<number>;
}

// ----------------------------------------------------------------------------
// Effect Types
// ----------------------------------------------------------------------------

export interface Effect {
  ty: number;
  nm?: string;
  np?: number;
  ix?: number;
  en?: 0 | 1;
  ef?: EffectValue[];
}

export interface EffectValue {
  ty: number;
  nm?: string;
  ix?: number;
  v?: AnimatedProperty<number | number[]>;
}

// ----------------------------------------------------------------------------
// Enums
// ----------------------------------------------------------------------------

export type BlendMode =
  | 0 // Normal
  | 1 // Multiply
  | 2 // Screen
  | 3 // Overlay
  | 4 // Darken
  | 5 // Lighten
  | 6 // Color Dodge
  | 7 // Color Burn
  | 8 // Hard Light
  | 9 // Soft Light
  | 10 // Difference
  | 11 // Exclusion
  | 12 // Hue
  | 13 // Saturation
  | 14 // Color
  | 15; // Luminosity

export type MatteMode =
  | 0 // No matte
  | 1 // Alpha matte
  | 2 // Inverted alpha matte
  | 3 // Luma matte
  | 4; // Inverted luma matte

// ----------------------------------------------------------------------------
// State Machine Types (Lottie Creator specific)
// ----------------------------------------------------------------------------

export interface StateMachine {
  id: string;
  name: string;
  states: State[];
  transitions: Transition[];
  initialState: string;
}

export interface State {
  id: string;
  name: string;
  animation?: {
    segment?: [number, number]; // Frame range
    loop?: boolean;
    speed?: number;
  };
  onEnter?: Action[];
  onExit?: Action[];
}

export interface Transition {
  id: string;
  from: string;
  to: string;
  trigger: Trigger;
  conditions?: Condition[];
  duration?: number;
  easing?: EasingType;
}

export interface Trigger {
  type: 'click' | 'hover' | 'scroll' | 'custom' | 'complete' | 'timeout';
  target?: string; // Layer or element ID
  value?: string | number;
}

export interface Condition {
  variable: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string | number | boolean;
}

export interface Action {
  type: 'setVariable' | 'playSound' | 'emit' | 'goToUrl';
  params: Record<string, unknown>;
}

export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'cubicBezier';

// ----------------------------------------------------------------------------
// Theme Types
// ----------------------------------------------------------------------------

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColor[];
}

export interface ThemeColor {
  path: string; // JSON path to color property
  value: string; // Hex color
  name?: string;
}

// ----------------------------------------------------------------------------
// Export Types
// ----------------------------------------------------------------------------

export type ExportFormat =
  | 'lottie' // .lottie (dotLottie)
  | 'json' // Raw JSON
  | 'mp4'
  | 'webm'
  | 'mov'
  | 'gif'
  | 'png-sequence'
  | 'svg-sequence';

export interface ExportOptions {
  format: ExportFormat;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  width?: number;
  height?: number;
  fps?: number;
  loop?: boolean;
  backgroundColor?: string;
  transparent?: boolean;
  theme?: string;
}

export interface ExportResult {
  url: string;
  size: number;
  format: ExportFormat;
  duration?: number;
  frames?: number;
}

// ----------------------------------------------------------------------------
// API Request/Response Types
// ----------------------------------------------------------------------------

export interface CreateAnimationRequest {
  name: string;
  width: number;
  height: number;
  fps?: number;
  duration?: number; // in seconds
  backgroundColor?: string;
}

export interface CreateAnimationResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  animation: LottieAnimation;
}

export interface AIGenerateRequest {
  type: 'motion' | 'vector' | 'stateMachine' | 'theme';
  prompt: string;
  context?: {
    animationId?: string;
    layerId?: string;
    style?: string;
  };
}

export interface AIGenerateResponse {
  success: boolean;
  result: unknown;
  message?: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  animation: LottieAnimation;
  stateMachines?: StateMachine[];
  themes?: Theme[];
}

// ----------------------------------------------------------------------------
// API Client Configuration
// ----------------------------------------------------------------------------

export interface LottieCreatorConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}
