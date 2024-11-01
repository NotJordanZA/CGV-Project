import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { level1Config } from './level1.js';
import { level2Config } from './level2.js';
import { level3Config } from './level3.js';
import { item } from './item.js';

// Set up the canvas and renderer
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
const clock = new THREE.Clock();
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0xDDDDDD, 1);
document.body.appendChild(renderer.domElement);
var scene = new THREE.Scene();

var aspect = WIDTH / HEIGHT;
var d = 40; // Frustum size (affects the zoom level)
var camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

//Load and add model
var playerModel;
let mixer;
let walkAction;
var phongMaterial = new THREE.MeshPhongMaterial({ color: 0x0095DD });
const gltfLoader = new GLTFLoader();
gltfLoader.load('./assets/model/bart2.0.glb', (gltf) => {
    playerModel = gltf.scene;
    playerModel.scale.set(1, 1, 1); // Adjust scale as needed
    playerModel.position.set(0, 0, 0);
    playerModel.rotateY(Math.PI);
    scene.add(playerModel);
    playerModel.add(flashHolder); // Attach it to the cube
    
    mixer = new THREE.AnimationMixer(playerModel);

    // Combine all animations into a single walk action
    const combinedTracks = gltf.animations.reduce((tracks, clip) => {
        return tracks.concat(clip.tracks);
    }, []);
    const walkClip = new THREE.AnimationClip('Walk', -1, combinedTracks);
    walkAction = mixer.clipAction(walkClip);
    walkAction.loop = THREE.LoopRepeat;

    
    render();
}, undefined, (error) => {
    console.error('An error happened while loading the player model:', error);
});

window.addEventListener('mousemove', function(event) {
    const mouseX = event.clientX;
    const wrappedMouseX = (mouseX + window.innerWidth) % window.innerWidth;
    const deltaX = wrappedMouseX - previousMouseX;
    previousMouseX = wrappedMouseX;

    angle += deltaX * rotationSpeed;
    
    // Set flashlight position and target based on angle
    flashHolder.position.x = flashLightDistance * Math.cos(angle);
    flashHolder.position.z = flashLightDistance * Math.sin(angle);
    flashHolder.position.y = 2; 

    flashLightTarget.position.x = playerModel.position.x + 10 * flashLightDistance * Math.cos(angle);
    flashLightTarget.position.z = playerModel.position.z + 10 * flashLightDistance * Math.sin(angle);
    flashLightTarget.position.y = 2;

    // Adjust player orientation to match flashlight direction, with a 45-degree correction
    if (playerModel) {
        playerModel.rotation.y = angle + Math.PI / 3; // Adjust by 45 degrees
    }
});



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
let initialPlayerModelPosition = new THREE.Vector3(0, 0, 0);
let initialCameraPosition = new THREE.Vector3(40, 40, 40);
var atChest = false;
var atItem = false;
var playerItemCount = 0;
var itemCount;
var darknessTimeout = 100;
var items = [];
var chests = [
    {x: -324, z: -1212},
    {x: -756, z: -668},
    {x: 628, z: -728},
];

const vignette = document.getElementById('vignette');
const gameOverMessage = document.getElementById('game-over-message');
const interactMessage = document.getElementById('object-interact');
const itemTextMessage = document.getElementById('item-text');


// Update the vignette intensity based on darknessTimeout
function updateVignetteIntensity(intensity) {
    vignette.style.opacity = intensity; // Set opacity between 0 and 1
}

function showGameOverScreen() {
    gameOverMessage.style.opacity = 1; // Fade in the "You Died" message
}

function resetLevel() {
    playerModel.position.copy(initialPlayerModelPosition);
    camera.position.copy(initialCameraPosition);

    items.forEach(item=>{ // Remove items from map
        item.removeThisItem();
    })
    
    camera.lookAt(0, 0, 0);  // Make sure camera is looking at the correct point
    flashTimeout = 5000;
    bounceTimeout = 100;
    darknessTimeout = 100;
    mapScene.clear();
    pathPoints = [];
    items = [];
    playerItemCount = 0;
    gameOverMessage.style.opacity = 0;
    vignette.style.opacity = 0;

    // Optional: Reset any other elements such as lights, textures, etc.
    setupLevel(currentLevel); // Reapply the level configurations
    console.log("Level reset to its original configuration.");
}

