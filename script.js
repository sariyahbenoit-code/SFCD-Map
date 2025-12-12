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
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51446433883217, 37.9678100182618]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "Landmark": "Solar powered pump station and forebay",
        "PopupMedia": "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/forebay%20perspective.png",
        "Address": "555 Francisco Blvd W, San Rafael, CA 94901",
        "Proposal": "Vegetated and rip rap forebay"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-122.51472840835794, 37.96556501819977]
      }
    }
  ]
};

map.on("load", () => {
  // ✅ Your original GeoJSON layers FIRST
  map.addSource("srcd-data", {
    type: "geojson",
    data: "data/619data.geojson"
  });

  map.addLayer({
    id: "srcd-polygon",
    type: "fill",
    source: "srcd-data",
    paint: {
      "fill-color": "#256634",
      "fill-opacity": 0.2
    },
    filter: ["==", ["geometry-type"], "Polygon"]
  });

  map.addLayer({
    id: "srcd-polygon-outline",
    type: "line",
    source: "srcd-data",
    paint: {
      "line-color": "#354739",
      "line-width": 2
    },
    filter: ["==", ["geometry-type"], "Polygon"]
  });

  map.addLayer({
    id: "srcd-line",
    type: "line",
    source: "srcd-data",
    paint: {
      "line-color": "#E8240C",
      "line-width": 3
    },
    filter: ["==", ["geometry-type"], "LineString"]
  });

  map.addLayer({
    id: "srcd-points-layer",
    type: "circle",
    source: "srcd-data",
    paint: {
      "circle-radius": 6,
      "circle-color": "#E4E80C",
      "circle-stroke-color": "#000000",
      "circle-stroke-width": 1
    },
    filter: ["==", ["geometry-type"], "Point"]
  });

  // ✅ NEW: Add image points source and layer
  map.addSource("image-points", {
    type: "geojson",
    data: imagePoints
  });

  map.addLayer({
    id: "image-points-layer",
    type: "circle",
    source: "image-points",
    paint: {
      "circle-radius": 10,
      "circle-color": "#FF6B6B",
      "circle-stroke-color": "#FFFFFF",
      "circle-stroke-width": 3,
      "circle-opacity": 0.9
    }
  });

  // ✅ NEW: Image points interactions
  map.on("mouseenter", "image-points-layer", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "image-points-layer", () => {
    map.getCanvas().style.cursor = "";
  });

  map.on("click", "image-points-layer", (e) => {
    if (!e.features || !e.features.length) return;
    const feature = e.features[0];
    const props = feature.properties || {};

    const landmark = props["Landmark"] || "Landmark";
    const address = props["Address"] || "";
    const proposal = props["Proposal"] || "";
    const popupMedia = props["PopupMedia"] || "";

    const coordinates = feature.geometry.coordinates.slice();

    map.flyTo({
      center: coordinates,
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      speed: 0.6
    });

    let html = `<strong style="color: #FF6B6B;">${landmark}</strong>`;
    if (address) html += `<br><em style="color: #666;">${address}</em>`;
    if (proposal) html += `<br><br><strong>Proposal:</strong> ${proposal}`;

    // ✅ IMAGE POPUP SPACE - ready for your media URLs
    if (popupMedia) {
      html += `
        <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; text-align: center;">
          <img src="${popupMedia}" 
               alt="${landmark}" 
               style="max-width: 250px; max-height: 200px; width: 100%; height: auto; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <div style="margin-top: 8px; font-size: 12px; color: #666;">
            ${landmark}
          </div>
        </div>
      `;
    }

    new mapboxgl.Popup({
      offset: [0, -45],
      anchor: "bottom",
      closeOnMove: false,
      className: "image-popup"
    })
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(map);
  });

  // ✅ Your original 3D layer LAST
  map.addLayer(customLayer);

  // ✅ Your original srcd-points interactions
  map.on("mouseenter", "srcd-points-layer", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "srcd-points-layer", () => {
    map.getCanvas().style.cursor = "";
  });

  map.on("click", "srcd-points-layer", (e) => {
    if (!e.features || !e.features.length) return;
    const feature = e.features[0];
    const props = feature.properties || {};

    const landmark = props["Landmark"] || "Landmark";
    const address = props["Address"] || "";
    const proposal = props["Proposal"] || "";
    const proposalLink = props["Proposal Link"] || "";
    const existingLink = props["Existing Link"] || "";
    const precedent1 = props["Precedent1"] || "";
    const precedent2 = props["Precedent2"] || "";
    const extras1 = props["Extras1"] || "";
    const extras2 = props["Extras 2"] || "";
    const popupMedia = props["PopupMedia"] || "";
    const repoImage = props["RepoImage"] || "";

    const coordinates = feature.geometry.coordinates.slice();

    map.flyTo({
      center: coordinates,
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing(),
      speed: 0.6
    });

    let html = `<strong>${landmark}</strong>`;
    if (address) html += `<br>${address}`;
    if (proposal) html += `<br><br><strong>Proposal:</strong> ${proposal}`;

    const links = [];
    if (proposalLink)
      links.push(`<a href="${proposalLink}" target="_blank">Proposal image</a>`);
    if (existingLink)
      links.push(`<a href="${existingLink}" target="_blank">Existing condition</a>`);
    if (precedent1)
      links.push(`<a href="${precedent1}" target="_blank">Precedent 1</a>`);
    if (precedent2)
      links.push(`<a href="${precedent2}" target="_blank">Precedent 2</a>`);
    if (extras1)
      links.push(`<a href="${extras1}" target="_blank">Extra 1</a>`);
    if (extras2)
      links.push(`<a href="${extras2}" target="_blank">Extra 2</a>`);
    if (repoImage)
      links.push(`<a href="${repoImage}" target="_blank">Repository image</a>`);

    if (links.length) {
      html += "<br><br><strong>Links:</strong><br>" + links.join("<br>");
    }

    if (popupMedia) {
      const lower = popupMedia.toLowerCase();
      const isImage =
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".gif") ||
        lower.endsWith(".webp");

      if (isImage) {
        html +=
          "<br><br>" +
          '<a href="' + popupMedia + '" target="_blank" style="display:inline-block; width: 100%; text-align:center;">' +
          '<img src="' + popupMedia + '" alt="Popup media" ' +
          'style="display:inline-block; width: 60%; height: auto; max-width: 60%;">' +
          "</a>";
      } else {
        html +=
          '<br><br><a href="' +
          popupMedia +
          '" target="_blank"><strong>Open attached media</strong></a>';
      }
    }

    new mapboxgl.Popup({
      offset: [0, -40],
      anchor: "bottom",
      closeOnMove: false
    })
      .setLngLat(coordinates)
      .setHTML(html)
      .addTo(map);
  });
});

document.getElementById("zoomRegion").addEventListener("click", () => {
  map.flyTo({
    center: targetCenter,
    zoom: 14,
    speed: 0.6
  });
});

document.getElementById("resetView").addEventListener("click", () => {
  map.flyTo({
    center: targetCenter,
    zoom: 16,
    speed: 0.6
  });
});

document.getElementById("togglePond").addEventListener("change", (e) => {
  showPond = e.target.checked;
  console.log("togglePond:", e.target.checked);
  map.triggerRepaint();
});

document.getElementById("toggleBench").addEventListener("change", (e) => {
  showBench = e.target.checked;
  console.log("toggle Bench:", e.target.checked);
  map.triggerRepaint();
});

document.getElementById("toggleCloset").addEventListener("change", (e) => {
  showCloset = e.target.checked;
  console.log("toggle Closet:", e.target.checked);
  map.triggerRepaint();
});
