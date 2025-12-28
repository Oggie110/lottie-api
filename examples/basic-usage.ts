// ============================================================================
// Lottie Creator API - Basic Usage Examples
// ============================================================================

import {
  createAnimation,
  createShapeLayer,
  createStateMachine,
  createMotionCopilot,
  createVectorGenerator,
  createThemeManager,
  quickShape,
  quickLoader,
  quickCheckmark,
  AnimationBuilder,
  LayerBuilder,
  Exporter,
  MotionCopilot,
  PromptToVector,
  ThemeManager,
} from '../src';

// ============================================================================
// Example 1: Quick Shape Animation
// ============================================================================

function example1_QuickShape() {
  // Create a pulsing circle
  const pulsingCircle = quickShape({
    shape: 'circle',
    color: '#4285F4',
    size: 100,
    animation: 'pulse',
    duration: 2,
  });

  console.log('Pulsing circle animation:', JSON.stringify(pulsingCircle).length, 'bytes');

  // Create a spinning star
  const spinningStar = quickShape({
    shape: 'star',
    color: '#FBBC05',
    size: 80,
    animation: 'spin',
    duration: 3,
  });

  console.log('Spinning star animation:', JSON.stringify(spinningStar).length, 'bytes');
}

// ============================================================================
// Example 2: Custom Animation with Builder API
// ============================================================================

function example2_CustomAnimation() {
  const animation = createAnimation({
    width: 400,
    height: 400,
    fps: 60,
    duration: 3,
    name: 'Custom Animation',
  })
    // Add background
    .addSolidLayer({
      name: 'Background',
      color: '#1A1A2E',
      width: 400,
      height: 400,
    })
    // Add animated shape
    .addShapeLayer('Animated Circle', (layer) => {
      layer
        .setPosition(200, 200)
        .animateScale([
          { time: 0, value: [0, 0, 100], easing: 'easeOut' },
          { time: 30, value: [120, 120, 100], easing: 'easeInOut' },
          { time: 60, value: [100, 100, 100] },
        ])
        .animateOpacity([
          { time: 0, value: 0, easing: 'easeOut' },
          { time: 20, value: 100 },
        ])
        .beginGroup()
        .addCircle({ radius: 80 })
        .addFill({ color: '#00F0FF' })
        .addStroke({ color: '#4285F4', width: 4 })
        .endGroup('Main Circle');
    })
    // Add markers for playback control
    .addMarkerAtSecond(0, 'start')
    .addMarkerAtSecond(1, 'midpoint')
    .addMarkerAtSecond(3, 'end')
    .build();

  console.log('Custom animation created with', animation.layers.length, 'layers');
  return animation;
}

// ============================================================================
// Example 3: State Machine for Interactive Animation
// ============================================================================

function example3_StateMachine() {
  const stateMachine = createStateMachine('Button States')
    // Define states
    .addState('idle', (state) => {
      state
        .setName('Idle State')
        .playSegment(0, 30)
        .setLoop(true);
    })
    .addState('hover', (state) => {
      state
        .setName('Hover State')
        .playSegment(30, 60)
        .setLoop(false)
        .setSpeed(1.5);
    })
    .addState('pressed', (state) => {
      state
        .setName('Pressed State')
        .playSegment(60, 90)
        .setLoop(false)
        .playSound('click-sound');
    })
    .addState('success', (state) => {
      state
        .setName('Success State')
        .playSegment(90, 150)
        .setLoop(false)
        .emit('button-success', { timestamp: Date.now() });
    })
    // Define transitions
    .onHover('idle', 'hover', { duration: 200, easing: 'easeOut' })
    .onClick('hover', 'pressed', { duration: 100 })
    .onComplete('pressed', 'success')
    .onTimeout('success', 'idle', 2000, { easing: 'easeInOut' })
    .setInitialState('idle')
    .build();

  console.log('State machine created with', stateMachine.states.length, 'states');
  return stateMachine;
}

// ============================================================================
// Example 4: Motion Copilot (AI-powered Keyframes)
// ============================================================================

