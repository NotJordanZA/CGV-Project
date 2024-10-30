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
let initialCubePosition = new THREE.Vector3(0, 0, 0);
let initialCameraPosition = new THREE.Vector3(40, 40, 40);
var atChest = false;
var atItem = false;
var playerItemCount = 0;
var itemCount;
var playerFalling = false;
var darknessTimeout = 100;
// var items = [
//     {x: 125, z: 300},
//     {x: -420, z: -238},
//     {x: 55, z: -350},
// ];
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
    // Reset cube position
    cube.position.copy(initialCubePosition);
    
    // Reset camera position
    camera.position.copy(initialCameraPosition);
    camera.lookAt(0, 0, 0); 
    flashTimeout = 5000;
    bounceTimeout = 100;
    darknessTimeout = 100;
    paridisioMap.visible = true;
    paridisioMapTrapped.visible = false;
    mapScene.clear();
    gameOverMessage.style.opacity = 0;

    vignette.style.opacity = 0;

    setupLevel(currentLevel);
    console.log("Level reset to its original configuration.");
}

// Function to setup levels
function setupLevel(level) {
    const levelConfig = levels[level];
    mapScene.add(pathLine);
    // Load the ground texture for this level

    // Update the cube color for this level
    cube.material.color.setHex(levelConfig.cubeColor);

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

// Function to move to the specified level
function goToLevel(level) {
    if (level >= 0 && level < levels.length) {
        currentLevel = level;
        setupLevel(currentLevel);
        cube.position.set(0, 0, 0); // Reset the cube position for the new level
        camera.position.set(40, 40, 40); // Reset the camera position
    }
}

// Ground (Plane) setup
var planeGeometry = new THREE.PlaneGeometry(100, 100, 150, 150);
var planeMaterial = new THREE.MeshPhongMaterial();
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -10;
plane.receiveShadow = true; // This will receive the shadows
// if (currentLevel !== 0){
//     scene.add(plane);
// }

let paridisioMap;
let paridisioMapTrapped;
let paridisioChests;
let paridisioWalls;
let paridisioWallsBoundingBox;


if (currentLevel == 2) {
    applyLevel3Lighting(scene);
    itemCount = 3;
    // scene.background = new THREE.Color(0x333333);
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('./assets/level3/cgv-paradisio-map-base-shiny.glb', (gltf) => {
        // Add the loaded paridisioMap to the scene
        paridisioMap = gltf.scene;
        // Position the paridisioMap to the right of the plane
        paridisioMap.rotation.y = -Math.PI / 2;
        paridisioMap.scale.set(30,30,30);
        paridisioMap.position.set(0, -10, 0); // Adjust the position as needed
        scene.add(paridisioMap);
    }, undefined, (error) => {
        console.error('An error happened while loading the paridisioMap:', error);
    });
    gltfLoader.load('./assets/level3/cgv-paradisio-map-base-trapped.glb', (gltf) => {
        // Add the loaded paridisioMap to the scene
        paridisioMapTrapped = gltf.scene;
        // Position the paridisioMap to the right of the plane
        paridisioMapTrapped.rotation.y = -Math.PI / 2;
        paridisioMapTrapped.scale.set(30,30,30);
        paridisioMapTrapped.position.set(0, -10, 0); // Adjust the position as needed
        paridisioMapTrapped.visible = false;
        scene.add(paridisioMapTrapped);
    }, undefined, (error) => {
        console.error('An error happened while loading the paridisioMap:', error);
    });
    gltfLoader.load('./assets/level3/cgv-paradisio-map-chests.glb', (gltf) => {
        // Add the loaded paridisioMap to the scene
        paridisioChests = gltf.scene;
        // Position the paridisioMap to the right of the plane
        paridisioChests.rotation.y = -Math.PI / 2;
        paridisioChests.scale.set(30,30,30);
        paridisioChests.position.set(0, -10, 0); // Adjust the position as needed
        scene.add(paridisioChests);
    }, undefined, (error) => {
        console.error('An error happened while loading the paridisioMap:', error);
    });
    gltfLoader.load('./assets/level3/cgv-heaven-walls.glb', (gltf) => {
        paridisioWalls = gltf.scene;
        paridisioWalls.rotation.y = -Math.PI / 2;
        paridisioWalls.scale.set(30,30,30);
        paridisioWalls.position.set(2, -10, 2); // Adjust the position as needed
        paridisioWallsBoundingBox = new THREE.Box3().setFromObject(paridisioWalls);
    }, undefined, (error) => {
        console.error('An error happened while loading the paridisioMap:', error);
    });

    // Chest light setup
    for(i = 0; i < chests.length; i++){
        var chestLight  = new THREE.PointLight(0xb8860b, 2000);
        chestLight.position.set(chests[i].x, 15,  chests[i].z);
        scene.add(chestLight);
    }
   
    //item setup
    // var boxGeometry = new THREE.BoxGeometry(10, 10, 10);
    // var phongMaterial = new THREE.MeshPhongMaterial({ color: 0xffe600 });
    // var item1 = new THREE.Mesh(boxGeometry, phongMaterial);
    // item1.rotation.set(0, 0, 45);
    // item1.position.set(items[0].x, 0, items[0].z);

    // var item1Light = new THREE.SpotLight(0xffe600, 5000, 0, Math.PI / 4, 1, 2);
    // item1Light.position.set(items[0].x, 15, items[0].z);
    // var item1LightTarget = new THREE.Object3D();
    // item1LightTarget.position.set(items[0].x, 0, items[0].z);

    // var item2 = new THREE.Mesh(boxGeometry, phongMaterial);
    // item2.rotation.set(0, 0, 45);
    // item2.material.color.setHex(0x0051ff);
    // item2.position.set(items[1].x, 0, items[1].z);

    // var item2Light = new THREE.SpotLight(0x0051ff, 5000, 0, Math.PI / 4, 1, 2);
    // item2Light.position.set(items[1].x, 15, items[1].z);
    // var item2LightTarget = new THREE.Object3D();
    // item2LightTarget.position.set(items[1].x, 0, items[1].z);

    // var item3 = new THREE.Mesh(boxGeometry, phongMaterial);
    // item3.rotation.set(0, 0, 45);
    // item3.material.color.setHex(0xbf00ff);
    // item3.position.set(items[2].x, 0, items[2].z);

    // var item3Light = new THREE.SpotLight(0xbf00ff, 5000, 0, Math.PI / 4, 1, 2);
    // item3Light.position.set(items[2].x, 15, items[2].z);
    // var item3LightTarget = new THREE.Object3D();
    // item3LightTarget.position.set(items[2].x, 0, items[2].z);
    
    // scene.add(item1);
    // scene.add(item1Light);
    // scene.add(item1LightTarget);
    // item1Light.target = item1LightTarget;

    // scene.add(item2);
    // scene.add(item2Light);
    // scene.add(item2LightTarget);
    // item2Light.target = item2LightTarget;

    // scene.add(item3);
    // scene.add(item3Light);
    // scene.add(item3LightTarget);
    // item3Light.target = item3LightTarget;

    const directionalLight = new THREE.DirectionalLight( 0xffffff, 20 );
    directionalLight.position.set(-1000, 100, -1000);
    directionalLight.castShadow = true;
    scene.add( directionalLight );
    const light = new THREE.AmbientLight( 0x404040 ); // soft white light
    scene.add( light );

    const skyBoxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);

// Load each texture for each side of the cube
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
        // material.map.wrapS = THREE.ClampToEdgeWrapping;
        // material.map.wrapT = THREE.ClampToEdgeWrapping;
        material.map.minFilter = THREE.LinearFilter;
    }
});

