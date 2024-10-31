import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { level1Config } from './level1.js';
import { level2Config } from './level2.js';
import { level3Config, applyLevel3Lighting} from './level3.js';
import { item } from './item.js';

// Set up the canvas and renderer
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor( 0xDDDDDD, 1);
document.body.appendChild(renderer.domElement);
var scene = new THREE.Scene();
var aspect = WIDTH / HEIGHT;
var d = 40; // Frustum size (affects the zoom level)
var camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 100000);
var skyBox;

//Load and add model
var playerModel;
var phongMaterial = new THREE.MeshPhongMaterial({ color: 0x0095DD });
const gltfLoader = new GLTFLoader();
gltfLoader.load('./assets/model/bart2.0.glb', (gltf) => {
    playerModel = gltf.scene;
    playerModel.scale.set(1, 1, 1); // Adjust scale as needed
    playerModel.position.set(0, 0, 0);
    playerModel.rotateY(Math.PI);
    scene.add(playerModel);
    playerModel.add(flashHolder); // Attach it to the cube
    render();
}, undefined, (error) => {
    console.error('An error happened while loading the player model:', error);
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
var pathMaterial = new THREE.LineDashedMaterial({ color: 0x361b00, dashSize: 3, gapSize: 3 });
var pathLine = new THREE.Line(pathGeometry, pathMaterial);
pathLine.computeLineDistances();

// Level Configurations
let currentLevel = 2; // Start at level 0
const levels = [level1Config, level2Config, level3Config];
let initialPlayerModelPosition = new THREE.Vector3(0, 0, 0);
let initialCameraPosition = new THREE.Vector3(40, 40, 40);
var atChest = false;
var atItem = false;
var playerItemCount = 0;
var itemCount;
var playerFalling = false;
let fallSpeed = 0;
let jumpSpeed = 1;
let fallJumping = true;
var darknessTimeout = 100;
var items = [];
var chests = [
    {x: 190, z:135},
    {x: 250, z:-100},
    {x: 90, z:-420},
    {x: -400, z:-60},
    {x: -140, z:125},
]

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
    camera.lookAt(0, 0, 0); 

    items.forEach(item=>{ // Remove items from map
        item.removeThisItem();
    })

    flashTimeout = 5000;
    bounceTimeout = 100;
    darknessTimeout = 100;
    paridisioMap.visible = true;
    paridisioMapTrapped.visible = false;
    fallSpeed = 0;
    fallJumping = true;
    jumpSpeed = 1;
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
        "./assets/level3/drop.glb",
        125, 0, 300,
        "A single metallic tear with a blue shine.\nOn the side is the initial L inscribed.\nIs this\n...for me?",
        new THREE.Color(0xffe600)
    );
    var item2 = new item(
        scene,
        "./assets/level3/heart.glb",
        -420, 0, -238,
        "My Heart!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
        new THREE.Color(0x0051ff)
    );
    var item3 = new item(
        scene,
        "./assets/level3/key.glb",
        55, 0, -350,
        "An ornate silver key with a lace tag reading “Mine now.”\nThis is the key for Liora’s Music Box.\nIs that my handwriting on the tag?",
        new THREE.Color(0xbf00ff)
    );
    items.push(item1);
    items.push(item2);
    items.push(item3);
}

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

let paridisioMap;
let paridisioMapTrapped;
let paridisioChests;
let paridisioWalls;
let paridisioWallsBoundingBox;


