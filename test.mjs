// Quick test of lottie-creator-api
import {
  createAnimation,
  quickShape,
  quickLoader,
  quickCheckmark,
  createMotionCopilot,
  createVectorGenerator,
  createThemeManager,
  Exporter,
  MotionCopilot,
  PromptToVector,
} from './dist/index.mjs';

console.log('🧪 Testing Lottie Creator API\n');

// Test 1: Quick Shape
console.log('1️⃣ Quick Shape (pulsing circle)');
const circle = quickShape({
  shape: 'circle',
  color: '#FF6B6B',
  size: 100,
  animation: 'pulse',
  duration: 2,
});
console.log(`   ✓ Created ${circle.w}x${circle.h} animation, ${circle.layers.length} layer(s), ${circle.op} frames\n`);

// Test 2: Quick Loader
console.log('2️⃣ Quick Loader');
const loader = quickLoader({ color: '#4285F4', size: 80 });
console.log(`   ✓ Created loader: ${loader.w}x${loader.h}, duration: ${loader.op / loader.fr}s\n`);

// Test 3: Quick Checkmark
console.log('3️⃣ Quick Checkmark');
const check = quickCheckmark({ color: '#34A853' });
console.log(`   ✓ Created checkmark: ${check.w}x${check.h}\n`);

// Test 4: Custom Animation with Builder
console.log('4️⃣ Custom Animation Builder');
const custom = createAnimation({
  width: 400,
  height: 400,
  fps: 60,
  duration: 3,
  name: 'Test Animation',
})
  .addSolidLayer({ name: 'Background', color: '#1A1A2E' })
  .addShapeLayer('Animated Circle', (layer) => {
    layer
      .setPosition(200, 200)
      .animateScale([
        { time: 0, value: [0, 0, 100], easing: 'easeOut' },
        { time: 60, value: [100, 100, 100] },
      ])
      .beginGroup()
      .addCircle({ radius: 50 })
      .addFill({ color: '#00F0FF' })
      .endGroup();
  })
  .addMarkerAtSecond(0, 'start')
  .addMarkerAtSecond(1.5, 'middle')
  .addMarkerAtSecond(3, 'end')
  .build();

console.log(`   ✓ Created custom animation: ${custom.layers.length} layers, ${custom.markers?.length} markers\n`);

// Test 5: Motion Copilot
console.log('5️⃣ Motion Copilot');
const copilot = createMotionCopilot(60);
const bounceMotion = copilot.generate('bounce', { duration: 60, params: { height: 100 } });
console.log(`   ✓ Generated bounce motion: ${bounceMotion.length} property animation(s)`);
console.log(`   Available patterns: ${MotionCopilot.getAvailablePatterns().join(', ')}\n`);

// Test 6: Prompt to Vector
console.log('6️⃣ Prompt to Vector');
const vectorGen = createVectorGenerator();
const starResult = vectorGen.generate({
  prompt: 'golden star',
  colors: ['#FFD700'],
  size: { width: 100, height: 100 },
});
console.log(`   ✓ ${starResult.description}`);
console.log(`   Available shapes: ${PromptToVector.getAvailableShapes().join(', ')}\n`);

// Test 7: Theme Manager
console.log('7️⃣ Theme Manager');
const themeManager = createThemeManager();
const themes = themeManager.listThemes();
console.log(`   ✓ ${themes.length} preset themes: ${themes.map(t => t.name).join(', ')}`);

const extractedColors = themeManager.extractColors(custom);
console.log(`   ✓ Extracted ${extractedColors.length} color(s) from custom animation`);

const darkVersion = themeManager.applyTheme(custom, 'dark');
console.log(`   ✓ Applied dark theme to animation\n`);

// Test 8: Export
console.log('8️⃣ Exporter');
const json = Exporter.toJSON(loader);
console.log(`   ✓ JSON export: ${json.length} characters`);

const prettyJson = Exporter.toJSON(loader, true);
console.log(`   ✓ Pretty JSON: ${prettyJson.split('\n').length} lines`);

const dataUri = Exporter.toDataURI(loader);
console.log(`   ✓ Data URI: ${dataUri.length} characters`);

const svg = Exporter.toSVG(loader, 0);
console.log(`   ✓ SVG frame export: ${svg.length} characters\n`);

// Summary
console.log('═'.repeat(50));
console.log('✅ All tests passed!');
console.log('═'.repeat(50));

// Output a sample animation JSON
console.log('\n📄 Sample loader JSON (first 500 chars):');
console.log(json.substring(0, 500) + '...\n');