function example4_MotionCopilot() {
  const copilot = createMotionCopilot(60);

  // Generate motion from pattern name
  const bounceMotion = copilot.generate('bounce', {
    duration: 60,
    params: { height: 100, bounces: 3 },
  });

  console.log('Bounce motion keyframes:', bounceMotion.length, 'properties');

  // Generate motion from natural language prompt
  const promptMotion = copilot.fromPrompt(
    'slide in from the left over 0.5 seconds with a smooth ease'
  );

  console.log('Prompt-based motion:', promptMotion.length, 'properties');

  // List available patterns
  console.log('Available patterns:', MotionCopilot.getAvailablePatterns());

  // Apply motion to an existing animation
  const animation = createAnimation({ width: 200, height: 200, fps: 60, duration: 2 })
    .addShapeLayer('Circle', (layer) => {
      layer.setPosition(100, 100).beginGroup().addCircle({ radius: 30 }).addFill({ color: '#4285F4' }).endGroup();
    })
    .build();

  const animatedResult = copilot.applyToLayer(animation, 0, bounceMotion);
  console.log('Motion applied to layer');

  return animatedResult;
}

// ============================================================================
// Example 5: Prompt to Vector (AI-powered Shape Generation)
// ============================================================================

function example5_PromptToVector() {
  const vectorGen = createVectorGenerator();

  // Generate shapes from prompts
  const checkResult = vectorGen.generate({
    prompt: 'checkmark icon',
    colors: ['#34A853'],
    size: { width: 100, height: 100 },
  });

  console.log('Generated:', checkResult.description);

  const starResult = vectorGen.generate({
    prompt: 'golden star',
    colors: ['#FFD700', '#FFA500'],
    size: { width: 120, height: 120 },
  });

  console.log('Generated:', starResult.description);

  // List available shapes
  console.log('Available shapes:', PromptToVector.getAvailableShapes());

  return { check: checkResult.layer, star: starResult.layer };
}

// ============================================================================
// Example 6: Theme Management
// ============================================================================

function example6_ThemeManagement() {
  const themeManager = createThemeManager();

  // Create an animation with colors
  const animation = createAnimation({ width: 200, height: 200, fps: 60, duration: 2 })
    .addSolidLayer({ name: 'BG', color: '#FFFFFF' })
    .addShapeLayer('Shape', (layer) => {
      layer
        .setPosition(100, 100)
        .beginGroup()
        .addCircle({ radius: 50 })
        .addFill({ color: '#4285F4' })
        .addStroke({ color: '#34A853', width: 4 })
        .endGroup();
    })
    .build();

  // Extract colors from animation
  const colors = themeManager.extractColors(animation);
  console.log('Extracted', colors.length, 'colors from animation');

  // Apply a dark theme
  const darkAnimation = themeManager.applyTheme(animation, 'dark');
  console.log('Dark theme applied');

  // Apply a custom theme
  themeManager.addTheme({
    id: 'brand',
    name: 'Brand Colors',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      background: '#2C3E50',
      surface: '#34495E',
      text: '#ECF0F1',
      accent: '#F39C12',
    },
  });

  const brandAnimation = themeManager.applyTheme(animation, 'brand');
  console.log('Brand theme applied');

  // List available themes
  console.log('Available themes:', themeManager.listThemes().map(t => t.name));

  return { original: animation, dark: darkAnimation, brand: brandAnimation };
}

// ============================================================================
// Example 7: Export to Various Formats
// ============================================================================

async function example7_Export() {
  const animation = quickLoader({ color: '#4285F4', size: 100, duration: 1.5 });

  // Export to JSON
  const json = Exporter.toJSON(animation);
  console.log('JSON export:', json.length, 'characters');

  const prettyJson = Exporter.toJSON(animation, true);
  console.log('Pretty JSON:', prettyJson.split('\n').length, 'lines');

  // Export to data URI (for embedding)
  const dataUri = Exporter.toDataURI(animation);
  console.log('Data URI length:', dataUri.length);

  // Export to SVG (single frame)
  const svg = Exporter.toSVG(animation, 0);
  console.log('SVG export:', svg.length, 'characters');

  // Export to dotLottie
  const dotLottie = await Exporter.toDotLottie({
    animations: [
      { animation, id: 'loader', loop: true, autoplay: true },
    ],
    author: 'Lottie Creator API',
    description: 'A simple loading animation',
  });
  console.log('dotLottie export:', dotLottie.length, 'bytes');

  return { json, svg, dotLottie };
}

// ============================================================================
// Example 8: Complex Multi-Layer Animation
// ============================================================================

