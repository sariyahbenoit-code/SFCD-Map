map.on("load", () => {
  // 1. Add your 3D models layer
  map.addLayer(customLayer);

  // 2. Add your full 619data.geojson as a source
  map.addSource("srcd-geometry", {
    type: "geojson",
    data: "https://raw.githubusercontent.com/sariyahbenoit-code/SRCD-Map/main/data/619data.geojson"
  });

  // 3. Big polygon (green)
  map.addLayer({
    id: "srcd-polygon-fill",
    type: "fill",
    source: "srcd-geometry",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "fill-color": "#00ff00",
      "fill-opacity": 0.4
    }
  });

  map.addLayer({
    id: "srcd-polygon-outline",
    type: "line",
    source: "srcd-geometry",
    filter: ["==", ["geometry-type"], "Polygon"],
    paint: {
      "line-color": "#008800",
      "line-width": 2
    }
  });

  // 4. LineString (red)
  map.addLayer({
    id: "srcd-line",
    type: "line",
    source: "srcd-geometry",
    filter: ["==", ["geometry-type"], "LineString"],
    paint: {
      "line-color": "#ff0000",
      "line-width": 3
    }
  });

  // 5. Add your imagePoints as a source
  map.addSource("image-points", {
    type: "geojson",
    data: imagePoints
  });

  // 6. Add a circle layer for the points *after* polygons, so they sit on top
  map.addLayer({
    id: "image-points-layer",
    type: "circle",
    source: "image-points",
    paint: {
      "circle-radius": 6,
      "circle-color": "#ff5500",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff"
    }
  });

  // 7. Popups for image points
  map.on("click", "image-points-layer", (e) => {
    const feature = e.features && e.features[0];
    if (!feature) return;

    const coords = feature.geometry.coordinates.slice();
    const title = feature.properties.Landmark || "";
    const imgUrl = feature.properties.PopupMedia || "";

    const html = `
      <div style="max-width:700px;">
        <h3 style="margin:0 0 6px;font-family:'Roboto Mono',monospace;">${title}</h3>
        <img src="${imgUrl}" alt="${title}" style="max-width:100%;height:auto;display:block;border-radius:4px;margin-top:4px;">
      </div>
    `;

    new mapboxgl.Popup({ closeOnClick: true })
      .setLngLat(coords)
      .setHTML(html)
      .addTo(map);
  });

  map.on("mouseenter", "image-points-layer", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  map.on("mouseleave", "image-points-layer", () => {
    map.getCanvas().style.cursor = "";
  });

  // 8. Region zoom buttons
  const regionBounds = [
    [-122.5155, 37.9645], // SW
    [-122.5115, 37.9695]  // NE
  ];

  const zoomRegionBtn = document.getElementById("zoomRegion");
  const resetViewBtn = document.getElementById("resetView");

  if (zoomRegionBtn) {
    zoomRegionBtn.addEventListener("click", () => {
      map.fitBounds(regionBounds, { padding: 40, pitch: 60, bearing: 0 });
    });
  }

  if (resetViewBtn) {
    resetViewBtn.addEventListener("click", () => {
      map.easeTo({
        center: targetCenter,
        zoom: 17,
        pitch: 60,
        bearing: 0
      });
    });
  }

  // 9. Checkbox toggles
  const pondCheckbox = document.getElementById("togglePond");
  const benchCheckbox = document.getElementById("toggleBench");
  const closetCheckbox = document.getElementById("toggleCloset");

  if (pondCheckbox) {
    pondCheckbox.checked = showPond;
    pondCheckbox.addEventListener("change", (e) => {
      showPond = e.target.checked;
      map.triggerRepaint();
    });
  }

  if (benchCheckbox) {
    benchCheckbox.checked = showBench;
    benchCheckbox.addEventListener("change", (e) => {
      showBench = e.target.checked;
      map.triggerRepaint();
    });
  }

  if (closetCheckbox) {
    closetCheckbox.checked = showCloset;
    closetCheckbox.addEventListener("change", (e) => {
      showCloset = e.target.checked;
      map.triggerRepaint();
    });
  }
});
