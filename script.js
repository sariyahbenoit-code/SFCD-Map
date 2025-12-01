import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const MapboxExample = () => {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken =
      "pk.eyJ1Ijoic25iZW5vaSIsImEiOiJjbWg5Y2IweTAwbnRzMm5xMXZrNnFnbmY5In0.Lza9yPTlMhbHE5zHNRb1aA";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",   // REQUIRED for basemap themes
      config: {
        basemap: {
          theme: "monochrome",                  // <<— Black & white style
        },
      },
      center: [148.9819, -35.3981],
      zoom: 18,
      pitch: 60,
      antialias: true,
    });

    // 3D model config
    const modelOrigin = [148.9819, -35.39847];
    const modelAltitude = 0;
    const modelRotate = [Math.PI / 2, 0, 0];

    const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
      modelOrigin,
      modelAltitude
    );

    const modelTransform = {
      translateX: modelAsMercatorCoordinate.x,
      translateY: modelAsMercatorCoordinate.y,
      translateZ: modelAsMercatorCoordinate.z,
      rotateX: modelRotate[0],
      rotateY: modelRotate[1],
      rotateZ: modelRotate[2],
      scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
    };

    map.on("style.load", () => {
      const camera = new THREE.Camera();
      const scene = new THREE.Scene();

      // Lights
      scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(0, -70, 100));
      scene.add(new THREE.DirectionalLight(0xffffff, 1).position.set(0, 70, 100));

      // Load GLTF model
      new GLTFLoader().load(
        "https://docs.mapbox.com/mapbox-gl-js/assets/34M_17/34M_17.gltf",
        (gltf) => scene.add(gltf.scene)
      );

      const renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: map.getCanvas().getContext("webgl"), // SAfer call
        antialias: true,
      });
      renderer.autoClear = false;

      const customLayer = {
        id: "3d-model",
        type: "custom",
        renderingMode: "3d",
        render: (gl, matrix) => {
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

          const m = new THREE.Matrix4().fromArray(matrix);
          const l = new THREE.Matrix4()
            .makeTranslation(
              modelTransform.translateX,
              modelTransform.translateY,
              modelTransform.translateZ
            )
            .scale(
              new THREE.Vector3(
                modelTransform.scale,
                -modelTransform.scale,
                modelTransform.scale
              )
            )
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);

          camera.projectionMatrix = m.multiply(l);
          renderer.resetState();
          renderer.render(scen
