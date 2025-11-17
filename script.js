import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.querySelector("#three").appendChild(renderer.domElement);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

const loader = new GLTFLoader();
loader.load(
    'https://sariyahbenoit-code.github.io/SRCD-Map/assets/images/forebay%20gltf.gltf',
    (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.00005, 0.00005, 0.00005);
        scene.add(model);
    },
    undefined,
    (error) => console.error(error)
);

camera.position.set(0, 1, 2);

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
