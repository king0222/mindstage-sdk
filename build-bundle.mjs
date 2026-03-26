/**
 * Bundle SDK into a single JS file
 * 将 SDK 打包成单个 JS 文件
 */

import esbuild from 'esbuild';

async function build() {
  try {
    console.log('📦 Building SDK bundle...');

    // Build for browser (IIFE format - can be used directly in HTML)
    await esbuild.build({
      entryPoints: ['index.ts'],
      bundle: true,
      format: 'iife',
      globalName: 'MindStageSDK',
      outfile: 'dist/mindstage-sdk.js',
      platform: 'browser',
      target: ['es2020'],
      minify: false, // Set to true for production
      sourcemap: true,
      external: ['katex'], // katex is optional peer dependency
      banner: {
        js: `/*!
 * mindstage-sdk
 * Mind Map Rendering SDK
 * Version: 1.0.0
 * License: MIT
 */`,
      },
    });

    console.log('✅ Bundle created: dist/mindstage-sdk.js');

    // Also create minified version
    await esbuild.build({
      entryPoints: ['index.ts'],
      bundle: true,
      format: 'iife',
      globalName: 'MindStageSDK',
      outfile: 'dist/mindstage-sdk.min.js',
      platform: 'browser',
      target: ['es2020'],
      minify: true,
      sourcemap: false,
      external: ['katex'],
      banner: {
        js: `/*! mindstage-sdk v1.0.0 | MIT License */`,
      },
    });

    console.log('✅ Minified bundle created: dist/mindstage-sdk.min.js');
    console.log('');
    console.log('📝 Usage in HTML:');
    console.log('  <script src="dist/mindstage-sdk.js"></script>');
    console.log('  <script>');
    console.log('    const { renderMindMapFromJSON } = MindStageSDK;');
    console.log('    // renderMindMapFromJSON("#map", data, { collapsible: true })');
    console.log('  </script>');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
