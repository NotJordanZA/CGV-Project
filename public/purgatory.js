import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { level1Config } from './level1.js';
import { level2Config } from './level2.js';
import { level3Config } from './level3.js';
import { item } from './item.js';

// Set up the canvas and renderer
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0xDDDDDD, 1);
document.body.appendChild(renderer.domElement);
var scene = new THREE.Scene();

let hearts = 5;

var aspect = WIDTH / HEIGHT;
var d = 40; // Frustum size (affects the zoom level)
var camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

// Position the camera for an isometric view (45 degrees)
camera.position.set(40, 40, 40); // Adjust these for the desired view
camera.lookAt(0, 0, 0); // Aim the camera at the origin (where the cube is)

// Map configuration
var mapRenderer = new THREE.WebGLRenderer({ alpha: true });
mapRenderer.setSize(300, 300); 
mapRenderer.domElement.style.position = 'absolute';
mapRenderer.domElement.style.bottom = '0';
mapRenderer.domElement.style.right = '5px';
mapRenderer.domElement.style.zIndex = '9999';
mapRenderer.domElement.style.opacity = '1';
document.body.appendChild(mapRenderer.domElement);

var mapScene = new THREE.Scene();
var mapCamera = new THREE.OrthographicCamera(-50, 50, 50, -50, 1, 1000);
mapCamera.position.set(0, 100, 0);
mapCamera.lookAt(0, 0, 0);

var pathPoints = [
    new THREE.Vector3(-0.1, 0, 0.1),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.1, 0, -0.1)
];
var vertices = new Float32Array(pathPoints.length * 3);
for (var i = 0; i < pathPoints.length; i++) {
    vertices[i * 3] = pathPoints[i].x;
    vertices[i * 3 + 1] = pathPoints[i].y;
    vertices[i * 3 + 2] = pathPoints[i].z;
}
var pathGeometry = new THREE.BufferGeometry();
pathGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
var pathMaterial = new THREE.LineDashedMaterial({ color: 0xdb9d00, dashSize: 3, gapSize: 3 });
var pathLine = new THREE.Line(pathGeometry, pathMaterial);
pathLine.computeLineDistances();

// Level Configurations
let currentLevel = 1; // Start at level 0
const levels = [level1Config, level2Config, level3Config];
let initialCubePosition = new THREE.Vector3(0, 0, 0);
let initialCameraPosition = new THREE.Vector3(40, 40, 40);
var atChest = false;
var atGhost = false;
var atItem = false;
var playerItemCount = 0;
var itemCount;
var gameOver = false;
//var darknessTimeout = 100;
var items = [];
var chests = [
    {x: -324, z: -1212},
    {x: -756, z: -668},
    {x: 628, z: -728},
];



const vignette = document.getElementById('vignette');
const gameOverMessage = document.getElementById('game-over-message');
const gameOverMessage2 = document.getElementById('game-over-message2');
const interactMessage = document.getElementById('object-interact');
const itemTextMessage = document.getElementById('item-text');
const chestTextMessage = document.getElementById('chest-text');


function updateHearts() {
    const heartContainer = document.getElementById('heart-container');
    heartContainer.innerHTML = ''; // Clear previous hearts
    if (hearts === 0) {
        document.getElementById('game-over-message').style.opacity = '1';
        document.getElementById('game-over-message2').style.opacity = '1';
        const vignetteIntensity = THREE.MathUtils.clamp(1 , 0, 1);
        updateVignetteIntensity(vignetteIntensity);
        var deathPopupTimer = null;
        deathPopupTimer = setTimeout(() => {
            showGameOverScreen();
            deathPopupSound.play();
        }, 1800);
        
      }
      
    for (let i = 0; i < hearts; i++) {
      const heartImg = document.createElement('img');
      heartImg.src = 'assets/purgatory/heart.png';
      heartImg.className = 'heart';
      heartContainer.appendChild(heartImg);
    }
  }

  // Reduce hearts over time
function startHeartTimer() {
    setInterval(() => {
      if (hearts > 0) {
        hearts -= 1;
        updateHearts();
      }
  
      // If no hearts left, trigger game over
      if (hearts === 0) {
        document.getElementById('game-over-message').style.opacity = '1';
        gameOver = true;
        const vignetteIntensity = THREE.MathUtils.clamp(1 , 0, 1);
        updateVignetteIntensity(vignetteIntensity);
      }
    }, 30000); // 30 seconds
  }
  
  // Handle chest interaction to restore heart
