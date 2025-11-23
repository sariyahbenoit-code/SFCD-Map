import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const MapboxExample = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      config: { basemap: { theme: 'monochrome' }},
      zoom: 20,
      center: [-122.51465, 37.96558],  // your required coordinates
      pitch: 60,
      antialias: true
    });

    // -------------------------------------------------------
    // Load your 619data.geojson
    // -------------------------------------------------------
    fetch('/data/619data.geojson')
      .then(res => res.json())
      .then(geojson => {
        map.on('load
