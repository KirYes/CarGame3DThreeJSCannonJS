import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as CANNON from 'cannon-es';

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

// create our world for physics
const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });

// loader for textures    
const textureLoader = new THREE.TextureLoader();


// create a plane(use it like our ground for the car)
const planeSize = 40;
// create a plane shape and add it to the world for physics
const terrainShape = new CANNON.Box(new CANNON.Vec3(planeSize/2, 0.5, planeSize/2));
const terrainBody = new CANNON.Body({ mass: 0 });
terrainBody.addShape(terrainShape);
terrainBody.position.set(0, 0, 0);
world.addBody(terrainBody);
// create a plane mesh and add it to the scene for rendering
const groundMesh = new THREE.Mesh(
    new THREE.BoxGeometry(planeSize, 0.5, planeSize),
    new THREE.MeshStandardMaterial({ color: 0x505050 })
);
groundMesh.position.copy(terrainBody.position);
scene.add(groundMesh);

// create a ramp shape and add it to the world for physics
const rampShape = new CANNON.Box(new CANNON.Vec3(5/2, 0.5, 10/2));
const rampBody = new CANNON.Body({ mass: 0 });
rampBody.addShape(rampShape);
rampBody.position.set(0, 2, 25);
rampBody.quaternion.setFromEuler(-Math.PI / 8, 0, 0);
world.addBody(rampBody);

// create a ramp mesh and add it to the scene for rendering
const rampMesh = new THREE.Mesh(
    new THREE.BoxGeometry(5, 0.5, 10),
    new THREE.MeshStandardMaterial({ color: 0x996633 })
);
rampMesh.position.copy(rampBody.position);
rampMesh.quaternion.copy(rampBody.quaternion);
scene.add(rampMesh);

// create a obstacle function
// const obstacleMaterial = new THREE.MeshStandardMaterial({
//     color: 0xFF0000,
//     roughness: 0.5,
// });
// const obstacles = [];
// function createObstacle(x, z) {
// const box = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 1), obstacleMaterial);
// box.position.set(x, 1, z);
// box.castShadow = true;
// scene.add(box);
// obstacles.push(box);
// }
// createObstacle(5, 5);
// createObstacle(-5, -5);
// createObstacle(15, -12);

//function for interacting with the objects
// function checkColission(){
//     if(!car){
//         return
//     }
//     const carBox = new THREE.Box3().setFromObject(car);
//     for(let obstacle of obstacles){
//         const obsBox= new THREE.Box3().setFromObject(obstacle);
//         if(carBox.intersectsBox(obsBox)){
           
//         break;
//         }
//     }
// }

// create our model loader(gltf format)
// we use it to load our car model
const gltfLoader = new GLTFLoader();
const url = 'models/4.glb';

// create a texture loader
// we use it to load our car texture
const textures = textureLoader.load('models/CarTexture.png');
const material = new THREE.MeshStandardMaterial({
    map: textures
});


//create a control of our camera
// we use it to control the camera with mouse
// const controls = new OrbitControls( camera, renderer.domElement );
// controls.enableDamping = true; // an effect that makes the camera move smoothly
// controls.enabled = false;

//create our car object(mesh) as a group
// we use it to group our car model and its children
// so we can move it as a whole
const car = new THREE.Group();
let vehicle, chassisBody;
const wheelVisuals = [];

