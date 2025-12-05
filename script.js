// --------------------------------------------
// MAPBOX ACCESS TOKEN
// --------------------------------------------
mapboxgl.accessToken =
"pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";


// --------------------------------------------
// CONSTANTS
// --------------------------------------------
const SRCD_CENTER = [-122.514522, 37.967155];


// --------------------------------------------
// INITIALIZE MAP
// --------------------------------------------
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: SRCD_CENTER,
    zoom: 17,
    pitch: 60,
    bearing: -20,
    antialias: true
});


// --------------------------------------------
// THREE JS SETUP
// --------------------------------------------
let scene, camera, renderer;

function initThreeJS() {
    const container = document.getElementById('three-container');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}


// --------------------------------------------
// LOAD GLB INTO THREE JS SCENE
// --------------------------------------------
function loadGLB(path, position, scale = 1) {
    const loader = new THREE.GLTFLoader();

    loader.load(
        path,
        function (gltf) {
            const model = gltf.scene;

            model.position.set(position.x, position.y, position.z);
            model.scale.set(scale, scale, scale);

            scene.add(model);
        },
        undefined,
        function (error) {
            console.error("Error loading GLB:", error);
        }
    );
}


// --------------------------------------------
// MODEL ASSIGNMENTS (ONE PER POINT)
// --------------------------------------------
const modelAssignments = [
    {
        name: "Solar Powered Forebay & Marsh (South)",
        coords: [-122.51470, 37.96620],
        glb: "assets/images/pond_pack.glb"
    },
    {
        name: "Modular Multi-purpose Bench Stove (NW)",
        coords: [-122.51520, 37.96740],
        glb: "assets/images/bench.glb"
    },
    {
        name: "Storage Units for Emergency Inventory (NE)",
        coords: [-122.51400, 37.96750],
        glb: "assets/images/closet.glb"
    }
];


// --------------------------------------------
// MAP LOAD
// --------------------------------------------
map.on("load", () => {
    initThreeJS();

    // Load each GLB model into correct geographic position
    modelAssignments.forEach(item => {
        const merc = mapboxgl.MercatorCoordinate.fromLngLat(item.coords, 0);

        loadGLB(item.glb, {
            x: merc.x,
            y: 0,
            z: merc.y
        }, 10);
    });

    // --------------------------------------------
    // RESTORE 3D BUILDINGS + ORDER LAYERS
    // --------------------------------------------

    function detectBuildingLayer() {
        return map.getStyle().layers.find(l => l.type === "fill-extrusion");
    }

    function detectCustomModelLayer() {
        return map.getStyle().layers.find(l =>
            l.type === "custom" ||
            (l.id && l.id.toLowerCase().includes("model")) ||
            (l.id && l.id.toLowerCase().includes("3d"))
        );
    }

    const buildingLayer = detectBuildingLayer();
    const modelLayer = detectCustomModelLayer();

    // Restore buildings
    if (buildingLayer) {
        map.setLayoutProperty(buildingLayer.id, "visibility", "visible");
    }

    // Keep correct stacking order:
    // MAP → 3D BUILDINGS → 3D MODELS → POINTS
    if (buildingLayer && modelLayer) {
        try {
            map.moveLayer(buildingLayer.id, modelLayer.id);
        } catch (e) { console.warn(e); }
    }

    try {
        map.moveLayer("points-layer");
    } catch (e) {
        console.warn("Points layer not found yet — will appear when added.");
    }
});


// --------------------------------------------
// BUTTON HANDLERS (UNCHANGED)
// --------------------------------------------
document.getElementById("zoomRegion").addEventListener("click", () => {
    map.flyTo({
        center: SRCD_CENTER,
        zoom: 6,
        speed: 0.7
    });
});

document.getElementById("resetView").addEventListener("click", () => {
    map.flyTo({
        center: SRCD_CENTER,
        zoom: 17,
        pitch: 60,
        bearing: -20,
        speed: 0.7
    });
});
