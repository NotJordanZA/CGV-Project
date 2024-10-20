import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { level1Config } from './level1.js';
import { level2Config } from './level2.js';
import { level3Config } from './level3.js';
import render1 from './lvl1.js';
import render2 from './lvl2.js';
import render3 from './lvl3.js';

let currentLevel = 0;

// EVENT LISTENER FOR KEY PRESSES
window.addEventListener('keydown', function(event) {
    switch(event.key) {
        case '1': 
            currentLevel = 0;
            render1();
        break; // Move to Level 1
        case '2': 
            currentLevel = 1; 
            render2();
        break; // Move to Level 2
        case '3': 
            currentLevel = 2; 
            render3();
        break; // Move to Level 3
    }
});

switch(currentLevel) {
    case 0: 
        render1();
        console.log(1);
    break; // Move to Level 1
    case 1: 
        render2();
        console.log(2);
    break; // Move to Level 2
    case 2: 
        render3();
        console.log(3);
    break; // Move to Level 3
}