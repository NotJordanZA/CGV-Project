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
// *** Maze Configuration ***
const MAZE_SIZE = 15; 
const CELL_SIZE = 7;  
const WALL_THICKNESS = 0.8;  // Adjusted thickness for smaller spacing
const WALL_HEIGHT = 2;
// Level Configurations
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Black walls
const pathMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff }); // White paths
const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red material for the goal

let currentLevel = 0; // Start at level 0
const levels = [
    {
        levelNumber: 1,
        groundTexture: './assets/cobblestone/diffusered.png',
        groundNormal: './assets/cobblestone/normal.png',
        groundHeight: './assets/cobblestone/height.png',
        groundSpecular: './assets/cobblestone/specular.png',
        cubeColor: 0x0095DD,
        flashLightColor: 0xff8a8a, // Flashlight color for level 1
        flashLightBounceColor: 0xff8a8a,
        flashLightPower: 5000,
    },
    {
        levelNumber: 2,
        groundTexture: './assets/cobblestone/diffuse.png',
        groundNormal: './assets/cobblestone/normal.png',
        groundHeight: './assets/cobblestone/height.png',
        groundSpecular: './assets/cobblestone/specular.png',
        cubeColor: 0xFFD700,
        flashLightColor: 0x808080, // Flashlight color for level 2
        flashLightBounceColor: 0x808080,
        flashLightPower: 7000,
    },
    {
        levelNumber: 3,
        groundTexture: './assets/cobblestone/diffuse.png',
        groundNormal: './assets/cobblestone/normal.png',
        groundHeight: './assets/cobblestone/height.png',
        groundSpecular: './assets/cobblestone/specular.png',
        cubeColor: 0xADD8E6, // Light blue for Heaven
        flashLightColor: 0xADD8E6, // Flashlight color for level 3
        flashLightBounceColor: 0xADD8E6,
        flashLightPower: 10000,
    },
];

function generateMaze(width, height) {
    // Initialize the maze with walls (1)
    const maze = Array.from({ length: height }, () =>
        Array(width).fill(1)
    );

    // Carve paths using recursive backtracking
    function carve(x, y) {
        const directions = [
            [0, 2], [2, 0], [0, -2], [-2, 0]
        ].sort(() => Math.random() - 0.5); // Shuffle directions

        directions.forEach(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;

            if (
                nx > 1 && ny > 1 &&
                nx < width - 2 && ny < height - 2 &&
                maze[ny][nx] === 1 &&
                Math.random() < 0.7// Adjust path density
            ) {
                maze[ny][nx] = 0; // Mark cell as path
                maze[y + dy / 2][x + dx / 2] = 0; // Clear wall between cells
                carve(nx, ny); // Recursive call to carve further
            }
        });
    }
carve(10,8);
    // Ensure all outer borders are filled with walls
    for (let i = 1; i < height-1; i++) {
        maze[i][0] = 0; // Left border
        maze[i][width - 1] = 1; // Right border
    }
    for (let j = 1; j < width-1; j++) {
        maze[0][j] = 1; // Top border
        maze[height - 1][j] = 1; // Bottom border
    }

    // Open the entrance and exit points
  
    maze[height - 2][width - 1] = 0; // Exit at the right edge

    return maze;
}

// Create L-Shaped Wall
function createLShapedWall(x, z) {
    const segment1 = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS);
    const segment2 = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS);

    const wall1 = new THREE.Mesh(segment1, wallMaterial);
    const wall2 = new THREE.Mesh(segment2, wallMaterial);

    wall1.position.set(x, WALL_HEIGHT / 2, z);
    wall2.position.set(x + CELL_SIZE / 2, WALL_HEIGHT / 2, z + CELL_SIZE / 2);
    wall2.rotation.y = Math.PI / 2;

    scene.add(wall1);
    scene.add(wall2);
}

// Create Straight Wall
function createWall(x, z) {
    const geometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS);
    const wall = new THREE.Mesh(geometry, wallMaterial);
    wall.position.set(x, WALL_HEIGHT / 2, z);
    scene.add(wall);
}

// Build Maze with Random Bends
function createMaze(mazeData) {
    const mazeOffsetX = -(MAZE_SIZE * CELL_SIZE) / 2+2;
    const mazeOffsetZ = -(MAZE_SIZE * CELL_SIZE) / 2;

    mazeData.forEach((row, z) => {
        row.forEach((cell, x) => {
            const posX = x * CELL_SIZE + mazeOffsetX;
            const posZ = z * CELL_SIZE + mazeOffsetZ;

            if (cell === 1) {
                const isBend = Math.random() < 0.4; // 40% chance to create L-bend
                if (isBend) {
                    createLShapedWall(posX, posZ);
                } else {
                    createWall(posX, posZ);
                }
            }
        });
    });

    createEntrance(mazeOffsetX, mazeOffsetZ);
    createGoal(mazeOffsetX, mazeOffsetZ);
}

// Entrance
function createEntrance(offsetX, offsetZ) {
    const entrance = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE, 2, CELL_SIZE),
        pathMaterial
    );
    entrance.position.set(offsetX, 1, CELL_SIZE + offsetZ); // Fixed at (0, 1)
    scene.add(entrance);
}

// Goal (Exit)
function createGoal(offsetX, offsetZ) {
    const goal = new THREE.Mesh(
        new THREE.BoxGeometry(CELL_SIZE, 2, CELL_SIZE),
        goalMaterial
    );
    goal.position.set((MAZE_SIZE - 2) * CELL_SIZE + offsetX, 1, (MAZE_SIZE - 2) * CELL_SIZE + offsetZ);
    scene.add(goal);
}

// Setup and Render the Scene
function setupMaze() {
    const mazeData = generateMaze(MAZE_SIZE, MAZE_SIZE);
    createMaze(mazeData);
}

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

    const heightTexture = textureLoader.load(levelConfig.groundHeight, (texture) => {
        // Set texture wrapping and repeat for height
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // Tile 4 times across the plane
    });
    const normalTexture = textureLoader.load(levelConfig.groundNormal, (texture) => {
        // Set texture wrapping and repeat for normal
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // Tile 4 times across the plane
    });
    const specularTexture = textureLoader.load(levelConfig.groundSpecular, (texture) => {
        // Set texture wrapping and repeat for specular
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4); // Tile 4 times across the plane
    });

    // Update the plane material for this level
    planeMaterial.map = diffuseTexture;
    planeMaterial.normalMap = normalTexture;
    planeMaterial.displacementMap = heightTexture;
    planeMaterial.specularMap = specularTexture;
    planeMaterial.displacementScale= 4;
    planeMaterial.needsUpdate = true;

    // Update the cube color for this level
    cube.material.color.setHex(levelConfig.cubeColor);

    // Update flashlight color and power for this level
    flashLight.color.setHex(levelConfig.flashLightColor);
    flashLightBounce.color.setHex(levelConfig.flashLightBounceColor);
    flashLight.intensity = levelConfig.flashLightPower;
    const mazeData = generateMaze(MAZE_SIZE, MAZE_SIZE);
    createMaze(mazeData);
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
var planeGeometry = new THREE.PlaneGeometry(100, 100, 150, 150);
var planeMaterial = new THREE.MeshPhongMaterial();
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
setupMaze();
render();











