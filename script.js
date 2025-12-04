mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const SRCD_CENTER = [-122.514522, 37.967155];

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: SRCD_CENTER,
    zoom: 17,
    pitch: 60,
    bearing: -20,
    antialias: true
});

let scene, camera, renderer;

function initThreeJS() {
    const container = document.getElementById('three-container');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        2000
    );

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.autoClear = true;
    container.appendChild(renderer.domElement);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}


function lngLatToPosition(lng, lat) {
    const m = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], 0);


    const scale = m.meterInMercatorCoordinateUnits();

    return {
        x: m.x / scale,
        y: 0,
        z: -m.y / scale
    };
}


function loadGLB(path, lng, lat, scale = 1) {
    const loader = new THREE.GLTFLoader();

    loader.load(
        path,
        function (gltf) {

            const model = gltf.scene;

            const pos = lngLatToPosition(lng, lat);
            model.position.set(pos.x, pos.y, pos.z);


            model.rotation.x = Math.PI / 2;

            model.scale.set(scale, scale, scale);
            scene.add(model);
        },
        undefined,
        function (error) {
            console.error("Error loading GLB:", error);
        }
    );
}

const modelAssignments = [
    {
        name: "Solar Powered Forebay & Marsh (South)",
        coords: [-122.51465, 37.96690],
        glb: "assets/images/pond_pack.glb"
    },
    {
        name: "Modular Multi-purpose Bench Stove (NW)",
        coords: [-122.51510, 37.96765],
        glb: "assets/images/bench.glb"
    },
    {
        name: "Storage Units for Emergency Inventory (NE)",
        coords: [-122.51400, 37.96770],
        glb: "assets/images/closet.glb"
    }
];

map.on('load', () => {

    initThreeJS();


    modelAssignments.forEach(item => {
        loadGLB(item.glb, item.coords[0], item.coords[1], 6);
    });
});


document.getElementById("zoomRegion").addEventListener("click", () => {
    map.flyTo({
        center: SRCD_CENTER,
        zoom: 6,
        pitch: 60,
        bearing: -20,
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
