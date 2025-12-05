// script.js — updated version (keep HTML & CSS unchanged)

// Mapbox token and map initialization (unchanged)
mapboxgl.accessToken =
    "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    config: {
        basemap: { theme: "monochrome" }
    },
    zoom: 18,
    center: [-122.514522, 37.967155],
    pitch: 60,
    antialias: true
});

// GeoJSON URL (your file on GitHub)
const pointsURL = "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/data/619data.geojson";

// Raw URLs for your GLB files on GitHub
const MODEL_URLS = {
    pond: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/pond_pack.glb",
    bench: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/bench.glb",
    closet: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/closet.glb"
};

// Keep track of loaded 3D model meshes for toggling visibility
const loadedModels = {}; // keys: 'pond','bench','closet' -> {mesh, layerId}

// Helper: compare coords (match with small tolerance)
function sameCoord(a, b, tol = 1e-6) {
    return Math.abs(a[0] - b[0]) < tol && Math.abs(a[1] - b[1]) < tol;
}

// Main flow on style.load (you asked to use style.load)
map.on("style.load", async () => {
    // fetch geojson
    let geojson;
    try {
        const resp = await fetch(pointsURL);
        geojson = await resp.json();
    } catch (err) {
        console.error("Failed to load geojson:", err);
        return;
    }

    // 1) restore 3D buildings (compatible with 'standard' style)
    add3DBuildings();

    // 2) add 3D models for each feature (models added before points so we can choose order)
    await addModelsFromGeoJSON(geojson);

    // 3) add point source + layer and ensure it's on top of basemap (and interactive)
    addPointsLayer(geojson);

    // 4) wire up checkbox toggles (preserve IDs)
    setupToggles();
});

// ----------------------
// Add 3D buildings
// ----------------------
function add3DBuildings() {
    const layers = map.getStyle().layers || [];
    const labelLayer = layers.find(l => l.type === "symbol" && l.layout && l.layout["text-field"]);
    const beforeId = labelLayer ? labelLayer.id : undefined;

    // Use 'composite' source and 'building' source-layer (standard style uses these)
    // If it errors because source not available, wrap in try/catch to avoid breaking everything
    try {
        map.addLayer({
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
                "fill-extrusion-color": "#aaa",
                "fill-extrusion-height": [
                    "interpolate", ["linear"], ["zoom"],
                    15, 0,
                    15.05, ["get", "height"]
                ],
                "fill-extrusion-base": [
                    "interpolate", ["linear"], ["zoom"],
                    15, 0,
                    15.05, ["get", "min_height"]
                ],
                "fill-extrusion-opacity": 0.6
            }
        }, beforeId);
    } catch (err) {
        console.warn("Could not add 3d-buildings layer (source may not exist in this style):", err);
    }
}

// ----------------------
// Add 3D models using geojson
// ----------------------
async function addModelsFromGeoJSON(geojson) {
    // Build mapping of which model belongs to which coordinate using known coords (from your geojson)
    // The geojson feature coords (from your file) are:
    // closet: [-122.51172577538132, 37.96756766223187] (Municipally leased storage) -> closet.glb
    // pond:   [-122.51472840835794, 37.96556501819977] (Solar powered pump station) -> pond_pack.glb
    // bench:  [-122.51255653080607, 37.96784675899259] (Boat Sales and Service) -> bench.glb

    const known = {
        pond: [-122.51472840835794, 37.96556501819977],
        bench: [-122.51255653080607, 37.96784675899259],
        closet: [-122.51172577538132, 37.96756766223187]
    };

    // For each feature, determine which model to load (by comparing coords)
    const loader = new THREE.GLTFLoader();

    for (const feature of geojson.features) {
        const coords = feature.geometry.coordinates;

        let key = null;
        if (sameCoord(coords, known.pond)) key = "pond";
        else if (sameCoord(coords, known.bench)) key = "bench";
        else if (sameCoord(coords, known.closet)) key = "closet";
        else {
            // fallback: choose pond if nothing matches (shouldn't happen)
            console.warn("Unknown feature coords; skipping model assignment for", coords);
            continue;
        }

        const modelUrl = MODEL_URLS[key];
        const layerId = `model-${key}`;

        // Create mercator coordinate for position/scale
        const mc = mapboxgl.MercatorCoordinate.fromLngLat(coords, 0);

        // Prepare custom layer for this model
        const customLayer = {
            id: layerId,
            type: "custom",
            renderingMode: "3d",

            onAdd: function (mapInstance, gl) {
                this.camera = new THREE.Camera();
                this.scene = new THREE.Scene();

                const light1 = new THREE.DirectionalLight(0xffffff, 0.9);
                light1.position.set(0, -70, 100).normalize();
                this.scene.add(light1);

                const light2 = new THREE.DirectionalLight(0xffffff, 0.6);
                light2.position.set(0, 70, 100).normalize();
                this.scene.add(light2);

                this.loader = loader;

                // load the glb
                this.loader.load(
                    modelUrl,
                    (gltf) => {
                        const model = gltf.scene;

                        // scale similar to earlier working version (small factor so models fit)
                        const scaleFactor = mc.meterInMercatorCoordinateUnits() * 0.05;
                        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

                        // rotate so model faces correctly
                        model.rotation.x = Math.PI / 2;

                        // keep a ref for toggling
                        loadedModels[key] = { mesh: model, layerId };

                        this.scene.add(model);
                    },
                    undefined,
                    (err) => console.error("Failed to load model:", modelUrl, err)
                );

                this.renderer = new THREE.WebGLRenderer({
                    canvas: mapInstance.getCanvas(),
                    context: gl,
                    antialias: true
                });
                this.renderer.autoClear = false;
            },

            render: function (gl, matrix) {
                if (!this.scene) return;

                const rotationX = new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(1, 0, 0),
                    Math.PI / 2
                );

                const m = new THREE.Matrix4().fromArray(matrix);

                const l = new THREE.Matrix4()
                    .makeTranslation(mc.x, mc.y, mc.z)
                    .scale(new THREE.Vector3(
                        mc.meterInMercatorCoordinateUnits(),
                        -mc.meterInMercatorCoordinateUnits(),
                        mc.meterInMercatorCoordinateUnits()
                    ))
                    .multiply(rotationX);

                this.camera.projectionMatrix = m.multiply(l);
                this.renderer.state.reset();
                this.renderer.render(this.scene, this.camera);
                map.triggerRepaint();
            }
        };

        // Add the custom layer BELOW points (so points are clearly visible on top)
        // We'll add models first, then add the point layer later so points are above models.
        try {
            map.addLayer(customLayer);
        } catch (err) {
            console.error("Error adding custom model layer:", err);
        }
    }
}

