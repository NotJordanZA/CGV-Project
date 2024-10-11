import * as THREE from 'three';
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0xDDDDDD, 1);
document.body.appendChild(renderer.domElement);

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(70, WIDTH/HEIGHT);
camera.position.z = 50;
scene.add(camera);

const light = new THREE.PointLight(0xffffff, 100);
light.position.set(-10, 5, 10);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight( 0xffffff, 5 );
scene.add( directionalLight );



var boxGeometry = new THREE.BoxGeometry(10, 10, 10);
var phongMaterial = new THREE.MeshPhongMaterial({
    color: 0x0095DD,
    roughness: 0.2,
    metalness: 2
    });
var cube = new THREE.Mesh(boxGeometry, phongMaterial);
cube.rotation.set(0.4, 0.2, 0);
cube.translateX(10);
scene.add(cube);

var torusGeometry = new THREE.TorusGeometry(7, 1, 18, 8);
var phongMaterial = new THREE.MeshPhongMaterial({ color: 0xff9500 });
var torus = new THREE.Mesh(torusGeometry, phongMaterial);
torus.translateX(-10);
scene.add(torus);

var t = 0;
function render() {
    t += 0.01;
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    torus.rotation.x = (Math.sin(t));
    torus.rotation.y = (2*Math.cos(t));
    torus.rotation.z = Math.tan(t);
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}
render();