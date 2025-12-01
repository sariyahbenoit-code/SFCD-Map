mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    center: [-122.5125, 37.9679],
    zoom: 17.8,   
    pitch: 70,
    bearing: -20,
    antialias: true,
    config: {
        basemap: { theme: "monochrome" }  
    }
});

const GEOJSON_URL =
  "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/data/619data.geojson";

const MODEL_DATA = [
    {
        name: "Solar Powered Forebay and Expanded Marsh Edge",
        coords: [-122.51472840835794, 37.96556501819977],
        glb: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/pond_pack.glb"
    },
    {
        name: "Modular and Multipurpose Bench Stove",
        coords: [-122.51255653080607, 37.96784675899259],
        glb: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/bench.glb"
    },
    {
        name: "Storage Units Used for Emergency Inventory",
        coords: [-122.51172577538132, 37.96756766223187],
        glb: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/assets/images/closet.glb"
    }
];

let labels = [];

map.on("load", async () => {
    map.setConfigProperty("basemap", "lightPreset", "dusk");

    const geojson = await fetch(GEOJSON_URL).then(r => r.json());

    map.addSource("points", {
        type: "geojson",
        data: geojson
    });

    map.addLayer({
        id: "point-layer",
        type: "circle",
        source: "points",
        paint: {
            "circle-radius": 10,
            "circle-color": "#ff5500",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff"
        }
    });

    map.on("click", "point-layer", (e) => {
        const props = e.features[0].properties;
        const coords = e.features[0].geometry.coordinates;

        let html = `<h3>${props.Landmark}</h3>`;

        Object.keys(props).forEach(key => {
            if (props[key])
                html += `<p><strong>${key}:</strong> ${props[key]}</p>`;
        });

        new mapboxgl.Popup()
            .setLngLat(coords)
            .setHTML(html)
            .addTo(map);
    });

    map.on("mouseenter", "point-layer", () => {
        map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "point-layer", () => {
        map.getCanvas().style.cursor = "";
    });

    const THREE = window.THREE;

    const customLayer = {
        id: "3d-models",
        type: "custom",
        renderingMode: "3d",

        onAdd: function (map, gl) {
            this.camera = new THREE.Camera();
            this.scene = new THREE.Scene();

            const light1 = new THREE.DirectionalLight(0xffffff, 1);
            light1.position.set(0, -70, 100).normalize();
            this.scene.add(light1);

            const light2 = new THREE.DirectionalLight(0xffffff, 1);
            light2.position.set(0, 70, 100).normalize();
            this.scene.add(light2);

            this.renderer = new THREE.WebGLRenderer({
                canvas: map.getCanvas(),
                context: gl,
                antialias: true
            });
            this.renderer.autoClear = false;

            const loader = new THREE.GLTFLoader();

            MODEL_DATA.forEach(item => {
                loader.load(item.glb, (gltf) => {
                    const model = gltf.scene;

                    const merc = mapboxgl.MercatorCoordinate.fromLngLat(item.coords, 0);
                    const scale = merc.meterInMercatorCoordinateUnits();

                    model.scale.set(scale * 0.08, scale * 0.08, scale * 0.08);
                    model.position.set(merc.x, merc.y, merc.z);

                    this.scene.add(model);

                    const div = document.createElement("div");
                    div.className = "model-label";
                    div.innerText = item.name;
                    document.body.appendChild(div);
                    labels.push({ div, coords: item.coords });
                });
            });
        },

        render: function (gl, matrix) {
            this.camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);
            this.renderer.state.reset();
            this.renderer.render(this.scene, this.camera);
            map.triggerRepaint();

            labels.forEach(l => {
                const p = map.project(l.coords);
                l.div.style.left = p.x + "px";
                l.div.style.top = p.y + "px";
            });
        }
    };

    map.addLayer(customLayer);
});
