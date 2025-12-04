
// MAPBOX ACCESS TOKEN (12_3 VERSION)

mapboxgl.accessToken =
    "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";


const INITIAL_CENTER = [-122.51444, 37.96703];
const INITIAL_ZOOM = 17.5;
const INITIAL_PITCH = 60;

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    center: INITIAL_CENTER,
    zoom: INITIAL_ZOOM,
    pitch: INITIAL_PITCH,
    bearing: 0,
    antialias: true,
    config: { basemap: { theme: "monochrome" } }
});


// THREE.JS 3D MODELS

const THREECAMERA = new THREE.Camera();
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({
    canvas: map.getCanvas(),
    context: map.painter.context.gl,
    antialias: true
});
renderer.autoClear = false;


const loader = new THREE.GLTFLoader();


function projectLngLat(lng, lat) {
    return mapboxgl.MercatorCoordinate.fromLngLat({ lng, lat }, 0);
}


// LOAD GLB OBJECTS

function loadGLB(url, lng, lat, scale = 1) {
    loader.load(url, glb => {
        const model = glb.scene;

        const mc = projectLngLat(lng, lat);
        model.position.set(mc.x, mc.y, mc.z || 0);
        model.scale.set(scale, scale, scale);
        model.rotation.x = Math.PI / 2;

        scene.add(model);
        render();
    });
}


loadGLB("bench.glb", -122.5153, 37.9678, 0.8);
loadGLB("pond.glb", -122.5138, 37.9662, 1.0);
loadGLB("closet.glb", -122.5135, 37.9675, 0.8);


// MAP RENDER LOOP

function render() {
    const tr = map.transform;
    THREECAMERA.projectionMatrix = new THREE.Matrix4().fromArray(tr.projMatrix);
    renderer.resetState();
    renderer.render(scene, THREECAMERA);
}
map.on("render", render);


// UI BUTTONS — SAFE EVENT BINDING

document.getElementById("zoomRegion").addEventListener("click", () => {
    map.flyTo({
        center: [-122.5162, 37.9670],
        zoom: 16,
        pitch: 60,
        speed: 0.6
    });
});

document.getElementById("resetView").addEventListener("click", () => {
    map.flyTo({
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        pitch: INITIAL_PITCH,
        bearing: 0,
        speed: 0.6
    });
});


// TOGGLE POINTS 

function safeToggle(id, layer) {
    const checkbox = document.getElementById(id);
    checkbox.addEventListener("change", () => {
        if (!map.getLayer(layer)) return;
        map.setLayoutProperty(
            layer,
            "visibility",
            checkbox.checked ? "visible" : "none"
        );
    });
}


safeToggle("togglePond", "pond-points");
safeToggle("toggleBench", "bench-points");
safeToggle("toggleCloset", "closet-points");