// Function to setup levels
function setupLevel(level) {
    const levelConfig = levels[level];
    mapScene.add(pathLine);
    // Update the cube color for this levelw

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
            location.href = 'inferno.html';
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
let infernoChests;
let purgatoryWalls;
let purgatoryWallsBoundingBox;


var floorBoundingBox = new THREE.Box3();
itemCount = 3;
scene.background = new THREE.Color( 0x000000 );
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
gltfLoader.load('./assets/inferno/cgv-inferno-map-chests-mesh.glb', (gltf) => {
    // Add the loaded infernoMap to the scene
    infernoChests = gltf.scene;
    // Position the infernoMap to the right of the plane
    infernoChests.rotation.y = -Math.PI / 2;
    infernoChests.scale.set(50,50,50);
    infernoChests.position.set(0, -10, 0); // Adjust the position as needed
    scene.add(infernoChests);
}, undefined, (error) => {
    console.error('An error happened while loading the infernoMap:', error);
});
gltfLoader.load('./assets/purgatory/cgv-purgatory-walls.glb', (gltf) => {
    purgatoryWalls = gltf.scene;
    purgatoryWalls.rotation.y = -Math.PI / 2;
    purgatoryWalls.scale.set(50,50,50);
    purgatoryWalls.position.set(6, -10, 6); // Adjust the position as needed
    purgatoryWallsBoundingBox = new THREE.Box3().setFromObject(purgatoryWalls);
}, undefined, (error) => {
    console.error('An error happened while loading the infernoMap:', error);
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
    var chestLight  = new THREE.PointLight(0xf76628, 1000);
    chestLight.position.set(chests[i].x, 15,  chests[i].z);
    scene.add(chestLight);
}



// Flashlight setupas
var flashGeometry = new THREE.BoxGeometry(1, 2, 1);
var flashHolder = new THREE.Mesh(flashGeometry, phongMaterial);

var flashTimeout = 5000;
var bounceTimeout = 100;

var flashLight = new THREE.SpotLight(0xffe394, 5000, 0, Math.PI / 4, 1, 2);
flashLight.position.set(0, 0, 0); // Position it at the cube's location
var flashLightBounce = new THREE.PointLight(0xffe394, 100);
flashLightBounce.position.set(0, 0, 0);
flashLight.add(flashLightBounce);
flashHolder.add(flashLight);

var flashLightTarget = new THREE.Object3D();
scene.add(flashLightTarget);
flashLight.target = flashLightTarget;

// Check if player is near chest
function checkAtChest() {
    var x = playerModel.position.x;
    var z = playerModel.position.z;

    atChest = false;

    for (var i = 0; i < chests.length; i++) {
        var distance = Math.sqrt(Math.pow(chests[i].x - x, 2) + Math.pow(chests[i].z - z, 2));

        if (distance <= 50) { 
            atChest = true;
            break;
        }
    }
}


// Check if player is near item
function checkAtItem() {
    var x = playerModel.position.x;
    var z = playerModel.position.z;

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

function interactWithObject(){
    if(atChest){
        flashTimeout = 5000;
        bounceTimeout = 100;
    }else if(atItem){
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
let angle = 0;
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

    flashLightTarget.position.x = playerModel.position.x + 10*flashLightDistance * Math.cos(angle);
    flashLightTarget.position.z = playerModel.position.z +10*flashLightDistance * Math.sin(angle);
    flashLightTarget.position.y = 2;
});

var darknessTimeout = 100;
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
        case 'p': console.log(playerModel.position); break;
        case 'l': flashTimeout = 5000; bounceTimeout = 100; break;
        case 'r': resetLevel(); break;
        case 'x': flashTimeout = 99; darknessTimeout=10; break;
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

var playerModelBoundingBox = new THREE.Box3();
var chestsBoundingBoxes = [];
var wallsBoundingBoxes = [];

// Update bounding boxes in the render loop
function updateBoundingBoxes() {
    // Update player's bounding box
    playerModelBoundingBox.setFromObject(playerModel);

    if (infernoChests && chestsBoundingBoxes.length < 1000) {
        infernoChests.traverse((child) => {
            if (child.isMesh) {
                const chestBoundingBox = new THREE.Box3().setFromObject(child);
                chestsBoundingBoxes.push(chestBoundingBox);
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
function checkChestCollisions() {  
    for (let i = 0; i < chestsBoundingBoxes.length; i++) {
        if (playerModelBoundingBox.intersectsBox(chestsBoundingBoxes[i])) {
            var x = playerModel.position.x;
            var y = playerModel.position.y;
            var z = playerModel.position.z;
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
        if (playerModelBoundingBox.intersectsBox(wallsBoundingBoxes[i])) {
            var x = playerModel.position.x;
            var y = playerModel.position.y;
            var z = playerModel.position.z;
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
    const oldPlayerModelPosition = playerModel.position.clone();
    const oldCameraPosition = camera.position.clone();

    // Try moving the player in the specified direction
    if (direction === 'forward') {
        playerModel.position.z -= moveSpeed;
        camera.position.z -= moveSpeed;
    } else if (direction === 'backward') {
        playerModel.position.z += moveSpeed;
        camera.position.z += moveSpeed;
    } else if (direction === 'left') {
        playerModel.position.x -= moveSpeed;
        camera.position.x -= moveSpeed;
    } else if (direction === 'right') {
        playerModel.position.x += moveSpeed;
        camera.position.x += moveSpeed;
    }

    // Update the bounding box after the attempted movement
    playerModelBoundingBox.setFromObject(playerModel);

    // Check if the player has collided with the wall or a chest
    if (checkChestCollisions() || checkInvisibleWallsCollisions()) {
        // If collided, revert to the previous position
        // console.log("I ams stuck");
        playerModel.position.copy(oldPlayerModelPosition);
        camera.position.copy(oldCameraPosition);
    }else{
        updatePathTrail();
    }
}

// Update minimap
function updatePathTrail() {
    pathPoints.push(new THREE.Vector3(playerModel.position.x/15, 0, playerModel.position.z/15));
    pathGeometry.setFromPoints(pathPoints);
    pathLine.computeLineDistances();
}

function updatePlayerPosition() {
    const isMoving = moveForward || moveBackward || moveLeft || moveRight;
    // Start the walk animation if moving and not already playing
    if (isMoving && !walkAction.isRunning()) {
        walkAction.play();
    }
    // Stop the walk animation if not moving
    else if (!isMoving && walkAction.isRunning()) {
        walkAction.stop();
    }



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

var flickerTimeout = 0;
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
    if (mixer) {
        const delta = clock.getDelta(); // Use a THREE.Clock instance to get the delta time
        mixer.update(delta); // Update the animation mixer
    }
    if (flashTimeout > 100) {
        darknessTimeout = 100;
        if (flickerTimeout === 0 && Math.random() < 0.006){
            flickerTimeout = 30;
        }
        flashTimeout -= 0.9;
        bounceTimeout -= 0.00018;
    }else{
        darknessTimeout -= 0.1;
    }
    if (flickerTimeout > 0){
        flickerTimeout -= 1;
        switch (flickerTimeout){
            case 25:
                flashLight.intensity = 5000;
                flashLightBounce.intensity = 100;
            break;
            case 15:
                flashLight.intensity = 1;
                flashLightBounce.intensity = 1;
            break;
            case 5:
                flashLight.intensity = 5000;
                flashLightBounce.intensity = 100;
            break;
            case 1:
                flashLight.intensity = 1;
                flashLightBounce.intensity = 1;
            break;
        }
    }
    else {
        flashLight.intensity = flashTimeout;
        flashLightBounce.intensity = bounceTimeout;
    }


    if (darknessTimeout <= 0) {
        if(!deathSoundPlayed){
            deathSound.play();
            deathSoundPlayed = true;
        }
        if(!playedDeathPopup){
            var deathPopupTimer = null;
            deathPopupTimer = setTimeout(() => {
                showGameOverScreen();
                deathPopupSound.play();
            }, 1800);
            playedDeathPopup = true;
        }
        flashTimeout = 0;
        bounceTimeout = 0;
        resetLevelTimeout -= 0.03;
    }else{
        updatePlayerPosition();
        updateBoundingBoxes();
        checkAtChest();
        checkAtItem();
    }

    if(resetLevelTimeout <= 0){
        resetLevelTimeout = 10;
        resetLevel();
    }

    for(i = 0; i< items.length; i++){
        items[i].itemGroup.rotation.y+=0.025;
    }

    const vignetteIntensity = THREE.MathUtils.clamp(1 - (darknessTimeout / 100), 0, 1);
    updateVignetteIntensity(vignetteIntensity);

    requestAnimationFrame(render);
    mapRenderer.render(mapScene, mapCamera);
    renderer.render(scene, camera);
}

// Initial level setup
setupLevel(currentLevel);