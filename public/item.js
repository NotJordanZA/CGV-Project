import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class item {
    constructor(scene, modelPath, x, y, z, descriptionText, spotlightColor) {
        this.scene = scene;
        this.modelPath = modelPath;
        this.position = new THREE.Vector3(x, y, z);
        this.descriptionText = descriptionText;
        this.spotlightColor = spotlightColor;
        
        this.itemGroup = new THREE.Group(); 
        this.loadModel();
        this.addSpotlight();
        this.itemGroup.position.set(x, y, z);
        scene.add(this.itemGroup);
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.load(this.modelPath, (gltf) => {
            gltf.scene.position.set(0, 0, 0);
            this.itemGroup.add(gltf.scene);
        }, undefined, (error) => {
            console.error(`Error loading model: ${error}`, this.modelPath);
        });
    }

    // const gltfLoader = new GLTFLoader();
    // gltfLoader.load('./assets/level3/cgv-paradisio-map-base-shiny.glb', (gltf) => {
    //     // Add the loaded paridisioMap to the scene
    //     paridisioMap = gltf.scene;
    //     // Position the paridisioMap to the right of the plane
    //     paridisioMap.rotation.y = -Math.PI / 2;
    //     paridisioMap.scale.set(30,30,30);
    //     paridisioMap.position.set(0, -10, 0); // Adjust the position as needed
    //     scene.add(paridisioMap);
    // }, undefined, (error) => {
    //     console.error('An error happened while loading the paridisioMap:', error);
    // });

    addSpotlight() {
        var itemLight = new THREE.SpotLight(this.spotlightColor, 5000, 0, Math.PI / 4, 1, 2);
        itemLight.position.set(0, 15, 0);
        var itemLightTarget = new THREE.Object3D();
        itemLightTarget.position.set(0, 0, 0);
    }
    
    removeItem(){
        this.scene.remove(this.itemGroup);
    }
}