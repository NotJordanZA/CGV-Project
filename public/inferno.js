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

// Position the camera for an isometric view (45 degrees)
camera.position.set(40,40, 40); // Adjust these for the desired view
camera.lookAt(0, 0, 0); // Aim the camera at the origin (where the cube is)

//Load and add model
const gltfLoader = new GLTFLoader();
var playerParent = new THREE.Object3D();
var flashHolder = new THREE.Object3D();
gltfLoader.load('./assets/model/cgv-torch.glb', (gltf) => {
    flashHolder.add(gltf.scene);
    flashHolder.scale.set(0.5, 0.5, 0.5);
    playerParent.add(flashHolder); // Attach it to the player
}, undefined, (error) => {
    console.error('An error happened while loading the flashLight model:', error);
});


scene.add(playerParent);
var playerModel;
let mixer;
let walkAction;
gltfLoader.load('./assets/model/bart2.0.glb', (gltf) => {
    playerModel = gltf.scene;
    playerModel.scale.set(1, 1, 1); // Adjust scale as needed
    playerParent.position.set(0, -10, 0);
    playerModel.rotateY(Math.PI);
    playerParent.add(playerModel);

    mixer = new THREE.AnimationMixer(playerModel);
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

// Map configuration
var mapRenderer = new THREE.WebGLRenderer({ alpha: true });
mapRenderer.setSize(400, 400); 
mapRenderer.domElement.style.position = 'absolute';
mapRenderer.domElement.style.bottom = '0';
mapRenderer.domElement.style.right = '5px';
mapRenderer.domElement.style.zIndex = '9999';
mapRenderer.domElement.style.opacity = '0.85';
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
var pathMaterial = new THREE.LineDashedMaterial({ color: 0xdb9d00, dashSize: 2, gapSize: 2 });
var pathLine = new THREE.Line(pathGeometry, pathMaterial);
pathLine.computeLineDistances();
mapScene.add(pathLine);

// Level Configurations
let currentLevel = 0; // Start at level 0
const levels = [level1Config, level2Config, level3Config];
let initialModelPosition = new THREE.Vector3(0, 0, 0);
let initialCameraPosition = new THREE.Vector3(40, 40, 40);
var atChest = false;
var atItem = false;
var playerItemCount = 0;
var itemCount;
var items = [];
var chests = [
    {x: 127, z: -733},
    {x: 336, z: 230},
    {x: 435, z: -172},
    {x: -672, z: -134},
    {x: -375, z: 315}
];

const vignette = document.getElementById('vignette');
const gameOverMessage = document.getElementById('game-over-message');
const interactMessage = document.getElementById('object-interact');
const itemTextMessage = document.getElementById('item-text');
const pauseMenu = document.getElementById('pause-menu');
const restartLevelButton = document.getElementById('restart-level-button');
const plotText = document.getElementById('plot-text');
const plotScreen = document.getElementById('plot-page');
restartLevelButton.addEventListener("click", () => {
    resetLevel();
    togglePauseMenu()
});


// Update the vignette intensity based on darknessTimeout
function updateVignetteIntensity(intensity) {
    vignette.style.opacity = intensity; // Set opacity between 0 and 1
}

function showGameOverScreen() {
    gameOverMessage.style.opacity = 1; // Fade in the "You Died" message
}

function displayPlotScreen(){
    var plotScreenTimer = null;
    plotText.innerText = 
        "Black. Your vision is consumed by an inescapable darkness - though your body is gifted no such absence.\n" +
        "There is a pervasive heat that you feel beyond your skin, as though your innards are in a constant cycle of melting and reconstruction.\n\n" +
        "The abyss fades; the scalding caresse of the inferno does not.\n\n" +
        "“Where… am I?”\n\n" +
        "You wish your confusion was confined to your location. You know nothing.\n" +
        "Who are you? How did you get here?\n\n" +
        "There is but one thing that you know to be certain: you cannot let the darkness grab hold of you.";
    plotScreen.style.opacity = 1;
    plotScreenTimer = setTimeout(() => {
        plotScreen.style.opacity = 0;
    }, 25000);  
}

function resetLevel() {
    playerModel.position.copy(initialModelPosition);
    camera.position.copy(initialCameraPosition);
    camera.lookAt(0, 0, 0);

    items.forEach(item=>{ // Remove items from map
        item.removeThisItem();
    })

    flashTimeout = 5000;
    bounceTimeout = 100;
    darknessTimeout = 100;
    mapScene.clear();
    pathPoints = [];
    items = [];
    playerItemCount = 0;
    gameOverMessage.style.opacity = 0;
    vignette.style.opacity = 0;

    setupLevel(currentLevel); 
    console.log("Level reset to its original configuration.");
}

// Function to setup levels
function setupLevel(level) {
    const levelConfig = levels[level];
    mapScene.add(pathLine);

    // Update flashlight color and power for this level
    flashLight.color.setHex(levelConfig.flashLightColor);
    flashLightBounce.color.setHex(levelConfig.flashLightBounceColor);
    flashLight.intensity = levelConfig.flashLightPower;
    var item1 = new item(
        scene,
        "./assets/inferno/scroll.glb",
        -400, -2, -100,
        "A contract with the following text:\n\"...all earthly possessions and the signatory’s soul enter the sole possession of…\"\nThe rest is illegible.",
        new THREE.Color(0xffe600)
    );
    var item2 = new item(
        scene,
        "./assets/inferno/chain.glb",
        -400, 0, 100,
        "Iron chains with a light blue tint.\nThe metal is ice cold and makes me feel empty.\n...were these mine?",
        new THREE.Color(0x0051ff)
    );
    var item3 = new item(
        scene,
        "./assets/inferno/knife.glb",
        400, -25, -600,
        "Was this my old dagger?\nI don’t remember where I put it.\n...how did it get here?",
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

// Ground (Plane) setup
var planeGeometry = new THREE.PlaneGeometry(100, 100, 150, 150);
var planeMaterial = new THREE.MeshPhongMaterial();
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -10;
plane.receiveShadow = true; // This will receive the shadows
if (currentLevel !== 0){
    scene.add(plane);
}

let infernoMap;
let infernoChests;
let infernoWalls;
let infernoWallsBoundingBox;
var floorBoundingBox = new THREE.Box3();
itemCount = 3;
scene.background = new THREE.Color( 0x000000 );
gltfLoader.load('./assets/inferno/cgv-inferno-map-baked-mesh.glb', (gltf) => {
    // Add the loaded infernoMap to the scene
    infernoMap = gltf.scene;
    infernoMap.rotation.y =  -Math.PI / 2;
    // Position the infernoMap to the right of the plane
    infernoMap.scale.set(50,50,50);
    infernoMap.position.set(0, -10, 0); // Adjust the position as needed
    scene.add(infernoMap);
    floorBoundingBox.setFromObject(infernoMap);
}, undefined, (error) => {
    console.error('An error happened while loading the infernoMap:', error);
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
gltfLoader.load('./assets/inferno/cgv-inferno-map-walls.glb', (gltf) => {
    infernoWalls = gltf.scene;
    infernoWalls.rotation.y = -Math.PI / 2;
    infernoWalls.scale.set(50,50,50);
    infernoWalls.position.set(6, -10, 6); // Adjust the position as needed
    infernoWallsBoundingBox = new THREE.Box3().setFromObject(infernoWalls);
}, undefined, (error) => {
    console.error('An error happened while loading the infernoMap:', error);
});

const listener = new THREE.AudioListener();
const audioLoader = new THREE.AudioLoader();
camera.add( listener );

const backgroundMusic = new THREE.Audio( listener );

audioLoader.load( './assets/music/inferno.mp3', function( buffer ) {
	backgroundMusic.setBuffer( buffer );
	backgroundMusic.setVolume( 1 );
    backgroundMusic.setLoop(true);
});

const deathPopupSound = new THREE.Audio( listener );

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

const infernorunningSound= new THREE.Audio(listener);

audioLoader.load('./assets/soundeffects/inferno-footsteps.mp3', function(buffer) {
    infernorunningSound.setBuffer(buffer);
    infernorunningSound.setLoop(true);
    infernorunningSound.setVolume(0.9);
}, undefined, (error) => {
    console.error('Error loading sound:', error);

});
//runningsound stops when keys awsd are not being pressed
window.addEventListener('click', () => {
    if (infernorunningSound.context.state === 'suspended') {
        infernorunningSound.context.resume().then(() => {
        });
    }
});
//sound effect when you knock into a wall
const infWallSound1 = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/inferno-walls.mp3', (buffer) => {
   infWallSound1.setBuffer(buffer);
   infWallSound1.setVolume(0.8);
}, undefined, (error) => {
    console.error('Error loading wall collision sound:', error);
});
const infWallSound2 = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/inferno-spooky-breeze.mp3', (buffer) => {
   infWallSound2.setBuffer(buffer);
   infWallSound2.setVolume(0.8);
}, undefined, (error) => {
    console.error('Error loading wall collision sound:', error);
});
//Object sound
const infobjectSound = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/objectsound.mp3', function(buffer) {
    infobjectSound.setBuffer(buffer);
    infobjectSound.setLoop(false);
    infobjectSound.setVolume(5.0);
}, undefined, (error) => {
    console.error('Error loading  object sound:', error);
});
//chest sound
const infchestSound = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/chestsound.mp3', function(buffer) {
    infchestSound.setBuffer(buffer);
    infchestSound.setLoop(false);
    infchestSound.setVolume(2.0);
}, undefined, (error) => {
    console.error('Error loading chest sound:', error);
});
//chain sound
const infchainSound = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/chainsound.mp3', (buffer) => {
    infchainSound.setBuffer(buffer);
