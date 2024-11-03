import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class biblicalAngel {
    constructor(scene, startPoint, endPoint) {
        this.scene = scene;
        this.ring1;
        this.ring2;
        this.ring3;
        this.position = startPoint;
        this.angelGroup = new THREE.Group();
        this.angelGroup.position.copy(this.position);
        this.loadModel();
        this.addLight();
        scene.add(this.angelGroup);
        
        // Movement properties
        this.angelDirection = 1;
        this.speed = 0.1;
        this.maxSpeed = 2;
        this.minSpeed = 0.1;
        this.startPoint = startPoint;
        this.endPoint = endPoint;
        this.acceleration = 0.05;
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.load("./assets/level3/biblicalAngel.glb", (gltf) => {
            this.ring1 = gltf.scene;
            this.ring2 = gltf.scene.clone();
            this.ring3 = gltf.scene.clone();

            this.ring1.position.set(0, 7, 0);
            this.ring1.scale.set(16, 16, 16);

            this.ring2.position.set(0, 7, 0);
            this.ring2.rotation.set(45, 45, 45);
            this.ring2.scale.set(14, 14, 14);

            this.ring3.position.set(0, 7, 0);
            this.ring3.rotation.set(90, 90, 90);
            this.ring3.scale.set(10, 10, 10);

            this.angelGroup.add(this.ring1);
            this.angelGroup.add(this.ring2);
            this.angelGroup.add(this.ring3);
        }, undefined, (error) => {
            console.error(`Error loading model: ${error}`, this.modelPath);
        });
    }

    addLight() {
        var angelLight = new THREE.PointLight(0xb8860b, 3000);
        angelLight.translateY(7);
        angelLight.castShadow = true;
        this.angelGroup.add(angelLight);
    }

    rotateRings(){
        if (this.ring1 && this.ring2 ) {  
            this.ring1.rotation.x += 0.01;
            this.ring1.rotation.y += 0.01;
            this.ring1.rotation.z += 0.025;
            
            this.ring2.rotation.x += 0.01;
            this.ring2.rotation.y += 0.01;
            this.ring2.rotation.z += 0.01;

            this.ring3.rotation.x += 0.025;
            this.ring3.rotation.y += 0.01;
            this.ring3.rotation.z += 0.01;
        }
    }

    moveAngel() {
        const targetPoint = this.angelDirection === 1 ? this.endPoint : this.startPoint;
        const directionVector = new THREE.Vector3().subVectors(targetPoint, this.angelGroup.position).normalize();
    
        const distanceToBoundary = this.angelGroup.position.distanceTo(targetPoint);

        if (distanceToBoundary < 50) {
            this.speed = this.minSpeed + (this.maxSpeed - this.minSpeed) * (distanceToBoundary / 50);
        } else if (this.speed < this.maxSpeed) {
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        }

        this.angelGroup.position.add(directionVector.multiplyScalar(this.speed));
        
        if (distanceToBoundary < this.speed) {
            this.angelDirection *= -1;
            this.speed = this.minSpeed;
        }
    }

    checkAtAngel(x, z) {
        var distance = Math.sqrt(Math.pow(this.angelGroup.position.x - x, 2) + Math.pow(this.angelGroup.position.z - z, 2));
    
        if (distance <= 20) { 
            return true;
        }else{
            return false;
        }
    }
    
    removeAngel() {
        this.scene.remove(this.angelGroup);
    }
}
