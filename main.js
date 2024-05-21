/*!
Pulsating Spheres
Copyright (c) 2024 by Wakana Y.K. (https://codepen.io/wakana-k/pen/pomgZOy)
*/

"use strict";
console.clear();

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { Reflector } from "three/addons/objects/Reflector.js";

(function () {
  let camera, scene, renderer, controls, sphereGeometry, torus, sampler, instancedMesh, texture, cameraHelper, box;
  const u = new THREE.Vector3(),
        h = new THREE.Vector3(),
        matrix = new THREE.Matrix4(),
        tempObject = new THREE.Object3D(),
        config = {
          fov: 50,
          radius: 50,
          tube: 2,
          extrusionSegments: 100,
          radiusSegments: 20,
          samplerCount: 5000,
          animationView: true,
          cameraHelper: false
        },
        scales = new Float32Array(config.samplerCount);

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  (function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color("pink");
    if (config.animationView) {
      scene.fog = new THREE.FogExp2("pink", 0.08);
    }

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 0, 4 * config.radius);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.maxDistance = camera.far / 2;
    controls.target.set(0, 0, 0);
    controls.update();

    scene.add(new THREE.AmbientLight("white", 1));

    texture = new THREE.TextureLoader().load("stef.png");
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;

    window.addEventListener("resize", onWindowResize);
  })();

  const object = new THREE.Object3D();
  scene.add(object);

  torus = new THREE.TorusGeometry(config.radius, config.tube, config.radiusSegments, config.extrusionSegments);
  const material = new THREE.MeshBasicMaterial({ color: "pink", side: THREE.DoubleSide });
  if (!config.animationView) {
    material.wireframe = true;
  }
  const torusMesh = new THREE.Mesh(torus, material);

  (function sampleTorus() {
    sampler = new MeshSurfaceSampler(torusMesh).build();
    sphereGeometry = new THREE.SphereGeometry(0.2, 32, 16);
    instancedMesh = new THREE.InstancedMesh(
      sphereGeometry,
      new THREE.MeshStandardMaterial({
        color: "white",
        metalness: 1,
        roughness: 0,
        envMap: texture
      }),
      config.samplerCount
    );

    for (let i = 0; i < config.samplerCount; i++) {
      sampler.sample(u, h);
      scales[i] = Math.random();
      tempObject.position.copy(u);
      tempObject.updateMatrix();
      instancedMesh.setMatrixAt(i, tempObject.matrix);

      const color = new THREE.Color().setHSL(Math.random(), 1, 0.6);
      instancedMesh.setColorAt(i, color);
    }
    object.add(instancedMesh);
  })();

  const viewCamera = new THREE.PerspectiveCamera(config.fov, window.innerWidth / window.innerHeight, 0.01, config.radius);
  viewCamera.position.set(0, config.radius, 0);
  viewCamera.lookAt(-1, config.radius, 0);
  scene.add(viewCamera);

  cameraHelper = new THREE.CameraHelper(viewCamera);
  scene.add(cameraHelper);

  box = new THREE.Mesh(
    new THREE.BoxGeometry(3 * config.tube, 3 * config.tube, 3 * config.tube),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  box.position.set(0, config.radius, 0);
  box.lookAt(-1, config.radius, 0);
  scene.add(box);

  cameraHelper.visible = config.cameraHelper;
  box.visible = config.cameraHelper;

  (function animate() {
    requestAnimationFrame(animate);
    controls.update();

    (function updateSpheres() {
      const time = 0.001 * Date.now();
      object.rotation.z = -time / 30;

      if (instancedMesh) {
        for (let i = 0; i < config.samplerCount; i++) {
          instancedMesh.getMatrixAt(i, matrix);
          matrix.decompose(tempObject.position, tempObject.quaternion, tempObject.scale);

          let speed = 0.0052;
          if (i % 3 === 1) speed = 0.0085;
          if (i % 3 === 2) speed = 0.0078;
          scales[i] += speed;
          if (scales[i] > 1) scales[i] = 0;

          const scale = Math.cos(scales[i] * Math.PI * 2) / 4 + 0.78;
          tempObject.scale.set(scale, scale, scale);
          tempObject.updateMatrix();
          instancedMesh.setMatrixAt(i, tempObject.matrix);
        }

        instancedMesh.instanceMatrix.needsUpdate = true;
        instancedMesh.computeBoundingSphere();
      }

      cameraHelper.update();
      renderer.render(scene, config.animationView ? viewCamera : camera);
    })();
  })();


  const tl = gsap
	.timeline({ repeat: 20, repeatDelay: 2 })
	.from(".mask div", {
		xPercent: gsap.utils.wrap([100, -100]),
		stagger: 0.8,
		opacity: 0,
		ease: "circ.inOut"
	})
	.to(
		".mask div",
		{
			opacity: 0,
			yPercent: gsap.utils.wrap([-100, 100]),
			duration: 1.5,
			ease:"none"
		},
		">2"
	);

// gsap.fromTo(".bar", {x:-200}, {x:200, duration:20, ease:"none", repeat:3, yoyo:true})
// start learning GreenSock for free
// https://www.creativeCodingClub.com


})();
