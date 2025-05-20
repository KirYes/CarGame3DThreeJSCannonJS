import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// Create a scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Create a camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set( 15, 12, -15 );

//create a render and add it to the DOM
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//Create and add light function
function addLight( ...pos ) {
	const light = new THREE.DirectionalLight( 0xFFFFFF, 2 );
	light.position.set( ...pos );
	scene.add( light );
	}

	addLight( 5, 5, 2 );
	addLight( - 5, 5, 5 );

// loader for textures    
const textureLoader = new THREE.TextureLoader();

// create a plane(use it like our ground for the car)
const planeSize = 40;
const planeGeometry = new THREE.PlaneGeometry( planeSize, planeSize );
const planeMaterial = new THREE.MeshPhongMaterial( { color: 0x505050 } );
const mesh = new THREE.Mesh( planeGeometry, planeMaterial );
mesh.rotation.x = -Math.PI/2; // initially our plane is rotated 90 degrees so we need to lay it flat
scene.add( mesh );
mesh.position.set( 0, -0.79, 0 ); // set the position of the plane under the car manually idk yet how to do it automatically

// create our model loader(gltf format)
// we use it to load our car model
const gltfLoader = new GLTFLoader();
const url = 'models/BasicCar.glb';

// create a texture loader
// we use it to load our car texture
const textures = textureLoader.load('models/CarTexture.png');
const material = new THREE.MeshStandardMaterial({
    map: textures,
});

//create a control of our camera
// we use it to control the camera with mouse
const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true; // an effect that makes the camera move smoothly
controls.enabled = false;

//create our car object(mesh) as a group
// we use it to group our car model and its children
// so we can move it as a whole
const car = new THREE.Group();

// load our car model and add it to our car object and scene
gltfLoader.load(url, (gltf) => {
    const model = gltf.scene;
    //load the car material
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

// create an array to detect the keys pressed
// we use it to control the car with keyboard
const keysPressed = {};

// add event listeners to detect the keys pressed
window.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});

//define the car variables
let velocity = 0;
let maxSpeed = 0.5;
let acceleration = 0.01;
let friction = 0.02;
let turnSpeed = 0.03;

// also we use it to update the car position and rotation using the keys pressed
function updateCarPosition() {
    if (car){
        if(keysPressed['ArrowUp']){
             velocity = Math.min(velocity + acceleration, maxSpeed);
        }
        else if(keysPressed['ArrowDown']){
             velocity = Math.max(velocity - acceleration, -maxSpeed / 2);
        }
        else {
        if (velocity > 0) velocity = Math.max(velocity - friction, 0);
        else if (velocity < 0) velocity = Math.min(velocity + friction, 0);
        }

     if (keysPressed['ArrowLeft']) car.rotation.y += turnSpeed * (velocity !== 0 ? Math.sign(velocity) : 1);
    else if (keysPressed['ArrowRight']) car.rotation.y -= turnSpeed * (velocity !== 0 ? Math.sign(velocity) : 1);
    car.translateZ(velocity);
    }
}

// and update the camera position and rotation depending on the car position and rotation
function updateCameraPosition() {
    if (!car){
        return;
    }
    const carWorldPos = new THREE.Vector3();
    car.getWorldPosition(carWorldPos);
    const carWorldDir = new THREE.Vector3();
    car.getWorldDirection(carWorldDir);
    const targetPosition = carWorldPos.clone().add(carWorldDir.clone().multiplyScalar(-10).add(new THREE.Vector3(0, 5, 0)));
    camera.position.lerp(targetPosition, 0.1);
    camera.lookAt(car.position);
}

// this function is called every frame
//animate the scene function that renders the scene
// and updates the camera position and car position
// we use requestAnimationFrame to make it smooth
// and to make it run at the same speed as the screen refresh rate
function animate() {
   requestAnimationFrame(animate);
   updateCameraPosition();
   updateCarPosition();
   renderer.render(scene, camera);
}

animate();

// responsive design for canvas
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});