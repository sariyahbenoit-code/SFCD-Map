
mapboxgl.accessToken = "YOUR_MAPBOX_TOKEN";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/light-v11",
    center: [-122.4194, 37.7749],
    zoom: 14,
    pitch: 60,
    bearing: -20,
    antialias: true
});


let scene, camera, renderer;
let threeLoaded = false;

const MODEL_PATHS = {
    bench: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/bench.glb",
    closet: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/closet.glb",
    pond: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/pond_pack.glb"
};


function initThreeJS() {
    const canvas = map.getCanvas();
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        context: canvas.getContext("webgl"),
        antialias: true
    });
    renderer.autoClear = false;

    scene = new THREE.Scene();

    camera = new THREE.Camera();

    threeLoaded = true;
}


function loadGLB(url, callback) {
    const loader = new THREE.GLTFLoader();

    loader.load(
        url,
        gltf => {
            const model = gltf.scene;
            model.scale.set(1, 1, 1);
            console.log("Loaded GLB:", url);
            callback(model);
        },
        undefined,
        error => console.error("GLB Load Error:", url, error)
    );
}


function addModels() {

    loadGLB(MODEL_PATHS.bench, model => {
        model.position.set(0, 0, 0);
        scene.add(model);
    });


    loadGLB(MODEL_PATHS.closet, model => {
        model.position.set(5, 0, 0);
        scene.add(model);
    });


    loadGLB(MODEL_PATHS.pond, model => {
        model.position.set(-5, 0, 0);
        scene.add(model);
    });
}


map.on("style.load", () => {
    if (!threeLoaded) initThreeJS();
    addModels();

    map.on("render", () => {
        renderer.resetState();
        renderer.render(scene, camera);
    });
});


window.addEventListener("resize", () => {
    const canvas = map.getCanvas();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
});
