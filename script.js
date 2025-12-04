// -----------------------------
// script.js — with 3D buildings restored and layer order corrected
// -----------------------------

mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const SRCD_CENTER = [-122.514522, 37.967155];

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v11",
  center: SRCD_CENTER,
  zoom: 17,
  pitch: 60,
  bearing: -20,
  antialias: true
});

// ------------------------------------------------------------------
// YOUR THREE MODEL DEFINITIONS
// ------------------------------------------------------------------
const modelData = [
  {
    id: "pond-model",
    coords: [-122.51465, 37.9669],
    url: "assets/images/pond_pack.glb",
    visible: true
  },
  {
    id: "bench-model",
    coords: [-122.5151, 37.96765],
    url: "assets/images/bench.glb",
    visible: true
  },
  {
    id: "closet-model",
    coords: [-122.514, 37.9677],
    url: "assets/images/closet.glb",
    visible: true
  }
];

let THREEJS;
const loadedModels = [];

// ------------------------------------------------------------------
// MAIN MAP LOAD
// ------------------------------------------------------------------
map.on("load", async () => {
  THREEJS = window.THREE;

  // ---------------------------------------------------------------
  // 1. RESTORE MAPBOX 3D BUILDINGS (IDENTICAL TO OFFICIAL STYLE)
  // ---------------------------------------------------------------
  const layers = map.getStyle().layers;
  let labelLayerId = null;

  for (const layer of layers) {
    if (layer.type === "symbol" && layer.layout["text-field"]) {
      labelLayerId = layer.id;
      break;
    }
  }

  map.addLayer(
    {
      id: "3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 15,
      paint: {
        "fill-extrusion-color": "#aaa",
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "height"]
        ],
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          15.05,
          ["get", "min_height"]
        ],
        "fill-extrusion-opacity": 0.6
      }
    },
    labelLayerId
  );

  // ---------------------------------------------------------------
  // 2. ADD CUSTOM 3D OBJECT LAYER (THREE.JS)
  // ---------------------------------------------------------------
  const customLayer = {
    id: "srcd-3d-models",
    type: "custom",
    renderingMode: "3d",

    onAdd(mapInstance, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      const light1 = new THREE.DirectionalLight(0xffffff, 0.9);
      light1.position.set(0, -70, 100).normalize();
      this.scene.add(light1);

      const light2 = new THREE.DirectionalLight(0xffffff, 0.6);
      light2.position.set(0, 70, 100).normalize();
      this.scene.add(light2);

      this.renderer = new THREE.WebGLRenderer({
        canvas: mapInstance.getCanvas(),
        context: gl,
        antialias: true,
        alpha: true
      });
      this.renderer.autoClear = false;

      this.loader = new THREE.GLTFLoader();

      modelData.forEach((m) => {
        this.loader.load(
          m.url,
          (gltf) => {
            const model = gltf.scene;

            const merc = mapboxgl.MercatorCoordinate.fromLngLat(m.coords, 0);
            const scale = merc.meterInMercatorCoordinateUnits();

            model.scale.set(scale * 0.05, scale * 0.05, scale * 0.05);
            model.position.set(merc.x, merc.y, merc.z);
            model.rotation.x = Math.PI / 2;

            loadedModels.push({ id: m.id, mesh: model });
            this.scene.add(model);
          },
          undefined,
          (err) => console.error("GLTF error:", m.url, err)
        );
      });
    },

    render(gl, matrix) {
      this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
      this.renderer.state.reset();
      this.renderer.render(this.scene, this.camera);
      map.triggerRepaint();
    }
  };

  // ADD THREE.JS MODELS *BELOW POINTS* BUT *ABOVE 3D BUILDINGS*
  map.addLayer(customLayer, "3d-buildings");

  // ------------------------------------------------------------------
  // 3. BRING POINTS TO THE VERY TOP
  // ------------------------------------------------------------------
  // Your point layer id from earlier versions was "srcd-points"
  // If it is different, tell me the name and I will adjust.
  if (map.getLayer("srcd-points")) {
    map.moveLayer("srcd-points");
  }

  // ------------------------------------------------------------------
  // CHECKBOX VISIBILITY HANDLERS
  // ------------------------------------------------------------------
  const pondCheckbox = document.getElementById("togglePond");
  const benchCheckbox = document.getElementById("toggleBench");
  const closetCheckbox = document.getElementById("toggleCloset");

  function setModelVisibility(id, visible) {
    const entry = loadedModels.find((m) => m.id === id);
    if (entry && entry.mesh) entry.mesh.visible = visible;
  }

  if (pondCheckbox)
    pondCheckbox.addEventListener("change", (e) =>
      setModelVisibility("pond-model", e.target.checked)
    );
  if (benchCheckbox)
    benchCheckbox.addEventListener("change", (e) =>
      setModelVisibility("bench-model", e.target.checked)
    );
  if (closetCheckbox)
    closetCheckbox.addEventListener("change", (e) =>
      setModelVisibility("closet-model", e.target.checked)
    );

  if (pondCheckbox) pondCheckbox.checked = modelData[0].visible;
  if (benchCheckbox) benchCheckbox.checked = modelData[1].visible;
  if (closetCheckbox) closetCheckbox.checked = modelData[2].visible;
});

// ------------------------------------------------------------------
// BUTTON CONTROLS (UNCHANGED)
// ------------------------------------------------------------------
const zoomRegionBtn = document.getElementById("zoomRegion");
const resetViewBtn = document.getElementById("resetView");

if (zoomRegionBtn) {
  zoomRegionBtn.addEventListener("click", () => {
    map.flyTo({
      center: SRCD_CENTER,
      zoom: map.getZoom() - 5,
      pitch: 60,
      bearing: -20,
      speed: 0.8
    });
  });
}

if (resetViewBtn) {
  resetViewBtn.addEventListener("click", () => {
    map.flyTo({
      center: SRCD_CENTER,
      zoom: 17,
      pitch: 60,
      bearing: -20,
      speed: 0.8
    });
  });
}