// Combine the materials into a single cube mesh
skyBox = new THREE.Mesh(skyBoxGeometry, materials);

// Add the cube to the scene
scene.add(skyBox);
}

// Cube setup
var boxGeometry = new THREE.BoxGeometry(8, 8, 8);
var phongMaterial = new THREE.MeshPhongMaterial({ color: 0x0095DD });
var cube = new THREE.Mesh(boxGeometry, phongMaterial);
cube.translateY(-5);
scene.add(cube);

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

cube.add(flashHolder); // Attach it to the cube

// Check if player is near chest
function checkAtChest() {
    if (currentLevel == 2) {
        var x = cube.position.x;
        var z = cube.position.z;

        atChest = false; // Reset before loop

        for (var i = 0; i < chests.length; i++) {
            var distance = Math.sqrt(Math.pow(chests[i].x - x, 2) + Math.pow(chests[i].z - z, 2));

            if (distance <= 30) { // Increase distance threshold for testing
                atChest = true;
                break;
            }
        }

    }
}


// Check if player is near item
function checkAtItem() {
    if (currentLevel == 2) {
        var x = cube.position.x;
        var z = cube.position.z;

        atItem = false; // Reset before loop

        for (var i = 0; i < items.length; i++) {
            var distance = Math.sqrt(Math.pow(items[i].x - x, 2) + Math.pow(items[i].z - z, 2));
            // console.log("Item ", i, " distance:", distance);
            if (distance <= 30) { // Increase distance threshold for testing
                atItem = true;
                return items[i];
            }
        }
     
    }
}

