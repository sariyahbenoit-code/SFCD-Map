// -------------------------
// MAP INITIALIZATION
// -------------------------
mapboxgl.accessToken =
    "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    config: { basemap: { theme: "monochrome" } },
    zoom: 16.5,
    center: [-122.2585, 37.8755],
    pitch: 60,
    bearing: 20,
    antialias: true
});

// -------------------------
// LOAD GEOJSON
// -------------------------
const pointsURL = "points.geojson";   // <- your GeoJSON file

// Preload GLTF loader
const THREE_JS = window.THREE;
const gltfLoader = new THREE.GLTFLoader();

// Store active 3D models
const activeModels = [];

// -------------------------
// MAIN STYLE.LOAD EVENT
// -------------------------
map.on("style.load", () => {
    console.log("STYLE LOADED");

    // 1. Add 3D buildings
    add3DBuildings();

    // 2. Load GeoJSON → add points + one GLB per point
    loadPointsAndModels();
});

// -------------------------
// ADD 3D BUILDINGS
// -------------------------
function add3DBuildings() {
    const layers = map.getStyle().layers;
    const labelLayerId = layers.find(layer => layer.type === "symbol")?.id;

    map.addLayer(
        {
            id: "3d-buildings",
            type: "fill-extrusion",
            source: "composite",
            "source-layer": "building",
            filter: ["==", ["get", "extrude"], "true"],
            paint: {
                "fill-extrusion-color": "#aaaaaa",
                "fill-extrusion-height": ["get", "height"],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.7
            }
        },
        labelLayerId
    );
}

// -------------------------
// LOAD POINTS + ADD CIRCLES + 3D MODELS
// -------------------------
async function loadPointsAndModels() {
    const response = await fetch(pointsURL);
    const geojson = await response.json();

    map.addSource("points", {
        type: "geojson",
        data: geojson
    });

    map.addLayer({
        id: "point-circles",
        type: "circle",
        source: "points",
        paint: {
            "circle-radius": 8,
            "circle-color": "#ff5500",
            "circle-stroke-width": 2,
            "circle-stroke-color": "white"
        }
    });

    // Create GLB model for each point
    geojson.features.forEach((feature, index) => {
        const coords = feature.geometry.coordinates;

        addGLBModelAt(coords, index);
    });
}

// -------------------------
// ADD A GLB MODEL AT A COORDINATE
// -------------------------
function addGLBModelAt(lngLat, index) {
    const merc = mapboxgl.MercatorCoordinate.fromLngLat(lngLat, 0);

    const modelTransform = {
        translateX: merc.x,
        translateY: merc.y,
        translateZ: merc.z,
        rotateX: Math.PI / 2,
        rotateY: 0,
        rotateZ: 0,
        scale: merc.meterInMercatorCoordinateUnits() * 0.7
    };

    const layerId = "glb-model-" + index;

    const customLayer = {
        id: layerId,
        type: "custom",
        renderingMode: "3d",
        onAdd: function (map, gl) {
            this.scene = new THREE_JS.Scene();
            this.camera = new THREE_JS.Camera();

            // Lighting
            const light = new THREE_JS.DirectionalLight(0xffffff);
            light.position.set(0, 70, 100).normalize();
            this.scene.add(light);

            // Load the model
            gltfLoader.load("model.glb", gltf => {
                this.scene.add(gltf.scene);
            });

            this.renderer = new THREE_JS.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });

            this.renderer.autoClear = false;
        },

        render: function (gl, matrix) {
            const m = new THREE_JS.Matrix4().fromArray(matrix);
            const l = new THREE_JS.Matrix4()
                .makeTranslation(
                    modelTransform.translateX,
                    modelTransform.translateY,
                    modelTransform.translateZ
                )
                .scale(
                    new THREE_JS.Vector3(
                        modelTransform.scale,
                        -modelTransform.scale,
                        modelTransform.scale
                    )
                )
                .multiply(
                    new THREE_JS.Matrix4().makeRotationAxis(
                        new THREE_JS.Vector3(1, 0, 0),
                        modelTransform.rotateX
                    )
                );

            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.state.reset();
            this.renderer.render(this.scene, this.camera);

            map.triggerRepaint();
        }
    };

    map.addLayer(customLayer);
    activeModels.push(layerId);
}

// -------------------------
// UI BUTTONS (unchanged)
// -------------------------
document.getElementById("zoomRegion").onclick = () => {
    map.flyTo({
        center: [-122.259, 37.875],
        zoom: 16.8,
        pitch: 60,
        bearing: 20
    });
};

document.getElementById("resetView").onclick = () => {
    map.flyTo({
        center: [-122.2585, 37.8755],
        zoom: 16.5,
        pitch: 60,
        bearing: 20
    });
};
