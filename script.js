
function detectBuildingLayer(map) {
    const layers = map.getStyle().layers;
    return layers.find(l => l.type === "fill-extrusion");
}

function detectCustomModelLayer(map) {
    const layers = map.getStyle().layers;


    return layers.find(l =>
        l.type === "custom" ||
        (l.id && l.id.toLowerCase().includes("model")) ||
        (l.id && l.id.toLowerCase().includes("3d"))
    );
}

const buildingLayer = detectBuildingLayer(map);
const modelLayer = detectCustomModelLayer(map);

//3d building visibility
if (buildingLayer) {
    console.log("3D BUILDINGS DETECTED:", buildingLayer.id);
    map.setLayoutProperty(buildingLayer.id, "visibility", "visible");
} else {
    console.warn("No 3D buildings layer detected.");
}

//layer order
if (buildingLayer && modelLayer) {
    try {
        // 3d buildings and .glbs
        map.moveLayer(buildingLayer.id, modelLayer.id);
        console.log("Moved 3D buildings below:", modelLayer.id);
    } catch (e) {
        console.warn("Could not move building layer:", e);
    }
}

if (modelLayer) {
    try {
        // 3d and pts
        map.moveLayer(modelLayer.id, "points-layer");
        console.log("Moved 3D models below points");
    } catch (e) {
        console.warn("Could not move model layer:", e);
    }
}