infchainSound.setVolume(2.0);
}, undefined, (error) => {
    console.error('Error loading chain sound:', error);
});
//knife sound
const infknifeSound = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/knife-slice-sound.mp3', (buffer) => {
    infknifeSound.setBuffer(buffer);
infknifeSound.setVolume(2.0);
}, undefined, (error) => {
    console.error('Error loading knife sound:', error);
});
const infscrollSound = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/scroll-sound.mp3', (buffer) => {
    infscrollSound.setBuffer(buffer);
infscrollSound.setVolume(2.0);
}, undefined, (error) => {
    console.error('Error loading scroll sound:', error);
});
// Chest light setup
for(i = 0; i < chests.length; i++){
    var chestLight  = new THREE.PointLight(0xb8860b, 2000);
    chestLight.position.set(chests[i].x, 15,  chests[i].z);
    scene.add(chestLight);
}

// Cube setup

// Flashlight setupas

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

        if (distance <= 30) { 
            atChest = true;
            break;
        }
    }
}

let infObjectSoundPlayed = false;

function playObjectSoundIfNearItem() {
    const playerPosition = playerModel.position;
    const distanceThreshold = 100; //how close the player needs to be to trigger the sound
    let isNearItem = false;

    for (let i = 0; i < items.length; i++) {
        const itemPosition = items[i].position;
        const distance = playerPosition.distanceTo(itemPosition);

        if (distance <= distanceThreshold) {
            isNearItem = true;
            break;
        }
    }

    // Play sound if near an item and 15 seconds have passed since the last play
    if (isNearItem && !infObjectSoundPlayed) {
        infobjectSound.play();
        infObjectSoundPlayed = true;

        // Set a 15-second timer to allow the sound to play again
        setTimeout(() => {
            infObjectSoundPlayed = false;
        }, 20000); //20 seconds
    }
}


