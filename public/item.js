import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class item {
    constructor(scene, modelPath, x, y, z, descriptionText, lightColor) {
        this.scene = scene;
        this.modelPath = modelPath;
        this.position = new THREE.Vector3(x, y, z);
        this.descriptionText = descriptionText;
        this.lightColor = lightColor;
        
        this.itemGroup = new THREE.Group(); 
        this.itemGroup.position.set(x, y, z);
        this.loadModel();
        this.addSpotlight();
        scene.add(this.itemGroup);
    }

    loadModel() {
        const loader = new GLTFLoader();
        this.itemModel;
        loader.load(this.modelPath, (gltf) => {
            this.itemModel = gltf.scene;
            this.itemModel.position.set(0, 0, 0);
            if(this.modelPath === "./assets/level3/key.glb" || this.modelPath === "./assets/level3/drop.glb"){
                this.itemModel.scale.set(10, 10, 10);
            }
            this.itemGroup.add(this.itemModel);
        }, undefined, (error) => {
            console.error(`Error loading model: ${error}`, this.modelPath);
        });
    }

    addSpotlight() {
        // var itemLight = new THREE.SpotLight(this.spotlightColor, 20000, 0, Math.PI / 4, 1, 2);
        var itemLight = new THREE.PointLight(this.lightColor, 2500);
        // var itemLightTarget = new THREE.Object3D();
        this.itemGroup.add(itemLight);
        // itemLight
        // itemLight.position.set(0, 15, 0);
        // itemLightTarget.position.set(0, 0, 0);
        // itemLight.target = itemLightTarget;
    }
    
    removeThisItem(){
        this.scene.remove(this.itemGroup);
    }

    getDescription(){
        return this.descriptionText;
    }
}