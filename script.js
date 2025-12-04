mapboxgl.accessToken =
    "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";


const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/standard",
    config: { basemap: { theme: "monochrome" } },

    center: [-122.51444, 37.96703 ],
], 
    zoom: 17.5,
    pitch: 60,
    antialias: true
});

fetch("data/619data.geojson")
    .then(r => r.json())
    .then(geojson => {
        map.on("load", () => {
            map.addSource("srcd-points", {
                type: "geojson",
                data: geojson
            });


            map.addLayer({
                id: "srcd-points-layer",
                type: "circle",
                source: "srcd-points",
                layout: { visibility: "visible" },
                paint: {
                    "circle-radius": 8,
                    "circle-color": "#ff5500",
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#ffffff"
                }
            }, "road-label"); 


            map.on("click", "srcd-points-layer", (e) => {
                const props = e.features[0].properties;

                const html = `
                    <strong>${props.Landmark}</strong><br>
                    ${props.Address || ""}<br><br>
                    ${props.Proposal || ""}
                `;

                new mapboxgl.Popup()
                    .setLngLat(e.lngLat)
                    .setHTML(html)
                    .addTo(map);
            });


            add3DModels();
        });
    });

function add3DModels() {
    const THREE = window.THREE;
    const loader = new THREE.GLTFLoader();

    const models = [
        {
            id: "solar-forebay-south",
            file: "assets/images/pond_pack.glb",
            coords: [-122.51472840835794, 37.96556501819977]
        },
        {
            id: "bench-nw",
            file: "assets/images/bench.glb",
            coords: [-122.51255653080607, 37.96784675899259]
        },
        {
            id: "closet-ne",
            file: "assets/images/closet.glb",
            coords: [-122.51172577538132, 37.96756766223187]
        }
    ];

    models.forEach(model => {
        const mc = mapboxgl.MercatorCoordinate.fromLngLat(model.coords, 0);

        const customLayer = {
            id: model.id,
            type: "custom",
            renderingMode: "3d",

            onAdd: (map, gl) => {
                this.camera = new THREE.Camera();
                this.scene = new THREE.Scene();

       
                const light = new THREE.DirectionalLight(0xffffff, 1.2);
                light.position.set(100, 100, 200);
                this.scene.add(light);

   
                loader.load(model.file, (gltf) => {
                    gltf.scene.position.set(0, 0, 0);
                    gltf.scene.scale.set(1, 1, 1);
                    this.scene.add(gltf.scene);
                });

    
                this.renderer = new THREE.WebGLRenderer({
                    canvas: map.getCanvas(),
                    context: gl,
                    antialias: true
                });

                this.renderer.autoClear = false;
            },

            render: (gl, matrix) => {
                const rotationX = new THREE.Matrix4().makeRotationAxis(
                    new THREE.Vector3(1, 0, 0), Math.PI / 2
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

   
        map.addLayer(customLayer, "srcd-points-layer");
    });
}


document.getElementById("toggle-3d").addEventListener("change", (e) => {
    const visible = e.target.checked ? "visible" : "none";

    ["solar-forebay-south", "bench-nw", "closet-ne"].forEach(id => {
        if (map.getLayer(id)) {
            map.setLayoutProperty(id, "visibility", visible);
        }
    });
});

document.getElementById("zoom-out").addEventListener("click", () => {
    map.easeTo({
        center: [-122.515, 37.97],
        zoom: 13.5,
        duration: 1200
    });
});

document.getElementById("zoom-reset").addEventListener("click", () => {
    map.easeTo({
        center: [-122.513922, 37.966597],
        zoom: 17.5,
        pitch: 60,
        duration: 1200
    });
});