applyLevel3Lighting(scene);
itemCount = 3;
gltfLoader.load('./assets/level3/cgv-paradisio-map-base-shiny.glb', (gltf) => {
    paridisioMap = gltf.scene;
    paridisioMap.rotation.y = -Math.PI / 2;
    paridisioMap.scale.set(30,30,30);
    paridisioMap.position.set(0, -10, 0); 
    scene.add(paridisioMap);
}, undefined, (error) => {
    console.error('An error happened while loading the paridisioMap:', error);
});
gltfLoader.load('./assets/level3/cgv-paradisio-map-base-trapped.glb', (gltf) => {
    paridisioMapTrapped = gltf.scene;
    paridisioMapTrapped.rotation.y = -Math.PI / 2;
    paridisioMapTrapped.scale.set(30,30,30);
    paridisioMapTrapped.position.set(0, -10, 0); 
    paridisioMapTrapped.visible = false;
    scene.add(paridisioMapTrapped);
}, undefined, (error) => {
    console.error('An error happened while loading the paridisioMap:', error);
});
gltfLoader.load('./assets/level3/cgv-paradisio-map-chests.glb', (gltf) => {
    paridisioChests = gltf.scene;
    paridisioChests.rotation.y = -Math.PI / 2;
    paridisioChests.scale.set(30,30,30);
    paridisioChests.position.set(0, -10, 0); 
    scene.add(paridisioChests);
}, undefined, (error) => {
    console.error('An error happened while loading the paridisioMap:', error);
});
gltfLoader.load('./assets/level3/cgv-heaven-walls.glb', (gltf) => {
    paridisioWalls = gltf.scene;
    paridisioWalls.rotation.y = -Math.PI / 2;
    paridisioWalls.scale.set(30,30,30);
    paridisioWalls.position.set(2, -10, 2); 
    paridisioWallsBoundingBox = new THREE.Box3().setFromObject(paridisioWalls);
}, undefined, (error) => {
    console.error('An error happened while loading the paridisioMap:', error);
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
	deathSound.setVolume( 0.5 );
});

const fallingSound = new THREE.Audio( listener );
audioLoader.load( './assets/soundeffects/death-falling.mp3', function( buffer ) {
	fallingSound.setBuffer( buffer );
    fallingSound.playbackRate = 0.5;
    fallingSound.detune += 1600;
    fallingSound.setLoop(false);
	fallingSound.setVolume( 0.5 );
});
//sounds
const parrunningSound = new THREE.Audio(listener);

audioLoader.load('./assets/soundeffects/paradiso-running.mp3', function(buffer) {
    parrunningSound.setBuffer(buffer);
    parrunningSound.setLoop(true);
    parrunningSound.setVolume(1.0);
}, undefined, (error) => {
    console.error('Error loading sound:', error);

});
//Object sound
const parobjectSound = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/objectsound.mp3', function(buffer) {
    parobjectSound.setBuffer(buffer);
    parobjectSound.setLoop(false);
    parobjectSound.setVolume(2.0);
}, undefined, (error) => {
    console.error('Error loading  object sound:', error);
});
//chest sound
const parchestSound = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/chestsound.mp3', function(buffer) {
    parchestSound.setBuffer(buffer);
    parchestSound.setLoop(false);
    parchestSound.setVolume(2.0);
}, undefined, (error) => {
    console.error('Error loading chest sound:', error);
});
//key sound
const parkeySound = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/keysound.mp3', (buffer) => {
    parkeySound.setBuffer(buffer);
    parkeySound.setVolume(2.0);
}, undefined, (error) => {
    console.error('Error loading key sound:', error);
});
//water drop sound
const pardropSound = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/drop-sound.mp3', function(buffer) {
    pardropSound.setBuffer(buffer);
    pardropSound.setLoop(false);
    pardropSound.setVolume(2.0);
}, undefined, (error) => {
    console.error('Error loading drop sound:', error);
});

//heart/victory sound
const parheartSound = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/heartvictorysound.mp3', function(buffer) {
    parheartSound.setBuffer(buffer);
    parheartSound.setLoop(false);
    parheartSound.setVolume(0.8);
}, undefined, (error) => {
    console.error('Error loading heart/victory sound:', error);
});

const paradisoWallSound = new THREE.Audio(listener);
audioLoader.load('./assets/soundeffects/paradiso-walls.mp3', (buffer) => {
    paradisoWallSound .setBuffer(buffer);
    paradisoWallSound .setVolume(0.8);
}, undefined, (error) => {
    console.error('Error loading wall collision sound:', error);
});



window.addEventListener('click', () => {
    if (parrunningSound.context.state === 'suspended') {
        parrunningSound.context.resume().then(() => {
            console.log('Audio context resumed');
        });
    }
});


// Chest light setup
for(i = 0; i < chests.length; i++){
    var chestLight  = new THREE.PointLight(0xb8860b, 2000);
    chestLight.position.set(chests[i].x, 15,  chests[i].z);
    scene.add(chestLight);
}

// World light setup
const directionalLight = new THREE.DirectionalLight( 0xffffff, 20 );
directionalLight.position.set(-1000, 100, -1000);
directionalLight.castShadow = true;
scene.add( directionalLight );
const light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

const skyBoxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);

// Skybox setup
const loader = new THREE.TextureLoader();
const materials = [
    new THREE.MeshBasicMaterial({
        map: loader.load('./assets/level3/skybox/pos-x.png'),
        side: THREE.BackSide
    }),
    new THREE.MeshBasicMaterial({
        map: loader.load('./assets/level3/skybox/pos-x.png'), // left
        side: THREE.BackSide
    }),
    new THREE.MeshBasicMaterial({
        map: loader.load('./assets/level3/skybox/pos-y.png'),
        side: THREE.BackSide
    }),
    new THREE.MeshBasicMaterial({
        map: loader.load('./assets/level3/skybox/neg-y.png'),// bottom
        side: THREE.BackSide
    }),
    new THREE.MeshBasicMaterial({
        map: loader.load('./assets/level3/skybox/pos-z.png'),
        side: THREE.BackSide
    }),
    new THREE.MeshBasicMaterial({
        map: loader.load('./assets/level3/skybox/neg-z.png'), // right
        side: THREE.BackSide
    })
];

materials.forEach(material => {
    if (material.map) {
        material.map.repeat.set(3, 3);
        material.map.wrapS = THREE.RepeatWrapping;
        material.map.wrapT = THREE.RepeatWrapping;
        material.map.minFilter = THREE.LinearFilter;
    }
});
skyBox = new THREE.Mesh(skyBoxGeometry, materials);
scene.add(skyBox);

// Flashlight setupas
var flashGeometry = new THREE.BoxGeometry(1, 2, 1);
var flashHolder = new THREE.Mesh(flashGeometry, phongMaterial);

var flashTimeout = 5000;
var bounceTimeout = 0;

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

function fallingPlayer() {
    if (fallJumping) {
        playerModel.translateY(jumpSpeed);
        jumpSpeed -= 0.05;
        
        if (jumpSpeed <= 0) {
            fallJumping = false;
            fallSpeed = 0;
        }
    } else {
        fallSpeed -= 0.05;
        playerModel.translateY(fallSpeed);
    }
}

function interactWithObject(){
    if(atChest){
        paridisioMap.visible = false;
        paridisioMapTrapped.visible = true;
        darknessTimeout = 0;
        playerFalling = true;
    }else if(atItem){
        const currentItem = checkAtItem(); // Get the item object the player is interacting with
        playerItemCount++;
        removeItem(checkAtItem());

        const modelPath = currentItem.modelPath.toLowerCase();

        if (modelPath.includes("key")) {
            console.log("Playing key sound for item with key in modelPath");
            if (!parkeySound.isPlaying) {
                parkeySound.play();
            }
        } else if (modelPath.includes("heart")) {
            console.log("Playing heart sound for item with heart in modelPath");
            if (!parheartSound.isPlaying) {
                parheartSound.play();
            }
    
}else if (modelPath.includes("drop")) {
    console.log("Playing drop sound for item withdrop in modelPath");
    if (!pardropSound.isPlaying) {
        pardropSound.play();
    }

} 
     else {
        console.log("Playing default object sound");
        if (!parobjectSound.isPlaying) {
            parobjectSound.play();
        }
}
}
}

// Movement and control variables
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveSpeed = 1.25;
var flashLightDistance = 10;

let previousMouseX = window.innerWidth / 2;
let angle = -45;
const rotationSpeed = 0.006;
let isRunning=false//sound