window.addEventListener('keydown', (event) => {
    if (event.key === 'e' || event.key === 'E') {
      // Assuming you have logic to check if the player is near a chest
      const nearChest = true; // Update this based on your game logic
  
    }
  });
  
  // Initialize hearts and start the timer
  updateHearts();
  startHeartTimer();

// // Update the vignette intensity based on darknessTimeout
 function updateVignetteIntensity(intensity) {
     vignette.style.opacity = intensity; // Set opacity between 0 and 1
 }

function showGameOverScreen() {
    gameOverMessage.style.opacity = 1; // Fade in the "You Died" message
    gameOverMessage2.innerText = "You Died! Press R to Restart";
}

function displayChestMessage() {
    chestTextMessage.innerText = "You found a chest! +1 Life";
    chestTextMessage.style.opacity = 1;
    hearts += 1;
    updateHearts();
    // Hide the message after a few seconds
    setTimeout(() => {
        chestTextMessage.style.opacity = 0;
    }, 5000);
}



function resetLevel() {
    document.getElementById('game-over-message2').style.opacity = '0';
    cube.position.copy(initialCubePosition);
    camera.position.copy(initialCameraPosition);

    items.forEach(item=>{ // Remove items from map
        item.removeThisItem();
    })
    hearts = 5;
    updateHearts();
    startHeartTimer();
    camera.lookAt(0, 0, 0);  // Make sure camera is looking at the correct point
    // flashTimeout = 5000;
    // bounceTimeout = 100;
    // darknessTimeout = 100;
    mapScene.clear();
    pathPoints = [];
    items = [];
    playerItemCount = 0;
    gameOverMessage.style.opacity = 0;
    vignette.style.opacity = 0;
    updateHearts();
    startHeartTimer();
    // Optional: Reset any other elements such as lights, textures, etc.
    setupLevel(currentLevel); // Reapply the level configurations
    console.log("Level reset to its original configuration.");
}

// Function to setup levels
function setupLevel(level) {
    const levelConfig = levels[level];
    mapScene.add(pathLine);
    // Update the cube color for this level
    cube.material.color.setHex(levelConfig.cubeColor);

    // Update flashlight color and power for this level
    flashLight.color.setHex(levelConfig.flashLightColor);
    flashLightBounce.color.setHex(levelConfig.flashLightBounceColor);
    flashLight.intensity = levelConfig.flashLightPower;

    var item1 = new item(
        scene,
        "./assets/purgatory/drop.glb",
        -96, 0, -1208,
        "A single metallic tear with a blue shine.\nOn the side is the initial L inscribed.\nIs this\n...for me?",
        new THREE.Color(0xffe600)
    );
    var item2 = new item(
        scene,
        "./assets/purgatory/mirror.glb",
        -700, 0, -396,
        "A silver mirror but the glass is broken.\nIs this how Narcissus felt when it was all over?",
        new THREE.Color(0x0051ff)
    );
    var item3 = new item(
        scene,
        "./assets/purgatory/key.glb",
        92, 0, -584,
        "An ornate silver key with a lace tag reading “Mine now.”\nThis is the key for Liora’s Music Box.\nIs that my handwriting on the tag?",
        new THREE.Color(0xbf00ff)
    );
    items.push(item1);
    items.push(item2);
    items.push(item3);
}

// Function to move to the specified level
function goToLevel(level) {
    switch(level){
        case 0:
            location.href = 'purgatory.html';
            break;
        case 1:
            location.href = 'purgatory.html';
            break;
        case 2:
            location.href = 'paradisio.html';
            break;
    }
}

let purgatoryMap;
let purgatoryChests;
let purgatoryWalls;
let purgatoryWallsBoundingBox;
const purgatoryGhostsBoundingBox = new THREE.Box3();

var floorBoundingBox = new THREE.Box3();
itemCount = 3;
scene.background = new THREE.Color( 0x000000 );
const gltfLoader = new GLTFLoader();
gltfLoader.load('./assets/purgatory/cgv-purgatory-map-baked-mesh.glb', (gltf) => {
    // Add the loaded purgatoryMap to the scene
    purgatoryMap = gltf.scene;
    
    // Position the purgatoryMap to the right of the plane
    purgatoryMap.rotation.y = -Math.PI / 2;
    purgatoryMap.scale.set(50,50,50);
    purgatoryMap.position.set(0, -10, 0); // Adjust the position as needed
    scene.add(purgatoryMap);
    floorBoundingBox.setFromObject(purgatoryMap);
}, undefined, (error) => {
    console.error('An error happened while loading the purgatoryMap:', error);
});