function removeItem(item){
    if(item.x === items[0].position.x  && item.z === items[0].position.z){
        // scene.remove(item1);
        // scene.remove(item1Light);
        // scene.remove(item1LightTarget);
        items[0].removeItem();
    }else if(item.x === items[1].position.x  && item.z === items[1].position.z){
        items[1].removeItem();
    }else if(item.x === items[2].position.x  && item.z === items[2].position.z){
        items[2].removeItem();
    }
    displayItemMessage(item);
}

var moveTimer = null;
function displayItemMessage(item) {
    if(item.x === items[0].position.x  && item.z === items[0].position.z){
        itemTextMessage.innerText = items[0].descriptionText; 
    }else if(item.x === items[1].position.x  && item.z ===items[1].position.z){
        itemTextMessage.innerText = items[1].descriptionText; ; 
    }else if(item.x === items[2].position.x && item.z === items[2].position.z){
        itemTextMessage.innerText = items[2].descriptionText; 
    }
    itemTextMessage.style.opacity = 1;  
    items=items.filter(element=>element!==item);
    if (moveTimer) {
        clearTimeout(moveTimer);
    }

    moveTimer = setTimeout(() => {
        itemTextMessage.style.opacity = 0; 
    }, 10000);
}

function fallingPlayer(){
    console.log("falling");
    cube.translateY(-1);
}

function interactWithObject(){
    if(atChest){
        paridisioMap.visible = false;
        paridisioMapTrapped.visible = true;
        darknessTimeout = 0;
        playerFalling = true;
    }else if(atItem){
        playerItemCount++;
        removeItem(checkAtItem());
    }
}

// Movement and control variables
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveSpeed = 4;
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

var cubeBoundingBox = new THREE.Box3().setFromObject(cube);
var chestsBoundingBoxes = [];
var wallsBoundingBoxes = [];

// Update bounding boxes in the render loop
function updateBoundingBoxes() {
    // Update player's bounding box
    cubeBoundingBox.setFromObject(cube);

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
    if (checkChestCollisions() || checkInvisibleWallsCollisions()) {
        // If collided, revert to the previous position
        // console.log("I ams stuck");
        cube.position.copy(oldCubePosition);
        camera.position.copy(oldCameraPosition);
    }else{
        updatePathTrail();
    }
}

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

var flickerTimeout = 0;
var resetLevelTimeout = 10;

function render() {
    updatePlayerPosition();
    updateBoundingBoxes();
    checkAtChest();
    checkAtItem();
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
        showGameOverScreen();
        if(playerFalling){
            fallingPlayer();
        }
        flashTimeout = 0;
        bounceTimeout = 0;
        resetLevelTimeout -= 0.03;
    }

    if(resetLevelTimeout <= 0){
        resetLevelTimeout = 10;
        resetLevel();
    }

    // items[0].rotation.y+=0.025;
    // items[1].rotation.y+=0.025;
    // items[2].rotation.y+=0.025;

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
render();