// Initialize chest play states for each chest with a default of `false`

let chestPlayStates = chests.map(() => ({ isPlayed: false }));

function playChestSoundIfNearChest() {
    const playerPosition = playerModel.position;
    const chestDistanceThreshold = 70;

    chests.forEach((chest, index) => {
        const chestPosition = new THREE.Vector3(chest.x, 0, chest.z);
        const distance = playerPosition.distanceTo(chestPosition);

        // Play the sound only if the player is within range and the sound hasn't played for this chest yet
        if (distance <= chestDistanceThreshold && !chestPlayStates[index].isPlayed) {
            infchestSound.play();
            chestPlayStates[index].isPlayed = true; // Mark as played to prevent re-triggering
        }
    });
}


// Check if player is near item
function checkAtItem() {
    var x = playerModel.position.x;
    var z = playerModel.position.z;

    atItem = false;

    for (var i = 0; i < items.length; i++) {
        var distance = Math.sqrt(Math.pow(items[i].position.x - x, 2) + Math.pow(items[i].position.z - z, 2));
        if (distance <= 30) { 
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
        const currentItem = checkAtItem(); // Get the item object the player is interacting with
            playerItemCount++;
            removeItem(currentItem);
            const modelPath = currentItem.modelPath.toLowerCase();
            // Check item type instead of modelPath
            if (modelPath.includes("knife")) {
                if (!infknifeSound.isPlaying) {
                    infknifeSound.play();
                }
            }
                else if(modelPath.includes("scroll")) {
                    if (!infscrollSound.isPlaying) {
                        infscrollSound.play();
                    }
                } else{
                    if (!infchainSound.isPlaying) {
                    infchainSound.play();

                }

                
            // } else if (currentItem.getType() === "chain") {
            //     console.log("Playing key sound for chain item");
            //     if (!infchainSound.isPlaying) {
            //         infchainSound.play();
            //     }
            }
    
}
}


function togglePauseMenu(){
    if(pauseMenu.style.opacity == 1){
        pauseMenu.style.opacity = 0;
        pauseMenu.style.pointerEvents = "none";
    }else{
        pauseMenu.style.opacity = 1;
        pauseMenu.style.pointerEvents = "all";
    }
}

// Movement and control variables
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveSpeed = 0.75;
var flashLightDistance = 15;
let infernoisRunning=false;//sound
let previousMouseX = window.innerWidth / 2; 
let angle = 0;
const rotationSpeed = 0.006; 

window.addEventListener('mousemove', function(event) {
    const mouseX = event.clientX;
    const wrappedMouseX = (mouseX + window.innerWidth) % window.innerWidth;
    const deltaX = wrappedMouseX - previousMouseX;
    previousMouseX = wrappedMouseX;

    angle += deltaX * rotationSpeed;
    
    flashHolder.position.x = flashLightDistance * Math.cos(angle);
    flashHolder.position.z = flashLightDistance * Math.sin(angle);
    flashHolder.position.y = 20;

    flashLightTarget.position.x = playerParent.position.x + 10 * flashLightDistance * Math.cos(angle);
    flashLightTarget.position.z = playerParent.position.z + 10 * flashLightDistance * Math.sin(angle);
    flashLightTarget.position.y = 20;

    flashHolder.lookAt(flashLightTarget.position);
    flashHolder.rotateY(-Math.PI/2);
});

var darknessTimeout = 100;
//footsteps sound
function updateinfernoRunningSound() {
    if ((moveForward || moveBackward || moveLeft || moveRight) && !infernorunningSound.isPlaying) {
        infernorunningSound.play(); // Start sound
        infernoisRunning = true;
    } else if (!moveForward && !moveBackward && !moveLeft && !moveRight && infernorunningSound.isPlaying) {
        infernorunningSound.stop(); // Stop sound
        infernoisRunning = false;
    }
}
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
        case 'Escape': togglePauseMenu(); break;
    }updateinfernoRunningSound(); //sound
});