gltfLoader.load('./assets/purgatory/cgv-purgatory-walls.glb', (gltf) => {
    purgatoryWalls = gltf.scene;
    purgatoryWalls.rotation.y = -Math.PI / 2;
    purgatoryWalls.scale.set(50,50,50);
    purgatoryWalls.position.set(6, -10, 6); // Adjust the position as needed
    purgatoryWallsBoundingBox = new THREE.Box3().setFromObject(purgatoryWalls);
}, undefined, (error) => {
    console.error('An error happened while loading the purgatoryMap:', error);
});

var ghosts = [
   // {x: -3, z: -44},
    {x: -776, z :-624},
    {x: -276, z: -1192},
    {x: 592, z: -716},
];
let purgatoryGhosts;

for(i = 0; i < ghosts.length; i++){
    var ghostLight  = new THREE.PointLight(0xf76628, 1000);
    ghostLight.position.set(ghosts[i].x, 15,  ghosts[i].z);
    scene.add(ghostLight);
}

gltfLoader.load('./assets/purgatory/Ghost.glb', (gltf) => {
    purgatoryGhosts = gltf.scene;
    purgatoryGhosts.scale.set(3, 3, 3); // Scale the purgatoryGhosts model as desired
    purgatoryGhosts.position.set(-776, 0, -624); // Adjust starting position as needed
    scene.add(purgatoryGhosts);

    // Set bounding box for the purgatoryGhosts
    purgatoryGhostsBoundingBox.setFromObject(purgatoryGhosts);
}, undefined, (error) => {
    console.error('An error happened while loading the purgatoryGhosts:', error);
});

gltfLoader.load('./assets/purgatory/Ghost.glb', (gltf) => {
    purgatoryGhosts = gltf.scene;
    purgatoryGhosts.scale.set(3, 3, 3); // Scale the purgatoryGhosts model as desired
    purgatoryGhosts.position.set(-276, 0, -1192); // Adjust starting position as needed
    scene.add(purgatoryGhosts);

    // Set bounding box for the purgatoryGhosts
    purgatoryGhostsBoundingBox.setFromObject(purgatoryGhosts);
}, undefined, (error) => {
    console.error('An error happened while loading the purgatoryGhosts:', error);
});

gltfLoader.load('./assets/purgatory/Ghost.glb', (gltf) => {
    purgatoryGhosts = gltf.scene;
    purgatoryGhosts.scale.set(3, 3, 3); // Scale the purgatoryGhosts model as desired
    purgatoryGhosts.position.set(592, 0, -716); // Adjust starting position as needed
    scene.add(purgatoryGhosts);

    // Set bounding box for the purgatoryGhosts
    purgatoryGhostsBoundingBox.setFromObject(purgatoryGhosts);
}, undefined, (error) => {
    console.error('An error happened while loading the purgatoryGhosts:', error);
});

const listener = new THREE.AudioListener();
camera.add( listener );
const deathPopupSound = new THREE.Audio( listener );
const audioLoader = new THREE.AudioLoader();
audioLoader.load( './assets/soundeffects/you-died-sting.mp3', function( buffer ) {
	deathPopupSound.setBuffer( buffer );
	deathPopupSound.setVolume( 0.5 );
});

const deathSound = new THREE.Audio( listener );
audioLoader.load( './assets/soundeffects/death-moan.mp3', function( buffer ) {
	deathSound.setBuffer( buffer );
    deathSound.playbackRate = 0.5;
    deathSound.detune += 1200;
	deathSound.setVolume( 0.5 );
});

// Chests lights setup
for(i = 0; i < chests.length; i++){
    var ghostLight  = new THREE.PointLight(0xf76628, 1000);
    ghostLight.position.set(chests[i].x, 15,  chests[i].z);
    scene.add(ghostLight);
}