function parupdateRunningSound() {
    console.log(`Update Sound - Forward: ${moveForward}, Backward: ${moveBackward}, Left: ${moveLeft}, Right: ${moveRight}`);
    if ((moveForward || moveBackward || moveLeft || moveRight) && !parrunningSound.isPlaying) {
        parrunningSound.play(); // Start sound
        console.log("Running sound started");
        isRunning = true;
    } else if (!moveForward && !moveBackward && !moveLeft && !moveRight && parrunningSound.isPlaying) {
        parrunningSound.stop(); // Stop sound
        console.log("Running sound stopped");
        isRunning = false;
    }
}
function parplayObjectSoundIfNearItem() {
    const playerPosition = playerModel.position;
    const distanceThreshold = 140; //how close the player needs to be to trigger the sound

    let isNearItem = false;

    for (let i = 0; i < items.length; i++) {
        const itemPosition = items[i].position;
        const distance = playerPosition.distanceTo(itemPosition);

        if (distance <= distanceThreshold) {
            isNearItem = true;
            break;
        }
    }

    if (isNearItem && !parobjectSound.isPlaying) {
        parobjectSound.play();
    } else if (!isNearItem && parobjectSound.isPlaying) {
        parobjectSound.stop(); // Stop the sound if the player moves away
    }
}
function parplayChestSoundIfNearChest() {
    const playerPosition = playerModel.position;
    const chestDistanceThreshold = 70;
    let isNearChest = false;

    for (let i = 0; i < chests.length; i++) {
        const chestPosition = new THREE.Vector3(chests[i].x, 0, chests[i].z);
        const distance = playerPosition.distanceTo(chestPosition);

        if (distance <= chestDistanceThreshold) {
            isNearChest = true;
            break;
        }
    }

    // Play sound if near a chest, stop if moved away
    if (isNearChest && !parchestSound.isPlaying) {
        parchestSound.play();
    } else if (!isNearChest && parchestSound.isPlaying) {
        parchestSound.stop();
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

    flashLightTarget.position.x = playerModel.position.x + 10*flashLightDistance * Math.cos(angle);
    flashLightTarget.position.z = playerModel.position.z +10*flashLightDistance * Math.sin(angle);
    flashLightTarget.position.y = 2;
});

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
    }parupdateRunningSound();
});

window.addEventListener('keyup', function(event) {
    switch(event.key) {
        case 'w': moveForward = false; break;
        case 's': moveBackward = false; break;
        case 'a': moveLeft = false; break;
        case 'd': moveRight = false; break;
    }parupdateRunningSound();
});

var playerModelBoundingBox = new THREE.Box3();
var chestsBoundingBoxes = [];
var wallsBoundingBoxes = [];

// Update bounding boxes in the render loop
function updateBoundingBoxes() {
    // Update player's bounding box
    playerModelBoundingBox.setFromObject(playerModel);

    if (paridisioChests && chestsBoundingBoxes.length < 1000) {
        paridisioChests.traverse((child) => {
            if (child.isMesh) {
                const chestBoundingBox = new THREE.Box3().setFromObject(child);
                chestsBoundingBoxes.push(chestBoundingBox);
            }
        });
    }

    if (paridisioWalls && wallsBoundingBoxes.length < 5000) {
        paridisioWalls.traverse((child) => {
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
            if(x<=10 && x>=-10 && z<=10 && z>=-10){
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

    // Check if the player has collided with the wall or a chest, revert position if true
    if (checkChestCollisions() || checkInvisibleWallsCollisions()) {
        playerModel.position.copy(oldPlayerModelPosition);
        camera.position.copy(oldCameraPosition);
        //Play sound when collide with walls
        if (!paradisoWallSound.isPlaying) {
            paradisoWallSound.play();
        }
    
    }else{ // Update minimap
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

window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
});

var flickerTimeout = 0;
var resetLevelTimeout = 10;
var fallingPlayed = false;
var playedDeathPopup = false;

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

    if (darknessTimeout <= 0) {
        
        if(playerFalling){
            fallingPlayer();
            if(!fallingPlayed){
                fallingPlayed = true;
                fallingSound.play();
            }
            if(!playedDeathPopup){
                var deathPopupTimer = null;
                deathPopupTimer = setTimeout(() => {
                    showGameOverScreen();
                    deathPopupSound.play();
                }, 2000);
                playedDeathPopup = true;
            }
        }else{
            showGameOverScreen();
            deathPopupSound.play();
        }
        flashTimeout = 0;
        bounceTimeout = 0;
        resetLevelTimeout -= 0.03;
        itemTextMessage.style.opacity = 0;
        interactMessage.style.opacity = 0;
    }else{
        updatePlayerPosition();
        updateBoundingBoxes();
        checkAtChest();
        checkAtItem();
        parplayObjectSoundIfNearItem();
        parplayChestSoundIfNearChest();
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

    if(skyBox){
        skyBox.position.copy(camera.position);
    }

    requestAnimationFrame(render);
    mapRenderer.render(mapScene, mapCamera);
    renderer.render(scene, camera);
}

// Initial level setup
setupLevel(currentLevel);