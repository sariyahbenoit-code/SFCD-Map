// =======================================================
//  SRCD MAP — VERSION 12_4
// =======================================================

mapboxgl.accessToken =
  "pk.eyJ1Ijoic2FyaXlhaGJlbm9pdG8iLCJhIjoiY20yY3h3dGluMDduZTNlbnd3NmJoMHR3YSJ9.hlCKAxXXfWRBdoYVpl_bjQ";

const INITIAL_VIEW = {
  center: [-122.51444, 37.96703], 
  zoom: 15.5,                    
  pitch: 60,
  bearing: -17.6
};

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v11",
  ...INITIAL_VIEW,
  antialias: true
});


map.addControl(new mapboxgl.NavigationControl());

map.on("load", () => {

  map.addSource("srcd-points", {
    type: "geojson",
    data: "assets/data/srcd_points.geojson"
  });


  map.addLayer({
    id: "srcd-point-layer",
    type: "circle",
    source: "srcd-points",
    paint: {
      "circle-radius": 8,
      "circle-color": "#ff5500",
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2
    }
  });


  map.on("click", "srcd-point-layer", (e) => {
    const props = e.features[0].properties;
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
          <strong>${props.name || "Unnamed Point"}</strong><br>
          ${props.description || ""}
      `)
      .addTo(map);
  });

  map.on("mouseenter", "srcd-point-layer", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "srcd-point-layer", () => {
    map.getCanvas().style.cursor = "";
  });

 
  loadGLBModel(
    "assets/images/pond_pack.glb",
    [-122.51444, 37.96703], 
    "pond-model"
  );

  loadGLBModel(
    "assets/images/bench.glb",
    [-122.51444, 37.96703],
    "bench-model"
  );

  loadGLBModel(
    "assets/images/closet.glb",
    [-122.51444, 37.96703], 
    "closet-model"
  );
});

function loadGLBModel(modelURL, lngLat, modelId) {
  const modelOrigin = lngLat;
  const modelAltitude = 0;
  const modelRotate = [Math.PI / 2, 0, 0];

  const mercator = mapboxgl.MercatorCoordinate.fromLngLat(
    { lng: modelOrigin[0], lat: modelOrigin[1] },
    modelAltitude
  );

  const modelTransform = {
    translateX: mercator.x,
    translateY: mercator.y,
    translateZ: mercator.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: mercator.meterInMercatorCoordinateUnits()
  };

  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({
    canvas: map.getCanvas(),
    context: map.painter.context.gl,
    antialias: true
  });
  renderer.autoClear = false;

  const scene = new THREE.Scene();

  const camera = new THREE.Camera();
  const loader = new THREE.GLTFLoader();
  loader.load(modelURL, (gltf) => {
    const model = gltf.scene;
    scene.add(model);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    function render() {
      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ
      );

      const m = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ)
        .scale(
          new THREE.Vector3(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale
          )
        );

      camera.projectionMatrix = map.getFreeCameraOptions().projectionMatrix;

      renderer.resetState();
      renderer.render(scene, camera);

      map.triggerRepaint();
    }

    map.on("render", render);
  });
}

document.getElementById("reset-view").addEv
