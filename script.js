import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/DRACOLoader.js";

mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const targetCenter = [-122.514522, 37.967155];

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/standard",
  config: { basemap: { theme: "monochrome" } },
  center: targetCenter,
  zoom: 17,
  pitch: 60,
  antialias: true
});

map.on("error", (e) => console.error("MAPBOX ERROR:", e.error));

let renderer, scene, camera;

const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/libs/draco/"
);
loader.setDRACOLoader(draco);

const pondOrigin = [-122.51472840835794, 37.96556501819977];
const benchOrigin = [-122.51255653080607, 37.96784675899259];
const closetOrigin = [-122.5143025251341, 37.96791673783633];

const modelAltitude = 0;
const modelRotate = [Math.PI / 2, 0, 0];

function makeTransform(origin) {
  const mc = mapboxgl.MercatorCoordinate.fromLngLat(origin, modelAltitude);
  return {
    translateX: mc.x,
    translateY: mc.y,
    translateZ: mc.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: mc.meterInMercatorCoordinateUnits()
  };
}

const benchTransform = makeTransform(benchOrigin);
const pondTransform = makeTransform(pondOrigin);
const closetTransform = makeTransform(closetOrigin);

async function loadModel(url, scale = 1) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        console.log("Loaded model:", url);
        gltf.scene.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = false;
            obj.receiveShadow = false;
          }
        });
        gltf.scene.scale.set(scale, scale, scale);
        resolve(gltf.scene);
      },
      undefined,
      (err) => {
        console.error("Error loading model:", url, err);
        reject(err);
      }
    );
  });
}

let benchModel, pondModel, closetModel;
let showBench = true;
let showPond = true;
let showCloset = true;

const customLayer = {
  id: "3d-model-layer",
  type: "custom",
  renderingMode: "3d",

  onAdd: async function (map, gl) {
    scene = new THREE.Scene();
    camera = new THREE.Camera();

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(0, 100, 100);
    scene.add(dirLight);

    renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true
    });
    renderer.autoClear = false;

    try {
      benchModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/bench.glb",
        1
      );
      scene.add(benchModel);
    } catch (e) {
      console.warn("Bench model not added.");
    }

    try {
      pondModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/pond_pack.glb",
        1
      );
      scene.add(pondModel);
    } catch (e) {
      console.warn("Pond model not added.");
    }

    try {
      closetModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/closet.glb",
        1
      );
      scene.add(closetModel);
    } catch (e) {
      console.warn("Closet model not added.");
    }
  },

  render: (gl, matrix) => {
    if (!renderer || (!pondModel && !closetModel && !benchModel)) return;

    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

    renderer.state.reset();
    renderer.autoClear = false;
    renderer.clearDepth();

    function applyTransform(obj, t) {
      if (!obj) return;

      obj.matrixAutoUpdate = false;

      const rotX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        t.rotateX
      );
      const rotY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        t.rotateY
      );
      const rotZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        t.rotateZ
      );

      const translation = new THREE.Matrix4().makeTranslation(
        t.translateX,
        t.translateY,
        t.translateZ
      );

      const s = t.scale * 5;
      const scale = new THREE.Matrix4().makeScale(s, s, s);

      obj.matrix = new THREE.Matrix4()
        .multiply(rotX)
        .multiply(rotY)
        .multiply(rotZ)
        .multiply(scale)
        .multiply(translation);
    }

    applyTransform(benchModel, benchTransform);
    applyTransform(pondModel, pondTransform);
    applyTransform(closetModel, closetTransform);

    if (benchModel) benchModel.visible = showBench;
    if (pondModel) pondModel.visible = showPond;
    if (closetModel) closetModel.visible = showCloset;

    renderer.render(scene, camera);
    map.triggerRepaint();
  }
};

// ✅ NEW: Your image points data
const imagePoints = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Building entrance",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/building%20entrance.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51403244782145, 37.96782576318992]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Marshland change over time",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/change%20over%20time%20floating.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51354133407277, 37.967894011876524]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Corner park day and night",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/corner%20park%20day%20night.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51261014782297, 37.96772672087894]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Corner park overview",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/corner%20park.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.5127367747097, 37.96788480707045]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Fisheye perspective of forebay",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/fisheye%20perspective.png"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51460483446996, 37.96568378935048]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Floating housing overview",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/floating%20housing.png"