// Cube setup
var boxGeometry = new THREE.BoxGeometry(10, 10, 10);
var phongMaterial = new THREE.MeshPhongMaterial({ color: 0x0095DD });
var cube = new THREE.Mesh(boxGeometry, phongMaterial);
cube.rotation.set(0.0, 0.0, 0);
cube.translateX(0);
scene.add(cube);

// Flashlight setupas
var flashGeometry = new THREE.BoxGeometry(1, 2, 1);
var flashHolder = new THREE.Mesh(flashGeometry, phongMaterial);

// var flashTimeout = 1000;
// var bounceTimeout = 100;

var flashLight = new THREE.SpotLight(0xffe394, 5000, 0, Math.PI / 4, 1, 2);
flashLight.position.set(0, 0, 0); // Position it at the cube's location
var flashLightBounce = new THREE.PointLight(0xffe394, 100);
flashLightBounce.position.set(0, 0, 0);
flashLight.add(flashLightBounce);
flashHolder.add(flashLight);

var flashLightTarget = new THREE.Object3D();
scene.add(flashLightTarget);
flashLight.target = flashLightTarget;

cube.add(flashHolder); // Attach it to the cube

// Check if player is near chest
function checkAtChest() {
    var x = cube.position.x;
    var z = cube.position.z;

    atChest = false;

    for (var i = 0; i < chests.length; i++) {
        var distance = Math.sqrt(Math.pow(chests[i].x - x, 2) + Math.pow(chests[i].z - z, 2));

        if (distance <= 50) { 
            atChest = true;
            break;
        }
    }
}

  let lastGhostCollisionTime = 0; // Initialize the time tracker
  const ghostCollisionCooldown = 3000; // Cooldown period in milliseconds (3 seconds)

//  let ghostSpeed = 0.1; // Speed of the ghost
//  let ghostDirection = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(); // Random initial direction
//  const ghostBoundaries = {  minZ: -712, maxZ: -716 }; // Define boundaries for the ghost

//  function moveGhost() {
//      // Update the ghost's position
//     checkAtGhost();
//      purgatoryGhosts.position.add(ghostDirection.clone().multiplyScalar(ghostSpeed));

//      if (purgatoryGhosts.position.z < ghostBoundaries.minZ || purgatoryGhosts.position.z > ghostBoundaries.maxZ) {
//          ghostDirection.z *= -1; // Reverse direction on Z axis
//      }
    
//  }

// Check if player is near ghost
function checkAtGhost() {
    const currentTime = Date.now(); 
    var x = cube.position.x;
    var z = cube.position.z;

    atGhost = false;

    for (var i = 0; i < ghosts.length; i++) {
        var distance = Math.sqrt(Math.pow(ghosts[i].x - x, 2) + Math.pow(ghosts[i].z - z, 2));
        if (distance <= 10) {  
         if (currentTime - lastGhostCollisionTime > ghostCollisionCooldown) {
             hearts -= 1; // Reduce hearts
             updateHearts(); // Update the display
             lastGhostCollisionTime = currentTime; // Reset the cooldown timer
             console.log("Heart lost! Remaining:", hearts);
         }
        atGhost = true;
        break;
    }
    }
}

// Check if player is near item
function checkAtItem() {
    var x = cube.position.x;
    var z = cube.position.z;

    atItem = false;

    for (var i = 0; i < items.length; i++) {
        var distance = Math.sqrt(Math.pow(items[i].position.x - x, 2) + Math.pow(items[i].position.z - z, 2));
        if (distance <= 50) { 
            atItem = true;
            return items[i];
        }
    }
     
}

function removeItem(item){
    item.removeThisItem();
    displayItemMessage(item);
}

var moveTimer = null;
function displayItemMessage(item) {
    itemTextMessage.innerText = item.getDescription();
    itemTextMessage.style.opacity = 1;  
    items=items.filter(element=>element!==item);
    if (moveTimer) {
        clearTimeout(moveTimer);
    }
    moveTimer = setTimeout(() => {
        itemTextMessage.style.opacity = 0; 
    }, 10000);
}

function interactWithObject() {
    if (atChest) {
        displayChestMessage();
        
    } else if (atItem) {
        playerItemCount++;
        removeItem(checkAtItem());
    }
}


// Movement and control variables
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveSpeed = 0.75;
var flashLightDistance = 10;

let previousMouseX = window.innerWidth / 2; // Start in the middle
let angle = -45;
const rotationSpeed = 0.006; // Speed of arc rotation

