mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/standard",
  config: {
    basemap: { theme: "monochrome" }
  },
  center: [-122.5125, 37.9677],
  zoom: 17.8,
  pitch: 60,
  antialias: true
});


const geojsonUrl =
  "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/data/619data.geojson";

map.on("load", () => {
  map.setConfig({ basemap: { theme: "monochrome" } });

  fetch(geojsonUrl)
    .then((res) => res.json())
    .then((data) => {
      map.addSource("points", {
        type: "geojson",
        data: data
      });

      map.addLayer({
        id: "points-layer",
        type: "circle",
        source: "points",
        paint: {
          "circle-radius": 10,
          "circle-color": "#ff5500",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff"
        }
      });

      map.on("click", "points-layer", (e) => {
        const props = e.features[0].properties;

        const html = `
          <strong>${props.Landmark || ""}</strong><br>
          <em>${props.Address || ""}</em><br><br>
          <strong>Proposal:</strong> ${props.Proposal || ""}<br><br>
          <a href="${props["Proposal Link"]}" target="_blank">Proposal Link</a><br>
          <a href="${props["Existing Link"]}" target="_blank">Existing Site</a>
        `;

        new mapboxgl.Popup()
          .setLngLat(e.features[0].geometry.coordinates)
          .setHTML(html)
          .addTo(map);
      });

      map.on("mouseenter", "points-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "points-layer", () => {
        map.getCanvas().style.cursor = "";
      });

      addAllGLBModels();
    });
});


function addCustom3DModel(id, glbPath, lng, lat, scale = 1) {
  const modelAltitude = 0;
  const modelRotate = [Math.PI / 2, 0, 0];

  const merc = mapboxgl.MercatorCoordinate.fromLngLat([lng, lat], modelAltitude);

  const transform = {
    translateX: merc.x,
    translateY: merc.y,
    translateZ: merc.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: merc.meterInMercatorCoordinateUnits() * scale
  };

  const customLayer = {
    id: id,
    type: "custom",
    renderingMode: "3d",

    onAdd: function (map, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      const light1 = new THREE.DirectionalLight(0xffffff);
      light1.position.set(0, -70, 100).normalize();

      const light2 = new THREE.DirectionalLight(0xffffff);
      light2.position.set(0, 70, 100).normalize();

      this.scene.add(light1);
      this.scene.add(light2);

      const loader = new THREE.GLTFLoader();
      loader.load(glbPath, (gltf) => {
        this.scene.add(gltf.scene);
      });

      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });
      this.renderer.autoClear = false;
    },

    render: function (gl, matrix) {
      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        transform.rotateX
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        transform.rotateY
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        transform.rotateZ
      );

      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(transform.translateX, transform.translateY, transform.translateZ)
        .scale(
          new THREE.Vector3(
            transform.scale,
            -transform.scale,
            transform.scale
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
      map.triggerRepaint();
    }
  };

  map.addLayer(customLayer);
}

function addAllGLBModels() {
  addCustom3DModel(
    "south-model",
    "models/pond_pack.glb",
    -122.51472840835794,
    37.96556501819977,
    0.8
  );

  addCustom3DModel(
    "nw-model",
    "models/bench.glb",
    -122.51255653080607,
    37.96784675899259,
    1.0
  );

  addCustom3DModel(
    "ne-model",
    "models/closet.glb",
    -122.51172577538132,
    37.96756766223187,
    1.0
  );
}
