import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

function getAssetFiles(rootDir, subDir) {
    const dirPath = path.join(rootDir, subDir);
    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    return files.flatMap((file) => {
        const filePath = path.join(subDir, file.name);
        return file.isDirectory()
            ? getAssetFiles(rootDir, filePath)
            : filePath;
    });
}

const assetFiles = getAssetFiles(__dirname, 'assets');


// Vite configuration for a Three.js project
export default defineConfig({
  root: '.', // Root directory of the project
  publicDir: 'public', // Public directory for static assets
  build: {
    outDir: 'dist', // Directory for the build output
    rollupOptions: {
      input: {
        main: 'index.html',
        inferno: 'inferno.html',
        paradisio: 'paradisio.html',
        purgatory: 'purgatory.html',
      },
    },
    commonjsOptions: {
        include: [/linked-dep/, /node_modules/],
    },
    // Copy assets
    assets: {
        // Include all asset files
        include: assetFiles,
        // Source directory for your assets
        base: '/assets',
        // Output directory
        outputDir: '/assets',
    },
  },
  server: {
    port: 3000, // Dev server port
    open: true, // Automatically open the browser
  },
  resolve: {
    alias: {
      // Add aliases for easier imports if needed
      '@': '/public',
    },
  },
});
