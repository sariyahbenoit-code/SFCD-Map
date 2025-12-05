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


const modelData = [
  {
    id: "pond-model",
    coords: [-122.51465, 37.9669],
    url: "assets/images/pond_pack.glb",
    visible: true,
    altitude: 25,
    scale: 1.4,
    rotationX: 0
  },
  {
    id: "bench-model",
    coords: [-122.5151, 37.96765],
    url: "assets/images/bench.glb",
    visible: true,
    altitude: 25,
    scale: 1.4,
    rotationX: 0
  },
  {
    id: "closet-model",
    coords: [-122.514, 37.9677],
    url: "assets/images/closet.glb",
    visible: true,
    altitude: 25,
    scale: 1.4,
    rotationX: 0
  }
];

let THREEJS;
const loadedModels = [];

//map
map.on("load", () => {
  THREEJS = window.THREE;

 //3d buildings
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

//custom
  const customLayer = {
    id: "srcd-3d-models",
    type: "custom",
    renderingMode: "3d",

    onAdd(mapInstance, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      this.renderer = new THREE.WebGLRenderer({
        canvas: mapInstance.getCanvas(),
        context: gl,
        antialias: true,
        alpha: true
      });
      this.renderer.autoClear = false;

      const light1 = new THREE.DirectionalLight(0xffffff, 1);
      light1.position.set(100, -100, 150);
      this.scene.add(light1);

      const light2 = new THREE.DirectionalLight(0xffffff, 0.7);
      light2.position.set(-100, 100, 150);
      this.scene.add(light2);

      this.loader = new THREE.GLTFLoader();

      modelData.forEach((m) => {
        this.loader.load(
          m.url,
          (gltf) => {
            const model = gltf.scene;

            const merc = mapboxgl.MercatorCoordinate.fromLngLat(
              m.coords,
              m.altitude
            );
            const scale = merc.meterInMercatorCoordinateUnits();

            model.scale.set(
              scale * m.scale,
              scale * m.scale,
              scale * m.scale
            );

            model.position.set(merc.x, merc.y, merc.z);
            model.rotation.x = m.rotationX;

            model.visible = m.visible;

            loadedModels.push({ id: m.id, mesh: model });
            this.scene.add(model);
          },
          undefined,
          (err) => console.error("Model load error:", m.url, err)
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

  map.addLayer(customLayer, "3d-buildings");

//pts
  map.once("idle", () => {
    if (map.getLayer("srcd-points")) {
      map.moveLayer("srcd-points");
    }
  });

//toggle
  const toggle = (checkboxId, modelId) => {
    const box = document.getElementById(checkboxId);
    if (!box) return;

    box.addEventListener("change", (e) => {
      const entry = loadedModels.find((m) => m.id === modelId);
      if (entry) entry.mesh.visible = e.target.checked;
    });
  };

  toggle("togglePond", "pond-model");
  toggle("toggleBench", "bench-model");
  toggle("toggleCloset", "closet-model");
});

//button
document.getElementById("zoomRegion").onclick = () =>
  map.flyTo({
    center: SRCD_CENTER,
    zoom: map.getZoom() - 5,
    pitch: 60,
    bearing: -20,
    speed: 0.8
  });

document.getElementById("resetView").onclick = () =>
  map.flyTo({
    center: SRCD_CENTER,
    zoom: 17,
    pitch: 60,
    bearing: -20,
    speed: 0.8
  });
