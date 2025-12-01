mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    center: [-122.5125, 37.9679],
    zoom: 13, // zoomed out a bit from previous 12
    pitch: 60,
    bearing: 0,
    antialias: true
});

const modelData = [
    {
        coords: [-122.5115, 37.9675],
        glb: 'https://sariyahbenoit-code.github.io/SRCD-Map/assets/images/pond_pack.glb',
        label: 'Solar Powered Forebay and Extended Marsh Edge'
    },
    {
        coords: [-122.5374, 37.9841],
        glb: 'https://sariyahbenoit-code.github.io/SRCD-Map/assets/images/bench.glb',
        label: 'Multipurpose seating'
    },
    {
        coords: [-122.5036, 37.972],
        glb: 'https://sariyahbenoit-code.github.io/SRCD-Map/assets/images/closet.glb',
        label: 'Storage units converted into Emergency Supply Inventory'
    }
];

const labels = [];

map.on('load', () => {

    fetch('https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/data/619data.geojson')
        .then(res => res.json())
        .then(geojson => {

            const THREE = window.THREE;

            const customLayer = {
                id: '3d-models',
                type: 'custom',
                renderingMode: '3d',
                onAdd: function(map, gl) {
                    this.camera = new THREE.Camera();
                    this.scene = new THREE.Scene();

                    const directionalLight = new THREE.DirectionalLight(0xffffff);
                    directionalLight.position.set(0, -70, 100).normalize();
                    this.scene.add(directionalLight);

                    const directionalLight2 = new THREE.DirectionalLight(0xffffff);
                    directionalLight2.position.set(0, 70, 100).normalize();
                    this.scene.add(directionalLight2);

                    this.renderer = new THREE.WebGLRenderer({
                        canvas: map.getCanvas(),
                        context: gl,
                        antialias: true
                    });
                    this.renderer.autoClear = false;

                    this.models = [];

                    const loader = new THREE.GLTFLoader();

                    modelData.forEach((modelPoint, index) => {
                        loader.load(modelPoint.glb, (gltf) => {
                            const sceneModel = gltf.scene;

                            const merc = mapboxgl.MercatorCoordinate.fromLngLat(
                                modelPoint.coords, 0
                            );

                            const scale = merc.meterInMercatorCoordinateUnits();
                            sceneModel.scale.set(scale * 0.05, scale * 0.05, scale * 0.05);

                            sceneModel.position.set(merc.x, merc.y, merc.z);

                            this.scene.add(sceneModel);
                            this.models.push({
                                mesh: sceneModel,
                                data: geojson.features[index],
                                label: modelPoint.label,
                                coords: modelPoint.coords
                            });

                            const labelDiv = document.createElement('div');
                            labelDiv.className = 'model-label';
                            labelDiv.innerText = modelPoint.label;
                            document.body.appendChild(labelDiv);
                            labels.push({ div: labelDiv, coords: modelPoint.coords });
                        });
                    });
                },
                render: function(gl, matrix) {
                    const m = new THREE.Matrix4().fromArray(matrix);
                    this.models && this.models.forEach((mObj) => {
                        // can add per-model rotation if desired
                    });

                    this.camera.projectionMatrix = m;
                    this.renderer.resetState();
                    this.renderer.render(this.scene, this.camera);
                    map.triggerRepaint();

                    // Update HTML labels
                    labels.forEach(l => {
                        const pos = map.project(l.coords);
                        l.div.style.left = pos.x + 'px';
                        l.div.style.top = pos.y + 'px';
                    });
                }
            };

            map.addLayer(customLayer);

            map.on('click', (e) => {
                const mouseLngLat = [e.lngLat.lng, e.lngLat.lat];
                let clickedFeature = null;

                customLayer.models.forEach((mObj) => {
                    const dist = Math.sqrt(
                        Math.pow(mouseLngLat[0] - mObj.coords[0], 2) +
                        Math.pow(mouseLngLat[1] - mObj.coords[1], 2)
                    );
                    if(dist < 0.001) clickedFeature = mObj;
                });

                if(clickedFeature) {
                    const props = clickedFeature.data.properties;
                    const html = `
                        <h3>${props.title || clickedFeature.label}</h3>
                        <p><strong>Address:</strong> ${props.address || 'N/A'}</p>
                        <p>${props.proposal || 'N/A'}</p>
                        <p><strong>Coordinates:</strong> ${clickedFeature.coords[1].toFixed(6)}, ${clickedFeature.coords[0].toFixed(6)}</p>
                    `;
                    new mapboxgl.Popup()
                        .setLngLat(clickedFeature.coords)
                        .setHTML(html)
                        .addTo(map);

                    document.getElementById('feature-info').innerHTML = html;
                }
            });

            // Layer toggle controls
            document.getElementById('toggle-models').addEventListener('change', (e) => {
                customLayer.scene.visible = e.target.checked;
            });

            document.getElementById('toggle-labels').addEventListener('change', (e) => {
                labels.forEach(l => l.div.style.display = e.target.checked ? 'block' : 'none');
            });
        });
});
