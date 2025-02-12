import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import spline from "./spline";

const w = window.innerWidth;
const h = window.innerHeight;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.3);
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 100);
bloomPass.threshold = 0.002;
bloomPass.strength = 1.5;
bloomPass.radius = 0.8;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

const points = spline.getPoints(100);
const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
const lineMat = new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0 });

const line = new THREE.Line(lineGeo, lineMat);

const tubeGeo = new THREE.TubeGeometry(spline, 222, 0.65, 16, true);

const edges = new THREE.EdgesGeometry(tubeGeo, 0.2);
const linesMat = new THREE.LineBasicMaterial({
  color: 0x0099ff,
  linewidth: 1.0,
  opaicty: 0.8,
  transparent: true,
  emissive: new THREE.Color(0x0055ff),
});

const tubeLines = new THREE.LineSegments(edges, linesMat);
scene.add(tubeLines);

const addBoxes = (n = 55) => {
  const size = 0.075;
  const boxGeo = new THREE.BoxGeometry(size, size, size);

  for (let i = 0; i < n; i++) {
    const boxMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);

    const p = (i / n + Math.random() * 0.1) % 1;
    const pos = tubeGeo.parameters.path.getPointAt(p);
    pos.x += Math.random() - 0.4;
    pos.z += Math.random() - 0.4;
    box.position.copy(pos);
    const rote = new THREE.Vector3(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    box.rotation.set(rote.x, rote.y, rote.z);
    const edges = new THREE.EdgesGeometry(boxGeo, 0.2);
    const color = new THREE.Color().setHSL(1.0 + p, 1, 0.5);
    const linesMat = new THREE.LineBasicMaterial({ color });

    const boxLines = new THREE.LineSegments(edges, linesMat);

    boxLines.position.copy(pos);
    boxLines.rotation.set(rote.x, rote.y, rote.z);

    scene.add(boxLines);
  }
};

addBoxes(55);

const updateCamera = () => {
  const time = Date.now() * 0.05;
  const loopDuration = 8 * 1000;
  const t = (time % loopDuration) / loopDuration;

  const position = tubeGeo.parameters.path.getPointAt(t);
  const lookAt = tubeGeo.parameters.path.getPointAt((t + 0.03) % 1);

  camera.position.copy(position);
  camera.lookAt(lookAt);
};

const animate = () => {
  requestAnimationFrame(animate);

  updateCamera();
  composer.render(scene, camera);
  controls.update();
};

window.addEventListener("resize", () => {
  const updatedW = window.innerWidth;
  const updatedH = window.innerHeight;

  camera.aspect = updatedW / updatedH;
  camera.updateProjectionMatrix();

  renderer.setSize(updatedW, updatedH);
});

animate();
