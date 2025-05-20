import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set( 15, 12, -15 );
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


function addLight( ...pos ) {
	const light = new THREE.DirectionalLight( 0xFFFFFF, 2 );
	light.position.set( ...pos );
	scene.add( light );
	}

	addLight( 5, 5, 2 );
	addLight( - 5, 5, 5 );
    
const textureLoader = new THREE.TextureLoader();
const planeSize = 40;
const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
const planeMat = new THREE.MeshPhongMaterial( { color: 0x505050 } );
const mesh = new THREE.Mesh( planeGeo, planeMat );
mesh.rotation.x = Math.PI * - .5;
scene.add( mesh );
mesh.position.set( 0, -0.79, 0 ); 
        
const gltfLoader = new GLTFLoader();
const url = 'models/BasicCar.glb';
const textures = textureLoader.load('models/CarTexture.png');
const material = new THREE.MeshStandardMaterial({
    map: textures,
});

const controls = new OrbitControls( camera, renderer.domElement );

const car = new THREE.Group();
gltfLoader.load(url, (gltf) => {
    const model = gltf.scene;
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = material;
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    car.add(model);
    scene.add(car);
});


controls.target.set(car.position.x, car.position.y, car.position.z);
controls.update();

function animate() {
    car.position.z = Math.sin(Date.now() * 0.001) * 2;
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
