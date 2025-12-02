mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';


const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/light-v11",
    center: [-122.5135, 37.9670],
    zoom: 15.3,
    pitch: 60,
    bearing: -20
});

map.on("load", () => {
    map.addLayer({
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.6
        }
    });

    loadGeoJSONPoints();
    initThreeLayer();
});


function loadGeoJSONPoints() {
    fetch("https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/data/619data.geojson")
        .then(r => r.json())
        .then(data => {
            data.features.forEach(feat => {
                const el = document.createElement("div");
                el.className = "marker";

                new mapboxgl.Marker(el)
                    .setLngLat(feat.geometry.coordinates)
                    .setPopup(
                        new mapboxgl.Popup({ offset: 24 }).setHTML(`
                            <strong>${feat.properties.Landmark}</strong><br>
                            ${feat.properties.Address}<br><br>
                            <em>${feat.properties.Proposal}</em><br>
                            ${feat.properties["Proposal Link"] ? `<img src="${feat.properties["Proposal Link"]}" width="200">` : ""}
                        `)
                    )
                    .addTo(map);
            });
        });
}



let threeScene, threeCamera, threeRenderer;
const loader = new THREE.GLTFLoader();

function initThreeLayer() {
    const threeLayer = {
        id: "three-models",
        type: "custom",
        renderingMode: "3d",

        onAdd: function (map, gl) {
            threeScene = new THREE.Scene();
            threeCamera = new THREE.Camera();

            threeRenderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });

            threeRenderer.autoClear = false;

            loadModel("pond_pack.glb", [-122.51472840835794, 37.96556501819977]); // SOUTH
            loadModel("bench.glb", [-122.51172577538132, 37.96756766223187]);      // NW
            loadModel("closet.glb", [-122.51255653080607, 37.96784675899259]);     // NE
        },

        render: function (gl, matrix) {
            const m = new THREE.Matrix4().fromArray(matrix);
            threeCamera.projectionMatrix = m;
            threeRenderer.resetState();
            threeRenderer.render(threeScene, threeCamera);
            map.triggerRepaint();
        }
    };

    map.addLayer(threeLayer);
}


function loadModel(modelName, lngLat) {
    const modelUrl = `https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/${modelName}`;

    loader.load(modelUrl, gltf => {
        const model = gltf.scene;

        const merc = mapboxgl.MercatorCoordinate.fromLngLat(lngLat, 0);
        model.position.set(merc.x, merc.y, merc.z);
        model.scale.set(10, 10, 10);

        threeScene.add(model);
    });
}