function example8_ComplexAnimation() {
  const fps = 60;
  const duration = 4;
  const frames = fps * duration;

  const animation = createAnimation({
    width: 600,
    height: 400,
    fps,
    duration,
    name: 'Complex Scene',
  })
    .setMeta({
      a: 'Lottie Creator API',
      d: 'A complex multi-layer animation example',
      k: 'demo,example,complex',
    })
    // Background gradient (simulated with layers)
    .addSolidLayer({ name: 'Sky', color: '#1A1A2E' })
    // Stars layer
    .addShapeLayer('Stars', (layer) => {
      layer.setOpacity(80);
      // Add multiple stars using repeater concept
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 600;
        const y = Math.random() * 200;
        const size = Math.random() * 3 + 1;
        layer
          .beginGroup()
          .addCircle({ x, y, radius: size })
          .addFill({ color: '#FFFFFF', opacity: Math.random() * 50 + 50 })
          .endGroup(`Star ${i}`);
      }
    })
    // Moon
    .addShapeLayer('Moon', (layer) => {
      layer
        .setPosition(500, 80)
        .animateOpacity([
          { time: 0, value: 0 },
          { time: 60, value: 100, easing: 'easeOut' },
        ])
        .beginGroup()
        .addCircle({ radius: 40 })
        .addFill({ color: '#F4F4F4' })
        .endGroup('Moon');
    })
    // Animated orbiting planet
    .addShapeLayer('Planet', (layer) => {
      layer
        .setPosition(300, 200)
        .animateRotation([
          { time: 0, value: 0, easing: 'linear' },
          { time: frames, value: 360 },
        ])
        .beginGroup()
        .addCircle({ x: 100, radius: 15 })
        .addFill({ color: '#4ECDC4' })
        .endGroup('Planet Body');
    })
    // Central sun with pulse
    .addShapeLayer('Sun', (layer) => {
      layer
        .setPosition(300, 200)
        .animateScale([
          { time: 0, value: [100, 100, 100], easing: 'easeInOut' },
          { time: frames / 2, value: [110, 110, 100], easing: 'easeInOut' },
          { time: frames, value: [100, 100, 100] },
        ])
        .beginGroup()
        .addCircle({ radius: 50 })
        .addFill({ color: '#FFE66D' })
        .endGroup('Sun Core');

      // Sun glow
      layer
        .beginGroup()
        .addCircle({ radius: 70 })
        .addFill({ color: '#FFE66D', opacity: 30 })
        .endGroup('Sun Glow');
    })
    // Flying comet
    .addShapeLayer('Comet', (layer) => {
      layer
        .animatePosition([
          { time: 0, value: [650, 50, 0], easing: 'linear' },
          { time: frames, value: [-50, 350, 0] },
        ])
        .animateOpacity([
          { time: 0, value: 0 },
          { time: 30, value: 100 },
          { time: frames - 30, value: 100 },
          { time: frames, value: 0 },
        ])
        .beginGroup()
        .addCircle({ radius: 5 })
        .addFill({ color: '#FFFFFF' })
        .endGroup('Comet Head');
    })
    // Markers for key moments
    .addMarkerAtSecond(0, 'intro')
    .addMarkerAtSecond(1, 'moon-visible')
    .addMarkerAtSecond(2, 'midpoint')
    .addMarkerAtSecond(4, 'complete')
    .build();

  console.log('Complex animation created:');
  console.log('  - Layers:', animation.layers.length);
  console.log('  - Duration:', animation.op / animation.fr, 'seconds');
  console.log('  - Size:', animation.w, 'x', animation.h);
  console.log('  - Markers:', animation.markers?.length ?? 0);

  return animation;
}

// ============================================================================
// Run All Examples
// ============================================================================

async function runAllExamples() {
  console.log('\n=== Lottie Creator API Examples ===\n');

  console.log('--- Example 1: Quick Shape ---');
  example1_QuickShape();

  console.log('\n--- Example 2: Custom Animation ---');
  example2_CustomAnimation();

  console.log('\n--- Example 3: State Machine ---');
  example3_StateMachine();

  console.log('\n--- Example 4: Motion Copilot ---');
  example4_MotionCopilot();

  console.log('\n--- Example 5: Prompt to Vector ---');
  example5_PromptToVector();

  console.log('\n--- Example 6: Theme Management ---');
  example6_ThemeManagement();

  console.log('\n--- Example 7: Export ---');
  await example7_Export();

  console.log('\n--- Example 8: Complex Animation ---');
  example8_ComplexAnimation();

  console.log('\n=== All Examples Complete ===\n');
}

// Export for testing
export {
  example1_QuickShape,
  example2_CustomAnimation,
  example3_StateMachine,
  example4_MotionCopilot,
  example5_PromptToVector,
  example6_ThemeManagement,
  example7_Export,
  example8_ComplexAnimation,
  runAllExamples,
};
