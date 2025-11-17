mapboxgl.accessToken =
  "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/snbenoi/cmhjgr9hh000001rcf6cy38p0",
    center: [-122.5125, 37.9679],
    zoom: 13,
    pitch: 60,
    bearing: 0,
    antialias: true
});

// 🌎 ADD COMPASS + TILT CONTROL
map.addControl(new mapboxgl.NavigationControl({
    visualizePitch: true,
    showCompass: true
}), 'top-right');
