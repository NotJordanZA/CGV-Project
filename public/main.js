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

    //Reset cube and camera
    cube.position.set(0,0,0);
    camera.position.set(40, 40, 40); // Adjust these for the desired view
    camera.lookAt(0, 0, 0); // Aim the camera at the origin (where the cube is)
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

// Create additional planes with identical properties
// var plane2 = new THREE.Mesh(planeGeometry, planeMaterial.clone()); // Clone the material
// plane2.rotation.x = -Math.PI / 2;
// plane2.position.set(0, -10, -100); // Position the second plane 100 units behind the original
// plane2.receiveShadow = true; // This will receive the shadows
// scene.add(plane2);

// var plane3 = new THREE.Mesh(planeGeometry, planeMaterial.clone()); // Clone the material again
// plane3.rotation.x = -Math.PI / 2;
// plane3.position.set(0, -10, -200); // Position the third plane 200 units behind the original
// plane3.receiveShadow = true; // This will receive the shadows
// scene.add(plane3);

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

// Cube and movement settings
const cubeSize = 10; // Assuming the cube is 10x10x10
const halfCubeSize = cubeSize / 2;
// var movementRaycaster = new THREE.Raycaster();
// var rayDirection = new THREE.Vector3(0, -1, 0);

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

// Create a raycaster instance
// var movementRaycaster = new THREE.Raycaster();
// var rayDirection = new THREE.Vector3();

// function updatePlayerPosition() {
//     const moveDistance = moveSpeed; // Set the movement distance for each key press
//     let proposedPosition = new THREE.Vector3(); // To store the next proposed position

//     // Raycast forward (negative z direction)
//     if (moveForward) {
//         proposedPosition.copy(cube.position).add(new THREE.Vector3(0, 0, -moveDistance));
//         rayDirection.set(0, -1, 0); // Raycast downward to check the ground
//         movementRaycaster.set(proposedPosition, rayDirection);

//         const intersects = movementRaycaster.intersectObject(plane);
//         if (intersects.length > 0) {
//             cube.position.copy(proposedPosition); // Move if there's an intersection with the ground
//             camera.position.z -= moveSpeed;
//         }
//     }
//     // Raycast backward (positive z direction)
//     if (moveBackward) {
//         proposedPosition.copy(cube.position).add(new THREE.Vector3(0, 0, moveDistance));
//         rayDirection.set(0, -1, 0);
//         movementRaycaster.set(proposedPosition, rayDirection);

//         const intersects = movementRaycaster.intersectObject(plane);
//         if (intersects.length > 0) {
//             cube.position.copy(proposedPosition);
//             camera.position.z += moveSpeed;
//         }
//     }
//     // Raycast left (negative x direction)
//     if (moveLeft) {
//         proposedPosition.copy(cube.position).add(new THREE.Vector3(-moveDistance, 0, 0));
//         rayDirection.set(0, -1, 0);
//         movementRaycaster.set(proposedPosition, rayDirection);

//         const intersects = movementRaycaster.intersectObject(plane);
//         if (intersects.length > 0) {
//             cube.position.copy(proposedPosition);
//             camera.position.x -= moveSpeed;
//         }
//     }
//     // Raycast right (positive x direction)
//     if (moveRight) {
//         proposedPosition.copy(cube.position).add(new THREE.Vector3(moveDistance, 0, 0));
//         rayDirection.set(0, -1, 0);
//         movementRaycaster.set(proposedPosition, rayDirection);

//         const intersects = movementRaycaster.intersectObject(plane);
//         if (intersects.length > 0) {
//             cube.position.copy(proposedPosition);
//             camera.position.x += moveSpeed;
//         }
//     }
// }

// Create the downward raycaster object (for checking if the cube remains on the plane)
// var downwardRaycaster = new THREE.Raycaster();
// var downDirection = new THREE.Vector3(0, -1, 0); // Ray pointing down (towards the plane)

// // Function to check if the cube is still on the plane by casting a ray downward
// function isCubeOnPlane(cube) {
//     // Set raycaster position to the cube's position and cast downward
//     downwardRaycaster.set(cube.position, downDirection);

//     // Check for intersections with the plane
//     const intersects = downwardRaycaster.intersectObject(plane);

//     // Return true if an intersection with the plane is found (the cube is on the plane)
//     return intersects.length > 0;
// }

// function updatePlayerPosition() {
//     const moveDistance = moveSpeed; // Set the movement distance for each key press
//     let proposedPosition = new THREE.Vector3(); // To store the next proposed position

//     // Move forward (negative z direction)
//     if (moveForward) {
//         proposedPosition.copy(cube.position).add(new THREE.Vector3(0, 0, -moveDistance));
//         cube.position.copy(proposedPosition);

