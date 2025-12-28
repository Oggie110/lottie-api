# Lottie Creator API

A TypeScript SDK for programmatically creating and manipulating Lottie animations. Inspired by [LottieFiles Creator](https://creator.lottiefiles.com).

## Features

- **Animation Builder** - Fluent API for creating Lottie animations from scratch
- **Layer Builder** - Create shape layers with rectangles, circles, paths, fills, strokes, and modifiers
- **State Machine Builder** - Create interactive animations with states and transitions
- **Motion Copilot** - AI-powered keyframe generation from patterns or natural language
- **Prompt to Vector** - Generate shapes from text descriptions
- **Theme Manager** - Extract, manage, and apply color themes
- **Export** - Export to JSON, dotLottie, SVG, and data URIs

## Installation

```bash
npm install lottie-creator-api
```

## Quick Start

```typescript
import { quickShape, quickLoader, Exporter } from 'lottie-creator-api';

// Create a pulsing circle
const animation = quickShape({
  shape: 'circle',
  color: '#4285F4',
  size: 100,
  animation: 'pulse',
  duration: 2,
});

// Export to JSON
const json = Exporter.toJSON(animation);
```

## Usage Examples

### 1. Creating a Custom Animation

```typescript
import { createAnimation } from 'lottie-creator-api';

const animation = createAnimation({
  width: 400,
  height: 400,
  fps: 60,
  duration: 3,
})
  .addSolidLayer({ name: 'Background', color: '#1A1A2E' })
  .addShapeLayer('Circle', (layer) => {
    layer
      .setPosition(200, 200)
      .animateScale([
        { time: 0, value: [0, 0, 100], easing: 'easeOut' },
        { time: 60, value: [100, 100, 100] },
      ])
      .beginGroup()
      .addCircle({ radius: 80 })
      .addFill({ color: '#00F0FF' })
      .endGroup();
  })
  .build();
```

### 2. State Machines for Interactivity

```typescript
import { createStateMachine } from 'lottie-creator-api';

const stateMachine = createStateMachine('Button')
  .addState('idle', (state) => {
    state.playSegment(0, 30).setLoop(true);
  })
  .addState('hover', (state) => {
    state.playSegment(30, 60).setSpeed(1.5);
  })
  .addState('pressed', (state) => {
    state.playSegment(60, 90).playSound('click');
  })
  .onHover('idle', 'hover')
  .onClick('hover', 'pressed')
  .onComplete('pressed', 'idle')
  .build();
```

### 3. Motion Copilot (AI-powered Animation)

```typescript
import { createMotionCopilot } from 'lottie-creator-api';

const copilot = createMotionCopilot(60);

// Generate from pattern
const bounceKeyframes = copilot.generate('bounce', {
  duration: 60,
  params: { height: 100, bounces: 3 },
});

// Generate from natural language
const slideKeyframes = copilot.fromPrompt(
  'slide in from the left over 0.5 seconds'
);

// Apply to animation
copilot.applyToLayer(animation, 0, bounceKeyframes);
```

Available patterns: `slideIn`, `slideOut`, `popIn`, `popOut`, `pulse`, `spin`, `wobble`, `fadeIn`, `fadeOut`, `blink`, `bounce`, `shake`, `float`, `heartbeat`

### 4. Prompt to Vector

```typescript
import { createVectorGenerator } from 'lottie-creator-api';

const vectorGen = createVectorGenerator();

const result = vectorGen.generate({
  prompt: 'checkmark icon',
  colors: ['#34A853'],
  size: { width: 100, height: 100 },
});

console.log(result.layer); // ShapeLayer ready to add to animation
```

Available shapes: `circle`, `square`, `triangle`, `star`, `heart`, `checkmark`, `cross`, `plus`, `arrow`, `button`, `loader`, `sun`, `moon`

### 5. Theme Management

```typescript
import { createThemeManager } from 'lottie-creator-api';

const themeManager = createThemeManager();

// Extract colors from animation
const colors = themeManager.extractColors(animation);

// Apply preset theme
const darkAnimation = themeManager.applyTheme(animation, 'dark');

// Create custom theme
themeManager.addTheme({
  id: 'brand',
  name: 'Brand Colors',
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    background: '#2C3E50',
    text: '#ECF0F1',
  },
});

const brandAnimation = themeManager.applyTheme(animation, 'brand');
```

Preset themes: `light`, `dark`, `sunset`, `ocean`, `forest`, `candy`, `monochrome`

### 6. SVG Import

```typescript
import { SVGImporter, createAnimation } from 'lottie-creator-api';

// Parse SVG path data
const heartPath = SVGImporter.parseSVGPath(
  "M0 38 C-30 10 -45 -10 -45 -25 C-45 -40 -30 -50 -15 -50..."
);

// Create animated Lottie from SVG
const animation = createAnimation({ width: 200, height: 200, duration: 1 })
  .addShapeLayer('Heart', layer => {
    layer
      .setPosition(100, 100)
      .beginGroup()
      .addPath({ path: heartPath })
      .addFill({ color: '#E91E63' })
      .endGroup()
      .animateScale([
        { time: 0, value: [100, 100, 100], easing: 'easeInOut' },
        { time: 30, value: [115, 115, 100], easing: 'easeInOut' },
        { time: 60, value: [100, 100, 100] }
      ]);
  })
  .build();

// Parse other SVG elements
const circle = SVGImporter.parseCircle(50, 50, 40);
const rect = SVGImporter.parseRect(0, 0, 100, 60, 10);
const ellipse = SVGImporter.parseEllipse(50, 50, 60, 40);

// Parse full SVG string
const shapes = SVGImporter.parseSVGString(`
  <svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" fill="#FF0000"/>
    <rect x="10" y="10" width="30" height="30" fill="#00FF00"/>
  </svg>
`);
```

### 7. Exporting

```typescript
import { Exporter } from 'lottie-creator-api';

// JSON
const json = Exporter.toJSON(animation);
const prettyJson = Exporter.toJSON(animation, true);

// Blob
const blob = Exporter.toBlob(animation);

// Data URI (for embedding)
const dataUri = Exporter.toDataURI(animation);

// SVG (single frame)
const svg = Exporter.toSVG(animation, 0);

// dotLottie
const dotLottie = await Exporter.toDotLottie({
  animations: [{ animation, id: 'main', loop: true }],
  stateMachines: [stateMachine],
  themes: [theme],
});

// Download (browser)
Exporter.download(animation, 'my-animation.json');
```

## API Reference

### Core Builders

| Class | Description |
|-------|-------------|
| `AnimationBuilder` | Create and configure Lottie animations |
| `LayerBuilder` | Create shape, solid, text, null, image layers |
| `StateMachineBuilder` | Create interactive state machines |

### AI Features

| Class | Description |
|-------|-------------|
| `MotionCopilot` | Generate keyframes from patterns or prompts |
| `PromptToVector` | Generate shapes from text descriptions |

### Utilities

| Class | Description |
|-------|-------------|
| `ThemeManager` | Extract, create, and apply color themes |
| `Exporter` | Export to JSON, dotLottie, SVG, data URIs |
| `SVGImporter` | Convert SVG paths and shapes to Lottie format |

### Quick Helpers

| Function | Description |
|----------|-------------|
| `quickShape()` | Create simple animated shapes |
| `quickLoader()` | Create loading spinners |
| `quickCheckmark()` | Create animated checkmarks |

## Types

The library exports comprehensive TypeScript types for the Lottie format:

```typescript
import type {
  LottieAnimation,
  Layer,
  ShapeLayer,
  ShapeElement,
  Transform,
  AnimatedProperty,
  Keyframe,
  StateMachine,
  Theme,
  ExportFormat,
} from 'lottie-creator-api';
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run typecheck

# Run tests
npm test
```

## License

MIT

## Credits

Inspired by [LottieFiles Creator](https://creator.lottiefiles.com) and the [Lottie animation format](https://lottiefiles.github.io/lottie-docs/).