window.addEventListener('mousemove', function(event) {
    // Calculate the horizontal mouse movement
    const mouseX = event.clientX;
    const wrappedMouseX = (mouseX + window.innerWidth) % window.innerWidth;
    const deltaX = wrappedMouseX - previousMouseX;
    previousMouseX = wrappedMouseX;

    // Adjust the angle based on mouse movement
    angle += deltaX * rotationSpeed;

    // Update the flashHolder position based on the new angle
    flashHolder.position.x = flashLightDistance * Math.cos(angle);
    flashHolder.position.z = flashLightDistance * Math.sin(angle);
    flashHolder.position.y = 2; 

    flashLightTarget.position.x = cube.position.x + 10*flashLightDistance * Math.cos(angle);
    flashLightTarget.position.z = cube.position.z +10*flashLightDistance * Math.sin(angle);
    flashLightTarget.position.y = 2;
});

// var darknessTimeout = 100;
window.addEventListener('keydown', function(event) {
    switch(event.key) {
        case '1': goToLevel(0); break; // Move to Level 1
        case '2': goToLevel(1); break; // Move to Level 2
        case '3': goToLevel(2); break; // Move to Level 3
        case 'w': moveForward = true; break;
        case 's': moveBackward = true; break;
        case 'a': moveLeft = true; break;
        case 'd': moveRight = true; break;
        case 'e': interactWithObject(); break;
        case 'p': console.log(cube.position); break;
        // case 'l': flashTimeout = 5000; bounceTimeout = 100; break;
        case 'r': resetLevel(); break;
        // case 'x': flashTimeout = 99; darknessTimeout=10; break;
    }
});

window.addEventListener('keyup', function(event) {
    switch(event.key) {
        case 'w': moveForward = false; break;
        case 's': moveBackward = false; break;
        case 'a': moveLeft = false; break;
        case 'd': moveRight = false; break;
    }
});

var cubeBoundingBox = new THREE.Box3().setFromObject(cube);
var chestsBoundingBoxes = [];
var wallsBoundingBoxes = [];
var ghostBoundingBoxes = [];

// Update bounding boxes in the render loop
function updateBoundingBoxes() {
    // Update player's bounding box
    cubeBoundingBox.setFromObject(cube);

    if (purgatoryChests && chestsBoundingBoxes.length < 1000) {
        purgatoryChests.traverse((child) => {
            if (child.isMesh) {
                const chestBoundingBox = new THREE.Box3().setFromObject(child);
                chestsBoundingBoxes.push(chestBoundingBox);
            }
        });
    }

    if (purgatoryGhosts && purgatoryGhostsBoundingBox.length < 1000) {
        purgatoryGhosts.traverse((child) => {
            if (child.isMesh) {
                const chestBoundingBox = new THREE.Box3().setFromObject(child);
                purgatoryGhostsBoundingBox.push(purgatoryGhostsBoundingBox);
            }
        });
    }

    if (purgatoryWalls && wallsBoundingBoxes.length < 5000) {
        purgatoryWalls.traverse((child) => {
            if (child.isMesh) {
                const wallBoundingBox = new THREE.Box3().setFromObject(child);
                wallsBoundingBoxes.push(wallBoundingBox);
            }
        });
    }
}

// Check for collision with the chests
function checkGhostCollisions() {  
    for (let i = 0; i < purgatoryGhostsBoundingBox.length; i++) {
        if (cubeBoundingBox.intersectsBox(purgatoryGhostsBoundingBox[i])) {
            var x = cube.position.x;
            var y = cube.position.y;
            var z = cube.position.z;
            if(x<=30 && x>=-30 && z<=30 && z>=-30){
                return false;
            }
            console.log("hi");
            return true; // Collision detected
            
        }
    }
    return false; // No collision
}

// Check for collision with the chests
function checkChestCollisions() {  
    for (let i = 0; i < chestsBoundingBoxes.length; i++) {
        if (cubeBoundingBox.intersectsBox(chestsBoundingBoxes[i])) {
            var x = cube.position.x;
            var y = cube.position.y;
            var z = cube.position.z;
            if(x<=30 && x>=-30 && z<=30 && z>=-30){
                return false;
            }
            return true; // Collision detected
        }
    }
    return false; // No collision
}