//         // If the cube is not on the plane after the move, undo the movement
//         if (!isCubeOnPlane(cube)) {
//             cube.position.z += moveDistance; // Revert the position
//         } else {
//             camera.position.z -= moveSpeed;
//         }
//     }
//     // Move backward (positive z direction)
//     if (moveBackward) {
//         proposedPosition.copy(cube.position).add(new THREE.Vector3(0, 0, moveDistance));
//         cube.position.copy(proposedPosition);

//         if (!isCubeOnPlane(cube)) {
//             cube.position.z -= moveDistance; // Revert the position
//         } else {
//             camera.position.z += moveSpeed;
//         }
//     }
//     // Move left (negative x direction)
//     if (moveLeft) {
//         proposedPosition.copy(cube.position).add(new THREE.Vector3(-moveDistance, 0, 0));
//         cube.position.copy(proposedPosition);

//         if (!isCubeOnPlane(cube)) {
//             cube.position.x += moveDistance; // Revert the position
//         } else {
//             camera.position.x -= moveSpeed;
//         }
//     }
//     // Move right (positive x direction)
//     if (moveRight) {
//         proposedPosition.copy(cube.position).add(new THREE.Vector3(moveDistance, 0, 0));
//         cube.position.copy(proposedPosition);

//         if (!isCubeOnPlane(cube)) {
//             cube.position.x -= moveDistance; // Revert the position
//         } else {
//             camera.position.x += moveSpeed;
//         }
//     }
// }

// function updatePlayerPosition() {
//     const moveDistance = moveSpeed; // Set the movement distance for each key press
//     let proposedPosition = new THREE.Vector3(); // To store the next proposed position

//     // Helper function to check for intersection
//     function canMoveToPosition(newPosition) {
//         // Array to store the cube's corner positions for raycasting
//         const cubeCorners = [
//             new THREE.Vector3(newPosition.x + halfCubeSize, newPosition.y, newPosition.z + halfCubeSize),
//             new THREE.Vector3(newPosition.x + halfCubeSize, newPosition.y, newPosition.z - halfCubeSize),
//             new THREE.Vector3(newPosition.x - halfCubeSize, newPosition.y, newPosition.z + halfCubeSize),
//             new THREE.Vector3(newPosition.x - halfCubeSize, newPosition.y, newPosition.z - halfCubeSize),
//         ];
    
//         // Check if all four corners of the cube intersect the plane
//         for (let i = 0; i < cubeCorners.length; i++) {
//             const corner = cubeCorners[i];
//             movementRaycaster.set(corner.clone().setY(corner.y + 5), rayDirection); // Ray starts slightly above the cube corner
//             const intersects = movementRaycaster.intersectObject(plane); // Check intersection with the plane
    
//             if (intersects.length === 0) {
//                 // If any corner doesn't intersect the plane, movement isn't allowed
//                 return false;
//             }
//         }
        
//         return true; // All corners intersected the plane, movement is allowed
//     }

//     // Move forward (negative z direction)
//     if (moveForward) {
//         proposedPosition.copy(cube.position).add(new THREE.Vector3(0, 0, -moveDistance));
//         if (canMoveToPosition(proposedPosition)) {
//             cube.position.copy(proposedPosition);
//             camera.position.z -= moveSpeed;
//         }
//     }
//     // Move backward (positive z direction)
//     if (moveBackward) {
//         proposedPosition.copy(cube.position).add(new THREE.Vector3(0, 0, moveDistance));
//         if (canMoveToPosition(proposedPosition)) {
//             cube.position.copy(proposedPosition);
//             camera.position.z += moveSpeed;
//         }
//     }
//     // Move left (negative x direction)
//     if (moveLeft) {
//         proposedPosition.copy(cube.position).add(new THREE.Vector3(-moveDistance, 0, 0));
//         if (canMoveToPosition(proposedPosition)) {
//             cube.position.copy(proposedPosition);
//             camera.position.x -= moveSpeed;
//         }
//     }
//     // Move right (positive x direction)
//     if (moveRight) {
//         proposedPosition.copy(cube.position).add(new THREE.Vector3(moveDistance, 0, 0));
//         if (canMoveToPosition(proposedPosition)) {
//             cube.position.copy(proposedPosition);
//             camera.position.x += moveSpeed;
//         }
//     }
// }

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

// Listen for level-related keypress events
window.addEventListener('keydown', function(event) {
    switch(event.key) {
      case '1':
        setupLevel(0);
        break;
      case '2':
        setupLevel(1);
        break;
      case '3':
        setupLevel(2);
        break;
      default:
        console.log('Invalid key. Press 1, 2, or 3 to select a level.');
    }
  });

function render() {
    updatePlayerPosition();

    // Check if player moves forward past z = -50 (Next level)
2

    // Check if player moves backward past z = 50 (Previous level)
    // if (cube.position.z > 50 && currentLevel > 0) {
    //     previousLevel(); // Move to the previous level
    //     cube.position.z = -50; // Reset the cube position for the previous level
    //     camera.position.z = 40; // Reset the camera position
    // }

    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

// Initial level setup
setupLevel(currentLevel);
render();
