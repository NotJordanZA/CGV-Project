import * as THREE from 'three';

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0xDDDDDD, 1);
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();

var aspect = WIDTH / HEIGHT;
var d = 50; // Frustum size (affects the zoom level)
var camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

// Position the camera for an isometric view (45 degrees)
camera.position.set(40, 40, 40); // Adjust these for the desired view
camera.lookAt(0, 0, 0); // Aim the camera at the origin (where the cube is)

// Level Configurations
let currentLevel = 0; // Start at level 0
const levels = [
    {
        levelNumber: 1,
        groundTexture: './assets/cobblestone/diffuse.png',
        cubeColor: 0x0095DD,
        flashLightColor: 0xffe394, // Flashlight color for level 1
        flashLightPower: 5000,
    },
    {
        levelNumber: 2,
        groundTexture: './assets/cobblestone/diffuse.png',
        cubeColor: 0xFFD700,
        flashLightColor: 0x808080, // Flashlight color for level 2
        flashLightPower: 7000,
    },
    {
        levelNumber: 3,
        groundTexture: './assets/cobblestone/diffuse.png',
        cubeColor: 0xADD8E6, // Light blue for Heaven
        flashLightColor: 0xADD8E6, // Flashlight color for level 3
        flashLightPower: 10000,
    },
];

// Function to setup levels
function setupLevel(level) {
    const levelConfig = levels[level];

    // Load the ground texture for this level
    const textureLoader = new THREE.TextureLoader();
    const diffuseTexture = textureLoader.load(levelConfig.groundTexture, (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
    });

    // Update the plane material for this level
    planeMaterial.map = diffuseTexture;
    planeMaterial.needsUpdate = true;

    // Update the cube color for this level
    cube.material.color.setHex(levelConfig.cubeColor);

    // Update flashlight color and power for this level
    flashLight.color.setHex(levelConfig.flashLightColor);
    flashLight.intensity = levelConfig.flashLightPower;
}

// Function to move to the next level
function nextLevel() {
    if (currentLevel < levels.length - 1) {
        currentLevel++;
        setupLevel(currentLevel);
    }
}

// Function to move to the previous level
function previousLevel() {
    if (currentLevel > 0) {
        currentLevel--;
        setupLevel(currentLevel);
    }
}

// Ground (Plane) setup
var planeGeometry = new THREE.PlaneGeometry(100, 100);
var planeMaterial = new THREE.MeshStandardMaterial();
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -10;
plane.receiveShadow = true; // This will receive the shadows
scene.add(plane);

// Cube setup
var boxGeometry = new THREE.BoxGeometry(10, 10, 10);
var phongMaterial = new THREE.MeshPhongMaterial({ color: 0x0095DD });
var cube = new THREE.Mesh(boxGeometry, phongMaterial);
cube.rotation.set(0.0, 0.0, 0);
cube.translateX(0);
scene.add(cube);

// Flashlight setup
var flashGeometry = new THREE.BoxGeometry(1, 2, 1);
var flashHolder = new THREE.Mesh(flashGeometry, phongMaterial);

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

// Movement and control variables
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveSpeed = 0.5;
var flashLightDistance = 10;

window.addEventListener('mousemove', function(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(plane);
    
    if (intersects.length > 0) {
        const point = intersects[0].point;
        flashLightTarget.position.copy(point);

        var dx = point.x - cube.position.x;
        var dz = point.z - cube.position.z;

        var angleRadians = Math.atan2(dz, dx);

        flashHolder.position.x = flashLightDistance * Math.cos(angleRadians);
        flashHolder.position.z = flashLightDistance * Math.sin(angleRadians);
        flashHolder.position.y = 2;
    }
});

window.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'w': moveForward = true; break;
        case 's': moveBackward = true; break;
        case 'a': moveLeft = true; break;
        case 'd': moveRight = true; break;
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

function updatePlayerPosition() {
    if (moveForward) {
        cube.position.z -= moveSpeed;
        camera.position.z -= moveSpeed;
    } 
    if (moveBackward) {
        cube.position.z += moveSpeed;
        camera.position.z += moveSpeed;
    } 
    if (moveLeft) {
        cube.position.x -= moveSpeed;
        camera.position.x -= moveSpeed;
    } 
    if (moveRight) {
        cube.position.x += moveSpeed;
        camera.position.x += moveSpeed;
    }
}

function render() {
    updatePlayerPosition();

    // Check if player moves forward past z = -50 (Next level)
    if (cube.position.z < -50 && currentLevel < levels.length - 1) {
        nextLevel(); // Move to the next level
        cube.position.z = 50; // Reset the cube position for the new level
        camera.position.z = 40; // Reset the camera position
    }

    // Check if player moves backward past z = 50 (Previous level)
    if (cube.position.z > 50 && currentLevel > 0) {
        previousLevel(); // Move to the previous level
        cube.position.z = -50; // Reset the cube position for the previous level
        camera.position.z = 40; // Reset the camera position
    }

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

// Initial level setup
setupLevel(currentLevel);
render();
