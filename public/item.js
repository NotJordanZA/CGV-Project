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
        this.addLight();
        scene.add(this.itemGroup);
    }

    loadModel() {
        const loader = new GLTFLoader();
        this.itemModel;
        loader.load(this.modelPath, (gltf) => {
            this.itemModel = gltf.scene;
            this.itemModel.position.set(0, 0, 0);
            if(this.modelPath.includes("key.glb") || this.modelPath.includes("drop.glb")){
                this.itemModel.scale.set(10, 10, 10);
            }
            if(this.modelPath.includes("scroll.glb")){
                this.itemModel.scale.set(5, 5, 5);
                this.itemModel.translateY(-2);
            }
            if(this.modelPath.includes("knife.glb")){
                this.itemModel.scale.set(20, 20, 20);
                this.itemModel.translateY(-10);
            }
            this.itemGroup.add(this.itemModel);
        }, undefined, (error) => {
            console.error(`Error loading model: ${error}`, this.modelPath);
        });
    }

    addLight() {
        var itemLight = new THREE.PointLight(this.lightColor, 2500);
        this.itemGroup.add(itemLight);
    }
    
    removeThisItem(){
        this.scene.remove(this.itemGroup);
    }

    getDescription(){
        return this.descriptionText;
    }
}