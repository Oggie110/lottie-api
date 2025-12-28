# Lottie Creator API - Development Guide

## Project Overview

A TypeScript SDK for programmatically creating Lottie animations. Provides fluent builders, SVG import, AI-assisted motion generation, and multiple export formats.

## Quick Commands

```bash
npm run build      # Build with tsup (CJS + ESM + DTS)
npm run typecheck  # TypeScript type checking
npm test           # Run tests with Vitest
```

## Project Structure

```
src/
├── index.ts              # Main exports and quick helpers
├── types.ts              # Lottie format TypeScript types
├── utils.ts              # Utility functions (colors, keyframes, paths)
├── builders/
│   ├── AnimationBuilder.ts   # Main animation builder
│   ├── LayerBuilder.ts       # Shape layer builder
│   └── StateMachineBuilder.ts # Interactive state machines
├── ai/
│   ├── MotionCopilot.ts      # AI-powered motion generation
│   └── PromptToVector.ts     # Text-to-shape generation
├── theme/
│   └── ThemeManager.ts       # Color theme management
├── import/
│   └── SVGImporter.ts        # SVG to Lottie conversion
├── library/
│   └── LottieLibrary.ts      # LottieFiles library browser
└── export/
    └── Exporter.ts           # Export to JSON, dotLottie, SVG
```

## Key Technical Details

### Lottie Keyframe Format

Scalar keyframe values MUST be wrapped in arrays:
```typescript
// CORRECT
{ t: 0, s: [0] }      // rotation: 0 degrees
{ t: 60, s: [360] }   // rotation: 360 degrees

// WRONG - will not animate
{ t: 0, s: 0 }
{ t: 60, s: 360 }
```

### Shape Group Ordering

Shapes in a group must be ordered:
1. Paths (rc, el, sr, sh, pl)
2. Modifiers (tm, rd, rp, mm)
3. Fill/Stroke (fl, st, gf, gs)
4. Transform (tr) - always last

The `LayerBuilder.endGroup()` method handles this automatically.

### Layer Z-Order

In Lottie, lower layer indices render on TOP:
- Layer index 0 = front (top)
- Layer index 1 = behind
- Layer index 2 = further behind

### Centering Shapes for Animation

For rotation/scaling to work correctly, shapes should be centered at origin (0,0), then positioned via layer transform:
```typescript
// Shape centered at origin
const path = SVGImporter.parseSVGPath("M0 -50 L50 50 L-50 50 Z");

// Layer positioned at center of canvas
layer.setPosition(centerX, centerY);
```

## Demo Files

- `preview.html` - Basic shape animations (quickLoader, quickShape, quickCheckmark)
- `svg-demo.html` - SVG import and animation demo
- `test.mjs` - Node.js test script

## Build Output

```
dist/
├── index.js      # CommonJS
├── index.mjs     # ES Modules
├── index.d.ts    # TypeScript declarations
└── index.d.mts   # ES Module declarations
```

## Dependencies

- **tsup** - Build tool (bundles TypeScript to CJS/ESM)
- **typescript** - Type checking
- **vitest** - Testing (optional)

## Adding New Features

1. Add types to `src/types.ts`
2. Implement in appropriate module
3. Export from `src/index.ts`
4. Update README.md with examples
5. Run `npm run build` to verify

## Common Issues

### DTS Build Errors
- Ensure all types are properly exported
- Check for `null` vs `undefined` type mismatches
- Run `npm run typecheck` before building

### Animations Not Rendering
- Check keyframe values are wrapped in arrays
- Verify shape ordering in groups
- Ensure layer positions are within canvas bounds