// Check for collision with the invisible walls
function checkInvisibleWallsCollisions() {
    for(let i = 0; i< wallsBoundingBoxes.length; i++){
        if (cubeBoundingBox.intersectsBox(wallsBoundingBoxes[i])) {
            var x = cube.position.x;
            var y = cube.position.y;
            var z = cube.position.z;
            if(x<=30 && x>=-30 && z<=30 && z>=-30){
                return false;
            }
            return true; // Collision detected
        }
    }
    return false; // No collision
}

function handleCollisions(direction) {
    // Store the current position
    const oldCubePosition = cube.position.clone();
    const oldCameraPosition = camera.position.clone();

    // Try moving the player in the specified direction
    if (direction === 'forward') {
        cube.position.z -= moveSpeed;
        camera.position.z -= moveSpeed;
    } else if (direction === 'backward') {
        cube.position.z += moveSpeed;
        camera.position.z += moveSpeed;
    } else if (direction === 'left') {
        cube.position.x -= moveSpeed;
        camera.position.x -= moveSpeed;
    } else if (direction === 'right') {
        cube.position.x += moveSpeed;
        camera.position.x += moveSpeed;
    }

    // Update the bounding box after the attempted movement
    cubeBoundingBox.setFromObject(cube);

    // Check if the player has collided with the wall or a chest
    if (checkChestCollisions() || checkInvisibleWallsCollisions() || checkGhostCollisions()) {
        // If collided, revert to the previous position
        // console.log("I ams stuck");
        cube.position.copy(oldCubePosition);
        camera.position.copy(oldCameraPosition);
    }else{
        updatePathTrail();
    }
}

// Update minimap
function updatePathTrail() {
    pathPoints.push(new THREE.Vector3(cube.position.x/15, 0, cube.position.z/15));
    pathGeometry.setFromPoints(pathPoints);
    pathLine.computeLineDistances();
}

function updatePlayerPosition() {
    if (moveForward) {
        handleCollisions('forward');
    }
    if (moveBackward) {
        handleCollisions('backward');
    }
    if (moveLeft) {
        handleCollisions('left');
    }
    if (moveRight) {
        handleCollisions('right');
    }
}

// Update resolution on window resize
window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
});


var resetLevelTimeout = 10;
var playedDeathPopup = false;
var deathSoundPlayed = false;

function render() {
    if(playerItemCount == itemCount){
        atChest = false;
        atItem = false;
        goToLevel(1);
    }
    if (atChest || atItem) {
        interactMessage.style.opacity = 1;
    } else {
        interactMessage.style.opacity = 0;
    }

    // if (flashTimeout > 100) {
    //     darknessTimeout = 100;
    //     if (flickerTimeout === 0 && Math.random() < 0.006){
    //         flickerTimeout = 30;
    //     }
    //     flashTimeout -= 0.9;
    //     bounceTimeout -= 0.00018;
    // }else{
    //     darknessTimeout -= 0.1;
    // }
    // if (flickerTimeout > 0){
    //     flickerTimeout -= 1;
    //     switch (flickerTimeout){
    //         case 25:
    //             flashLight.intensity = 5000;
    //             flashLightBounce.intensity = 100;
    //         break;
    //         case 15:
    //             flashLight.intensity = 1;
    //             flashLightBounce.intensity = 1;
    //         break;
    //         case 5:
    //             flashLight.intensity = 5000;
    //             flashLightBounce.intensity = 100;
    //         break;
    //         case 1:
    //             flashLight.intensity = 1;
    //             flashLightBounce.intensity = 1;
    //         break;
    //     }
    // }
    // else {
    //     flashLight.intensity = flashTimeout;
    //     flashLightBounce.intensity = bounceTimeout;
    // }


    // if (darknessTimeout <= 0) {
    //     showGameOverScreen();
    //     flashTimeout = 0;
    //     bounceTimeout = 0;
    //     resetLevelTimeout -= 0.03;
    // }else{

         
         updatePlayerPosition();
         updateBoundingBoxes();
         checkAtChest();
         checkAtGhost();
         checkAtItem();
        //   if(purgatoryGhosts){
        //      moveGhost();
        //   }
    // }
    for(i = 0; i< items.length; i++){
        items[i].itemGroup.rotation.y+=0.025;
    }

    

    requestAnimationFrame(render);
    mapRenderer.render(mapScene, mapCamera);
    renderer.render(scene, camera);
}

// Initial level setup
setupLevel(currentLevel);
render();  