// ----------------------
// Add points layer on top and popup behavior
// ----------------------
function addPointsLayer(geojson) {
    // Make sure a source named 'points' does not already exist (avoid duplicates)
    if (map.getSource("points")) {
        map.getSource("points").setData(geojson);
    } else {
        map.addSource("points", {
            type: "geojson",
            data: geojson
        });
    }

    // Add circle layer on top (addLayer with no before argument places it at top)
    if (!map.getLayer("point-circles")) {
        map.addLayer({
            id: "point-circles",
            type: "circle",
            source: "points",
            paint: {
                "circle-radius": 8,
                "circle-color": "#ff5500",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff"
            }
        });
    } else {
        // ensure visible
        map.setLayoutProperty("point-circles", "visibility", "visible");
    }

    // Cursor pointer when hovering points
    map.on("mouseenter", "point-circles", () => map.getCanvas().style.cursor = "pointer");
    map.on("mouseleave", "point-circles", () => map.getCanvas().style.cursor = "");

    // Click popup showing all properties + coordinates
    map.on("click", "point-circles", (e) => {
        const feature = e.features[0];
        const props = feature.properties || {};
        const coords = feature.geometry.coordinates;

        // Build html from properties (show all keys)
        let html = `<strong>${props.Landmark || "Feature"}</strong><br>`;
        Object.keys(props).forEach(k => {
            if (k === "Landmark") return;
            const v = props[k];
            if (v) html += `<strong>${k}:</strong> ${v}<br>`;
        });
        html += `<br><strong>Coordinates:</strong> ${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`;

        new mapboxgl.Popup()
            .setLngLat(coords)
            .setHTML(html)
            .addTo(map);
    });
}

// ----------------------
// Setup checkbox toggles
// ----------------------
function setupToggles() {
    const pondBox = document.getElementById("togglePond");
    const benchBox = document.getElementById("toggleBench");
    const closetBox = document.getElementById("toggleCloset");

    if (pondBox) {
        pondBox.checked = true;
        pondBox.addEventListener("change", (e) => {
            const entry = loadedModels["pond"];
            if (entry && entry.mesh) entry.mesh.visible = e.target.checked;
        });
    }

    if (benchBox) {
        benchBox.checked = true;
        benchBox.addEventListener("change", (e) => {
            const entry = loadedModels["bench"];
            if (entry && entry.mesh) entry.mesh.visible = e.target.checked;
        });
    }

    if (closetBox) {
        closetBox.checked = true;
        closetBox.addEventListener("change", (e) => {
            const entry = loadedModels["closet"];
            if (entry && entry.mesh) entry.mesh.visible = e.target.checked;
        });
    }
}

// ----------------------
// Buttons (leave behavior unchanged per your earlier requests)
// ----------------------
document.getElementById("zoomRegion").onclick = () =>
    map.flyTo({
        center: [-122.514522, 37.967155],
        zoom: 15.5,
        pitch: 60,
        bearing: -20,
        speed: 0.8
    });

document.getElementById("resetView").onclick = () =>
    map.flyTo({
        center: [-122.514522, 37.967155],
        zoom: 18,
        pitch: 60,
        bearing: -20,
        speed: 0.8
    });

// ----------------------
// Note about GLB loader support
// ----------------------
// You are loading three.min.js and the GLTFLoader plugin in your HTML.
// The code above uses THREE.GLTFLoader which supports both .gltf and binary .glb files.
// So yes: the GLTFLoader is correct for loading your .glb files.