window.addEventListener('keyup', function(event) {
    switch(event.key) {
        case 'w': moveForward = false; break;
        case 's': moveBackward = false; break;
        case 'a': moveLeft = false; break;
        case 'd': moveRight = false; break;
    }updateinfernoRunningSound();
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

    if (infernoWalls && wallsBoundingBoxes.length < 5000) {
        infernoWalls.traverse((child) => {
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
    const oldPlayerModelPosition = playerParent.position.clone();
    const oldCameraPosition = camera.position.clone();
    let playerAngle = 0;
    // Try moving the player in the specified direction
    if (direction === 'forward') {
        playerParent.position.z -= moveSpeed;
        camera.position.z -= moveSpeed;
    } else if (direction === 'backward') {
        playerParent.position.z += moveSpeed;
        camera.position.z += moveSpeed;
        playerAngle = Math.PI;
    } else if (direction === 'left') {
        playerParent.position.x -= moveSpeed;
        camera.position.x -= moveSpeed;
        playerAngle = -Math.PI/2;
    } else if (direction === 'right') {
        playerParent.position.x += moveSpeed;
        camera.position.x += moveSpeed;
        playerAngle = Math.PI/2;
    }

    playerModel.rotation.y = playerAngle;

    // Update the bounding box after the attempted movement
    playerModelBoundingBox.setFromObject(playerModel);

    // Check if the player has collided with the wall or a chest
    if (checkChestCollisions() || checkInvisibleWallsCollisions()) {
        // If collided, revert to the previous position
        // console.log("I ams stuck");
        playerModel.position.copy(oldPlayerModelPosition);
        camera.position.copy(oldCameraPosition);
         //collision sound
         //Play a random wall collision sound
        
         if (Math.random() < 0.3) { 
            const randomChoice = Math.random() < 0.5 ? 1 : 2;
            if (randomChoice === 1 && !infWallSound1.isPlaying) {
                infWallSound2.stop();
                infWallSound1.play();
            } else if (randomChoice === 2 && !infWallSound2.isPlaying) {
                infWallSound1.stop();
                infWallSound2.play();
            }
        }
}
else{
        updatePathTrail();
    }
}

window.addEventListener('mousemove', function(event) {
    const mouseX = event.clientX;
    const wrappedMouseX = (mouseX + window.innerWidth) % window.innerWidth;
    const deltaX = wrappedMouseX - previousMouseX;
    previousMouseX = wrappedMouseX;

    angle += deltaX * rotationSpeed;
    
    flashHolder.position.x = flashLightDistance * Math.cos(angle);
    flashHolder.position.z = flashLightDistance * Math.sin(angle);
    flashHolder.position.y = 2; 

    flashLightTarget.position.x = playerParent.position.x +10*flashLightDistance * Math.cos(angle);
    flashLightTarget.position.z = playerParent.position.z +10*flashLightDistance * Math.sin(angle);
    flashLightTarget.position.y = 2;
});



function updatePathTrail() {
    pathPoints.push(new THREE.Vector3(playerModel.position.x/20, 0, playerModel.position.z/20));
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
var atStart = true;

function render() {
    if (atStart) {
        atStart = false;
        displayPlotScreen();
    }
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
        const delta = clock.getDelta();
        mixer.update(delta); 
    }
    if (flashTimeout > 100) {
        darknessTimeout = 10000;
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
        playObjectSoundIfNearItem();
        playChestSoundIfNearChest();
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
    renderer.render(scene, camera);
    mapRenderer.render(mapScene, mapCamera);
}

// Initial level setup
backgroundMusic.play();
localStorage.setItem("startTime", Date.now());
setupLevel(currentLevel);
render();
