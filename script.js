import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.159/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/DRACOLoader.js";

// map set up

mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const modelOrigin = [-122.514522, 37.967155];

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    config: { basemap: { theme: 'monochrome' }},
    center: modelOrigin,
    zoom: 17,
    pitch: 60,
    antialias: true
});

// rotating model, transform
const modelAltitude = 0;
const modelRotate = [Math.PI / 2, 0, 0];

const modelCoord = mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude);

const modelTransform = {
    translateX: modelCoord.x,
    translateY: modelCoord.y,
    translateZ: modelCoord.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: modelCoord.meterInMercatorCoordinateUnits()
};

// THREE.JS
let renderer, scene, camera;
let initialized = false;

//loader
const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/libs/draco/");
loader.setDRACOLoader(draco);

function addModel(url, scale = 1) {
    return new Promise((resolve, reject) => {
        loader.load(
            url,
            glb => {
                glb.scene.scale.set(scale, scale, scale);
                scene.add(glb.scene);
                resolve(glb.scene);
            },
            undefined,
            reject
        );
    });
}

//3d model layer
const customLayer = {
    id: "3d-model-layer",
    type: "custom",
    renderingMode: "3d",

    onAdd: async function (map, gl) {
        scene = new THREE.Scene();
        camera = new THREE.Camera();

        renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true
        });
        renderer.autoClear = false;

        await addModel("assets/models/bench.glb");
        await addModel("assets/models/closet.glb");
        await addModel("assets/models/pond_pack.glb");

        initialized = true;
    },

    render: function (gl, matrix) {
        if (!initialized) return;

        const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0), modelTransform.rotateX
        );
        const rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0), modelTransform.rotateY
        );
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1), modelTransform.rotateZ
        );

        const translation = new THREE.Matrix4().makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ
        );

        const scale = new THREE.Matrix4().makeScale(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale
        );

        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ)
            .multiply(scale)
            .multiply(translation);

        camera.projectionMatrix = m.multiply(l);

        renderer.resetState();
        renderer.render(scene, camera);
        map.triggerRepaint();
    }
};

map.on("load", () => {
    map.addLayer(customLayer);
});
