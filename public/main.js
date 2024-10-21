import * as THREE from 'three';

let currentLevelModule = null; // To store the currently loaded level module

// Function to load the desired level
async function loadLevel(levelNumber) {
    try {
        switch (levelNumber) {
            case 1:
                currentLevelModule = await import('./lvl1.js');
                break;
            case 2:
                currentLevelModule = await import('./lvl2.js');
                break;
            case 3:
                currentLevelModule = await import('./lvl3.js');
                break;
            default:
                console.error('Invalid level number');
                return;
        }

        // Initialize or render the level
        currentLevelModule.setupLevel();
        animate(); // Start the render loop
    } catch (error) {
        console.error('Error loading level:', error);
    }
}

// Render loop (to be reused for any level)
function animate() {
    requestAnimationFrame(animate);
    if (currentLevelModule && currentLevelModule.render) {
        currentLevelModule.render(); // Call the render function from the loaded module
    }
}

window.onload = function() {
    loadLevel(1); // Start with level 1 by default
};