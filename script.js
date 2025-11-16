import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-v9',
    center: [-122.5203, 37.9669],
    zoom: 16,
    pitch: 60,
    antialias: true
});

const baseCorners = [
    [-122.533714, 37.980356],
    [-122.463267, 37.980358],
    [-122.463263, 37.951097],
    [-122.533717, 37.951092]
];

map.on("load", () => {
    map.addSource("proposal-image", {
        type: "image",
        url: "assets/images/proposal for a bridge.png",
        coordinates: baseCorners
    });

    map.addLayer({
        id: "proposal-layer",
        type: "raster",
        source: "proposal-image",
        paint: { "raster-opacity": 1 }
    });

    const tl = [-122.521122, 37.967225];
    const tr = [-122.519669, 37.967222];
    const bl = [-122.521117, 37.966492];
    const br = [-122.519678, 37.966486];

    const centerLng = (tl[0] + tr[0] + bl[0] + br[0]) / 4;
    const centerLat = (tl[1] + tr[1] + bl[1] + br[1]) / 4;

    const merc = mapboxgl.MercatorCoordinate.fromLngLat([centerLng, centerLat], 0);

    const dx = tr[0] - tl[0];
    const dy = tr[1] - tl[1];
    const angle = Math.atan2(dy, dx);

    const widthMeters =  ((dx*111320*Math.cos(centerLat*Math.PI/180))**2 + (dy*110540)**2) ** 0.5;

    const loader = new GLTFLoader();
    let scene, camera, renderer;

    const customLayer = {
        id: "gltf-model",
        type: "custom",
        renderingMode: "3d",
        onAdd: function () {
            camera = new THREE.Camera();
            scene = new THREE.Scene();

            const light1 = new THREE.DirectionalLight(0xffffff, 1);
            light1.position.set(0, 100, 100);
            scene.add(light1);

            const light2 = new THREE.DirectionalLight(0xffffff, 1);
            light2.position.set(0, -100, 100);
            scene.add(light2);

            loader.load("assets/images/forebay gltf.gltf", (gltf) => {
                const model = gltf.scene;
                model.rotation.z = angle;
                model.position.set(merc.x, merc.y, merc.z);
                model.scale.set(widthMeters, widthMeters, widthMeters);
                scene.add(model);
            });

            renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: map.painter.context.gl,
                antialias: true
            });

            renderer.autoClear = false;
        },
        render: function (gl, matrix) {
            const m = new THREE.Matrix4().fromArray(matrix);
            camera.projectionMatrix = m;
            renderer.resetState();
            renderer.render(scene, camera);
            map.triggerRepaint();
        }
    };

    map.addLayer(customLayer);
});
