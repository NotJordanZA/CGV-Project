import * as THREE from 'three';
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var renderer = new THREE.WebGLRenderer({antialias:true});
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


const textureLoader = new THREE.TextureLoader();
const diffuseTexture = textureLoader.load('./assets/cobblestone/diffuse.png', (texture) => {
    // Set texture wrapping and repeat for diffuse
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Tile 4 times across the plane
});
const heightTexture = textureLoader.load('./assets/cobblestone/height.png', (texture) => {
    // Set texture wrapping and repeat for height
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Tile 4 times across the plane
});
const normalTexture = textureLoader.load('./assets/cobblestone/normal.png', (texture) => {
    // Set texture wrapping and repeat for normal
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Tile 4 times across the plane
});
const specularTexture = textureLoader.load('/assets/cobblestone/specular.png', (texture) => {
    // Set texture wrapping and repeat for specular
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Tile 4 times across the plane
});


var planeGeometry = new THREE.PlaneGeometry(100, 100);
var planeMaterial = new THREE.MeshStandardMaterial({
    map: diffuseTexture,         // Diffuse texture
    normalMap: normalTexture,    // Normal map for depth details
    displacementMap: heightTexture, // Height map for displacement
    specularMap: specularTexture, // Specular map for shininess
    displacementScale: 5,        // Adjust this value for height effect
});

// var planeMaterial = new THREE.MeshStandardMaterial({ color: 0x0f0f0f });
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = - Math.PI / 2;
plane.position.y = -10;
plane.receiveShadow = true; // This will receive the shadows
scene.add(plane);

var boxGeometry = new THREE.BoxGeometry(10, 10, 10);
var phongMaterial = new THREE.MeshPhongMaterial({
    color: 0x0095DD,
    });
var cube = new THREE.Mesh(boxGeometry, phongMaterial);
cube.rotation.set(0.0, 0.0, 0);
cube.translateX(0);
scene.add(cube);

var flashGeometry = new THREE.BoxGeometry(1, 2, 1);
var flashHolder = new THREE.Mesh(flashGeometry, phongMaterial);
// flashHolder.position.set(15, 4, 0); // Place it 15 units in front of the cube along the X-axis


var flashLight = new THREE.SpotLight(0xffe394, 5000, 0, Math.PI / 4, 1, 2);
flashLight.position.set(0, 0, 0); // Position it at the cube's location
var flasLightBounce = new THREE.PointLight(0xffe394, 100);
flasLightBounce.position.set(0, 0, 0);
flashLight.add(flasLightBounce);

flashHolder.add(flashLight);

// Add a target for the spotlight, the target will follow the mouse
var flashLightTarget = new THREE.Object3D();
scene.add(flashLightTarget);
flashLight.target = flashLightTarget;

// Add the flashLight to the cube so it moves with the cube
// cube.add(flashLight);
cube.add(flashHolder); // Attach it to the cube, so it moves with the cube

// Mouse coordinates to be converted into world space
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();

// Variables to track movement direction
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveSpeed = 0.5; // The speed at which the cube will move

var flashLightDistance = 10;


window.addEventListener('mousemove', function(event) {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Use raycaster to find the point on the plane where the mouse points
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(plane);
    
    if (intersects.length > 0) {
        // Set the flashLight's target position to the intersection point
        const point = intersects[0].point;
        flashLightTarget.position.copy(point);

        var dx = point.x - cube.position.x;
        var dz = point.z - cube.position.z;

        // Calculate the angle in radians (-PI to PI)
        var angleRadians = Math.atan2(dz, dx);

        flashHolder.position.x = flashLightDistance * Math.cos(angleRadians);
        flashHolder.position.z = flashLightDistance * Math.sin(angleRadians);
        flashHolder.position.y = 2;
    }
});

window.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'w': // Move forward
            moveForward = true;
            break;
        case 's': // Move backward
            moveBackward = true;
            break;
        case 'a': // Move left
            moveLeft = true;
            break;
        case 'd': // Move right
            moveRight = true;
            break;
    }
});

window.addEventListener('keyup', function(event) {
    switch(event.key) {
        case 'w': // Stop moving forward
            moveForward = false;
            break;
        case 's': // Stop moving backward
            moveBackward = false;
            break;
        case 'a': // Stop moving left
            moveLeft = false;
            break;
        case 'd': // Stop moving right
            moveRight = false;
            break;
    }
});

function updatePlayerPosition() {
    // Adjust cube's position based on the movement flags
    if (moveForward){
        cube.position.z -= moveSpeed;
        camera.position.z -= moveSpeed;
    } 
    if (moveBackward){
        cube.position.z += moveSpeed;
        camera.position.z += moveSpeed;
    } 
    if (moveLeft){
        cube.position.x -= moveSpeed;
        camera.position.x -= moveSpeed;
    } 
    if (moveRight){
        cube.position.x += moveSpeed;
        camera.position.x += moveSpeed;
    } 
}

var t = 0;
function render() {
    updatePlayerPosition();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
render();