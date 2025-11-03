mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/snbenoi/cmhjgr9hh000001rcf6cy38p0',
  center: [-122.5125, 37.9679],
  zoom: 14
});

map.on('load', () => {
  map.addSource('overlay', {
    type: 'image',
    url: 'https://docs.mapbox.com/mapbox-gl-js/assets/radar.gif', // Replace with your hosted image
    coordinates: [
      [-122.5155, 37.9685],
      [-122.5100, 37.9685],
      [-122.5100, 37.9645],
      [-122.5155, 37.9645]
    ]
  });

  map.addLayer({
    id: 'overlay-layer',
    type: 'raster',
    source: 'overlay',
    paint: { 'raster-opacity': 0.8 }
  });
});
