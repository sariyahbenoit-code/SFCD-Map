import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/loaders/DRACOLoader.js";

// Mapbox access token
mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

// Map setup
const targetCenter = [-122.514522, 37.967155];
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/standard",
  center: targetCenter,
  zoom: 17,
  pitch: 60,
  antialias: true
});

map.on("error", (e) => console.error("MAPBOX ERROR:", e.error));

// THREE.js setup
let renderer, scene, camera;
const loader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.159/examples/jsm/libs/draco/"
);
loader.setDRACOLoader(draco);

const origins = {
  pond: [-122.51472840835794, 37.96556501819977],
  bench: [-122.51255653080607, 37.96784675899259],
  closet: [-122.5143025251341, 37.96791673783633]
};

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

const transforms = {
  bench: makeTransform(origins.bench),
  pond: makeTransform(origins.pond),
  closet: makeTransform(origins.closet)
};

async function loadModel(url, scale = 1) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
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
let showBench = true, showPond = true, showCloset = true;

// Custom 3D layer
const customLayer = {
  id: "3d-model-layer",
  type: "custom",
  renderingMode: "3d",
  onAdd: async function (map, gl) {
    scene = new THREE.Scene();
    camera = new THREE.Camera();

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
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
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/bench.glb"
      );
      scene.add(benchModel);
    } catch {}
    try {
      pondModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/pond_pack.glb"
      );
      scene.add(pondModel);
    } catch {}
    try {
      closetModel = await loadModel(
        "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/models/closet.glb"
      );
      scene.add(closetModel);
    } catch {}
  },

  render: (gl, matrix) => {
    if (!renderer) return;

    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
    renderer.state.reset();
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

    applyTransform(benchModel, transforms.bench);
    applyTransform(pondModel, transforms.pond);
    applyTransform(closetModel, transforms.closet);

    if (benchModel) benchModel.visible = showBench;
    if (pondModel) pondModel.visible = showPond;
    if (closetModel) closetModel.visible = showCloset;

    renderer.render(scene, camera);
    map.triggerRepaint();
  }
};

// Load Map and GeoJSON layers
map.on("load", () => {
  // 1️⃣ GeoJSON first
  map.addSource("srcd-data", {
    type: "geojson",
    data: "data/619data.geojson"
  });

  map.addLayer({
    id: "srcd-polygon",
    type: "fill",
    source: "srcd-data",
    paint: { "fill-color": "#256634", "fill-opacity": 0.3 },
    filter: ["==", ["geometry-type"], "Polygon"]
  });

  map.addLayer({
    id: "srcd-polygon-outline",
    type: "line",
    source: "srcd-data",
    paint: { "line-color": "#354739", "line-width": 2 },
    filter: ["==", ["geometry-type"], "Polygon"]
  });

  map.addLayer({
    id: "srcd-line",
    type: "line",
    source: "srcd-data",
    paint: { "line-color": "#E8240C", "line-width": 3 },
    filter: ["==", ["geometry-type"], "LineString"]
  });

  map.addLayer({
    id: "srcd-points-layer",
    type: "circle",
    source: "srcd-data",
    paint: {
      "circle-radius": 6,
      "circle-color": "#E4E80C",
      "circle-stroke-color": "#000",
      "circle-stroke-width": 1
    },
    filter: ["==", ["geometry-type"], "Point"]
  });

  // 2️⃣ Add 3D custom layer *after* 2D overlays — this ensures visibility
  map.addLayer(customLayer, "srcd-points-layer");
});

document.getElementById("zoomRegion").addEventListener("click", () => {
  map.flyTo({ center: targetCenter, zoom: 14, speed: 0.6 });
});
document.getElementById("resetView").addEventListener("click", () => {
  map.flyTo({ center: targetCenter, zoom: 16, speed: 0.6 });
});
document.getElementById("togglePond").addEventListener("change", (e) => {
  showPond = e.target.checked;
  map.triggerRepaint();
});
document.getElementById("toggleBench").addEventListener("change", (e) => {
  showBench = e.target.checked;
  map.triggerRepaint();
});
document.getElementById("toggleCloset").addEventListener("change", (e) => {
  showCloset = e.target.checked;
  map.triggerRepaint();
});
