mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    config: { basemap: { theme: 'monochrome' }},
    zoom: 17,
    center: [-122.514522, 37.967155],
    pitch: 60,
    antialias: true
});

// ------- 3D MODEL BUILDER -------
function makeModelLayer(layerId, modelURL, lng, lat, alt = 0, rotation = [Math.PI/2,0,0]) {

    const merc = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], alt);

    const transform = {
        translateX: merc.x,
        translateY: merc.y,
        translateZ: merc.z,
        rotateX: rotation[0],
        rotateY: rotation[1],
        rotateZ: rotation[2],
        scale: merc.meterInMercatorCoordinateUnits()
    };

    return {
        id: layerId,
        type: "custom",
        renderingMode: "3d",

        onAdd: function (map, gl) {
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();

            const light = new THREE.DirectionalLight(0xffffff);
            light.position.set(0, -70, 100).normalize();
            this.scene.add(light);

            const light2 = new THREE.DirectionalLight(0xffffff);
            light2.position.set(0, 70, 100).normalize();
            this.scene.add(light2);

            const loader = new THREE.GLTFLoader();
            loader.load(modelURL, gltf => this.scene.add(gltf.scene));

            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });
            this.renderer.autoClear = false;
        },

        render: function (gl, matrix) {
            const rotX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1,0,0), transform.rotateX);
            const rotY = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,1,0), transform.rotateY);
            const rotZ = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0,0,1), transform.rotateZ);

            const m = new THREE.Matrix4().fromArray(matrix);

            const l = new THREE.Matrix4()
                .makeTranslation(transform.translateX, transform.translateY, transform.translateZ)
                .scale(new THREE.Vector3(transform.scale, -transform.scale, transform.scale))
                .multiply(rotX).multiply(rotY).multiply(rotZ);

            this.camera.projectionMatrix = m.multiply(l);
            this.renderer.resetState();
            this.renderer.render(this.scene, this.camera);
        }
    };
}

// ---------------- LOAD ----------------
map.on("load", () => {

    // Add models (REPLACE WITH YOUR GLTF URLs)
    map.addLayer(makeModelLayer(
        "forebayModel",
        "https://YOUR_URL/forebay.gltf",
        -122.514728, 37.965565
    ));

    map.addLayer(makeModelLayer(
        "benchModel",
        "https://YOUR_URL/bench.gltf",
        -122.512556, 37.967846
    ));

    map.addLayer(makeModelLayer(
        "closetModel",
        "https://YOUR_URL/closet.gltf",
        -122.511725, 37.967567
    ));

    // ---- TOGGLES ----
    function toggleLayer(checkboxId, layerId) {
        const box = document.getElementById(checkboxId);
        map.setLayoutProperty(layerId, "visibility", box.checked ? "visible" : "none");

        box.addEventListener("change", () => {
            map.setLayoutProperty(layerId, "visibility", box.checked ? "visible" : "none");
        });
    }

    toggleLayer("togglePond", "forebayModel");
    toggleLayer("toggleBench", "benchModel");
    toggleLayer("toggleCloset", "closetModel");

    // ---- CAMERA BUTTONS ----
    document.getElementById("zoomRegion").addEventListener("click", () => {
        map.flyTo({
            center: [-122.514522, 37.967155],
            zoom: 20,
            pitch: 60
        });
    });

    document.getElementById("resetView").addEventListener("click", () => {
        map.flyTo({
            center: [-122.514522, 37.967155],
            zoom: 17,
            pitch: 60
        });
    });

});