gltfLoader.load(url, (gltf) => {
    const model = gltf.scene;
    const wheels = [];
      const frontWheelL = model.getObjectByName('FrontWheelL');
    const frontWheelR = model.getObjectByName('FrontWheelR');
    const backWheelL = model.getObjectByName('BackWheelL');
    const backWheelR = model.getObjectByName('BackWheelR');
    wheels.push(frontWheelL, frontWheelR, backWheelL, backWheelR);
    backWheelL.parent.remove(backWheelL);
    backWheelR.parent.remove(backWheelR);
    frontWheelL.parent.remove(frontWheelL);
    frontWheelR.parent.remove(frontWheelR);
    // backWheelGroup.parent.remove(backWheelR);
    //load the car material
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = material;
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    car.add(model);
    car.position.set(0, 2, 0);
    car.rotation.set(0, 0, 0);
    scene.add(car);

    const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.5, 2));
    chassisBody = new CANNON.Body({ mass: 150 });
    chassisBody.addShape(chassisShape);
    chassisBody.position.set(0, 2, 0);
    world.addBody(chassisBody);

    // Setup vehicle
    vehicle = new CANNON.RaycastVehicle({
        chassisBody,
        indexRightAxis: 0,
        indexUpAxis: 1,
        indexForwardAxis: 2,
    });

    const wheelOptions = {
        radius: 0.4,
        directionLocal: new CANNON.Vec3(0, -1, 0),
        suspensionStiffness: 30,
        suspensionRestLength: 0.3,
        frictionSlip: 5,
        dampingRelaxation: 2.3,
        dampingCompression: 4.4,
        maxSuspensionForce: 100000,
        rollInfluence: 0.01,
        axleLocal: new CANNON.Vec3(-1, 0, 0),
        chassisConnectionPointLocal: new CANNON.Vec3(),
        maxSuspensionTravel: 0.3,
        customSlidingRotationalSpeed: -30,
        useCustomSlidingRotationalSpeed: true,
    };

       wheels.forEach((wheel) => {
        const worldPos = new THREE.Vector3();
        wheel.getWorldPosition(worldPos);
        model.worldToLocal(worldPos); // convert to local model space
        const localPos = new CANNON.Vec3(worldPos.x, worldPos.y+2.23, worldPos.z);
        wheelOptions.chassisConnectionPointLocal = localPos.clone();
        vehicle.addWheel(wheelOptions);
    });

    vehicle.addToWorld(world);

    for(let i=0; i<vehicle.wheelInfos.length; i++){
      const wheelMesh = wheels[i].clone();
        scene.add(wheelMesh);
        wheelVisuals.push(wheelMesh);
    };
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
//  let velocity = 0;
// let maxSpeed = 0.5;
// let acceleration = 0.01;
// let friction = 0.02;
// let turnSpeed = 0.03;

// // also we use it to update the car position and rotation using the keys pressed
// function updateCarPosition() {
//     if (car) {
//         if(keysPressed['ArrowUp']){
//             velocity = Math.min(velocity + acceleration, maxSpeed);
//         }
//         else if(keysPressed['ArrowDown']){
//             velocity = Math.max(velocity - acceleration, -maxSpeed / 2);
//         }
//         else {
//             if (velocity > 0) velocity = Math.max(velocity - friction, 0);
//             else if (velocity < 0) velocity = Math.min(velocity + friction, 0);
//         }

//         if (keysPressed['ArrowLeft']) car.rotation.y += turnSpeed * (velocity !== 0 ? Math.sign(velocity) : 1);
//         else if (keysPressed['ArrowRight']) car.rotation.y -= turnSpeed * (velocity !== 0 ? Math.sign(velocity) : 1);
        
//        car.translateZ(velocity);
//     }
// }

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

function handleVehicleControls() {
    if (!vehicle) return;

    const maxForce = 500;
    const brakeForce = 1100;


    for (let i = 0; i < 4; i++) {
        vehicle.setBrake(0, i);
    }

    if (keysPressed['ArrowUp']) {
        vehicle.applyEngineForce(-maxForce, 2);
    } else if (keysPressed['ArrowDown']) {
        vehicle.applyEngineForce(maxForce, 2);
    } else {
        vehicle.applyEngineForce(0, 2);
    }

    if (keysPressed['ArrowLeft']) {
        vehicle.setSteeringValue(0.5, 0);
        vehicle.setSteeringValue(0.5, 1);
    } else if (keysPressed['ArrowRight']) {
        vehicle.setSteeringValue(-0.5, 0);
        vehicle.setSteeringValue(-0.5, 1);
    } else {
        vehicle.setSteeringValue(0, 0);
        vehicle.setSteeringValue(0, 1);
    }

}
// this function is called every frame
//animate the scene function that renders the scene
// and updates the camera position and car position
// we use requestAnimationFrame to make it smooth
// and to make it run at the same speed as the screen refresh rate
const clock = new THREE.Clock();
let lastTime;
function animate(time) {
   requestAnimationFrame(animate);
    const delta = lastTime ? (time - lastTime) / 1000 : 0;
    lastTime = time;
    world.step(1 / 60, delta, 3);
    handleVehicleControls();
     if (car && chassisBody) {
        car.position.copy(chassisBody.position);
        car.quaternion.copy(chassisBody.quaternion);
                 for (let i = 0; i < vehicle.wheelInfos.length; i++) {
            vehicle.updateWheelTransform(i);
            const t = vehicle.wheelInfos[i].worldTransform;
            wheelVisuals[i].position.copy(t.position);
            wheelVisuals[i].quaternion.copy(t.quaternion);
        }
    }
   updateCameraPosition();
//    checkColission();
   renderer.render(scene, camera);
}

animate();

// responsive design for canvas
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
