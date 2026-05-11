import { useEffect, useRef } from "react";
import * as THREE from "three/webgpu";
import {
  Fn, uniform, float, vec3, instancedArray, instanceIndex,
  uv, positionGeometry, positionWorld,
  sin, cos, pow, smoothstep, mix, sqrt, select, hash,
  time, deltaTime, PI, mx_noise_float,
} from "three/tsl";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function HeroGrass() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    
    let isCancelled = false;
    let renderer: THREE.WebGPURenderer | null = null;
    
    const isMobile = window.innerWidth < 768;
    const BLADE_COUNT = isMobile ? 25000 : 80000;
    const FIELD_SIZE = 20;
    const BACKGROUND_HEX = "#c8c4a0";
    const GROUND_HEX = "#5a5534";
    const BLADE_BASE_HEX = "#2a330e";
    const BLADE_TIP_HEX = "#8ec438";

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 6, 14.5);

    renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL: false, alpha: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    
    mountRef.current.appendChild(renderer.domElement);
    
    const updateSize = () => {
      if (!mountRef.current || !renderer) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    updateSize();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, -0.75, 0);
    controls.minDistance = 3;
    controls.maxDistance = 25;
    controls.enablePan = false;

    // ─── GPU Buffers ──────────────────────────────────────────────────────────────
    const bladeData = instancedArray(BLADE_COUNT, "vec4");
    const bendState = instancedArray(BLADE_COUNT, "vec4");
    const bladeBound = instancedArray(BLADE_COUNT, "float");

    // ─── Uniforms ─────────────────────────────────────────────────────────────────
    const mouseWorld = uniform(new THREE.Vector3(99999, 0, 99999));
    const mouseRadius = uniform(2.2);
    const mouseStrength = uniform(1.8);
    const icoWorld = uniform(new THREE.Vector3(99999, 0, 99999));
    const icoRadius = uniform(2.5);
    const icoStrength = uniform(2.0);

    const grassDensity = uniform(1);
    const windSpeed = uniform(1.8);
    const windAmplitude = uniform(0.2);
    const bladeWidth = uniform(1.6);
    const bladeHeight = uniform(0.65);
    const bladeLean = uniform(1.1);
    const noiseAmplitude = uniform(1.85);
    const noiseFrequency = uniform(0.3);
    const noise2Amplitude = uniform(0.2);
    const noise2Frequency = uniform(15);
    const bladeColorVariation = uniform(0.93);
    const bladeGradientFalloff = uniform(1.7);
    const groundRadius = uniform(9.2);
    const groundFalloff = uniform(1.6);
    const bladeBaseColor = uniform(new THREE.Color(BLADE_BASE_HEX));
    const bladeTipColor = uniform(new THREE.Color(BLADE_TIP_HEX));
    const backgroundColor = uniform(new THREE.Color(BACKGROUND_HEX));
    const groundColor = uniform(new THREE.Color(GROUND_HEX));

    const noise2D = Fn(([x, z]) => mx_noise_float(vec3(x, float(0), z)).mul(0.5).add(0.5));

    // ─── Compute Init ─────────────────────────────────────────────────────────────
    const computeInit = Fn(() => {
      const blade = bladeData.element(instanceIndex);
      const col = instanceIndex.mod(283);
      const row = instanceIndex.div(283);
      const jx = hash(instanceIndex).sub(0.5);
      const jz = hash(instanceIndex.add(7919)).sub(0.5);
      const wx = col.toFloat().add(jx).div(float(283)).sub(0.5).mul(FIELD_SIZE);
      const wz = row.toFloat().add(jz).div(float(283)).sub(0.5).mul(FIELD_SIZE);
      blade.x.assign(wx);
      blade.y.assign(wz);
      blade.z.assign(hash(instanceIndex.add(1337)).mul(PI.mul(2)));
      const n1 = noise2D(wx.mul(noiseFrequency), wz.mul(noiseFrequency));
      const n2 = noise2D(wx.mul(noiseFrequency.mul(noise2Frequency)).add(50), wz.mul(noiseFrequency.mul(noise2Frequency)).add(50));
      const clump = n1.mul(noiseAmplitude).sub(noise2Amplitude).add(n2.mul(noise2Amplitude).mul(2)).max(0);
      blade.w.assign(clump);
      const dist = sqrt(wx.mul(wx).add(wz.mul(wz)));
      const edgeNoise = noise2D(wx.mul(0.25).add(100), wz.mul(0.25).add(100));
      const maxR = float(8.0).add(edgeNoise.sub(0.5).mul(4.0));
      const boundary = float(1).sub(smoothstep(maxR.sub(1.5), maxR, dist));
      bladeBound.element(instanceIndex).assign(select(boundary.lessThan(0.05), float(0), boundary));
    })().compute(BLADE_COUNT);

    // ─── Compute Update ───────────────────────────────────────────────────────────
    const computeUpdate = Fn(() => {
      const blade = bladeData.element(instanceIndex);
      const bend = bendState.element(instanceIndex);
      const bx = blade.x, bz = blade.y;

      const w1 = sin(bx.mul(0.35).add(bz.mul(0.12)).add(time.mul(windSpeed)));
      const w2 = sin(bx.mul(0.18).add(bz.mul(0.28)).add(time.mul(windSpeed.mul(0.67))).add(1.7));
      const windX = w1.add(w2).mul(windAmplitude);
      const windZ = w1.sub(w2).mul(windAmplitude.mul(0.55));
      const lw = deltaTime.mul(4.0).saturate();
      bend.x.assign(mix(bend.x, windX, lw));
      bend.y.assign(mix(bend.y, windZ, lw));

      const dx = bx.sub(mouseWorld.x), dz = bz.sub(mouseWorld.z);
      const dist = sqrt(dx.mul(dx).add(dz.mul(dz))).add(0.0001);
      const falloff = float(1).sub(dist.div(mouseRadius).saturate());
      const influence = falloff.mul(falloff).mul(mouseStrength);
      const pushX = dx.div(dist).mul(influence);
      const pushZ = dz.div(dist).mul(influence);

      const idx2 = bx.sub(icoWorld.x), idz2 = bz.sub(icoWorld.z);
      const idist2 = sqrt(idx2.mul(idx2).add(idz2.mul(idz2))).add(0.0001);
      const ifalloff2 = float(1).sub(idist2.div(icoRadius).saturate());
      const iinfluence2 = ifalloff2.mul(ifalloff2).mul(icoStrength);
      const ipushX = idx2.div(idist2).mul(iinfluence2);
      const ipushZ = idz2.div(idist2).mul(iinfluence2);

      const totalPushX = pushX.add(ipushX), totalPushZ = pushZ.add(ipushZ);
      const targetMag = sqrt(totalPushX.mul(totalPushX).add(totalPushZ.mul(totalPushZ)));
      const currentMag = sqrt(bend.z.mul(bend.z).add(bend.w.mul(bend.w)));
      const lm = select(targetMag.greaterThan(currentMag), deltaTime.mul(12.0), deltaTime.mul(1)).saturate();
      bend.z.assign(mix(bend.z, totalPushX, lm));
      bend.w.assign(mix(bend.w, totalPushZ, lm));
    })().compute(BLADE_COUNT);

    // ─── Blade Geometry ───────────────────────────────────────────────────────────
    function createBladeGeometry() {
      const segs = 5, W = 0.055, H = 1.0;
      const verts = [], norms = [], uvArr = [], idx = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs, y = t * H, hw = W * 0.5 * (1 - t * 0.82);
        verts.push(-hw, y, 0, hw, y, 0);
        norms.push(0, 0, 1, 0, 0, 1);
        uvArr.push(0, t, 1, t);
      }
      for (let i = 0; i < segs; i++) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      geo.setAttribute("normal", new THREE.Float32BufferAttribute(norms, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvArr, 2));
      geo.setIndex(idx);
      return geo;
    }

    // ─── Grass Material ───────────────────────────────────────────────────────────
    const grassMat = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });

    grassMat.positionNode = Fn(() => {
      const blade = bladeData.element(instanceIndex);
      const bend = bendState.element(instanceIndex);
      const worldX = blade.x, worldZ = blade.y, rotY = blade.z;
      const boundary = bladeBound.element(instanceIndex);
      const visible = select(hash(instanceIndex.add(9999)).lessThan(grassDensity.mul(0.5)), float(1), float(0));
      const heightScale = float(0.35).add(blade.w).mul(boundary).mul(visible);
      const lx = positionGeometry.x.mul(bladeWidth).mul(heightScale.sign());
      const ly = positionGeometry.y.mul(heightScale).mul(bladeHeight);
      const cY = cos(rotY), sY = sin(rotY);
      const rx = lx.mul(cY), rz = lx.mul(sY);
      const t = uv().y, bendFactor = pow(t, 1.8);
      const staticBendX = hash(instanceIndex.add(7777)).sub(0.5).mul(bladeLean);
      const staticBendZ = hash(instanceIndex.add(8888)).sub(0.5).mul(bladeLean);
      const bendX = staticBendX.add(bend.x).add(bend.z);
      const bendZ = staticBendZ.add(bend.y).add(bend.w);
      const relX = rx.add(bendX.mul(bendFactor).mul(bladeHeight));
      const relY = ly;
      const relZ = rz.add(bendZ.mul(bendFactor).mul(bladeHeight));
      const origLen = sqrt(rx.mul(rx).add(ly.mul(ly)).add(rz.mul(rz)));
      const newLen = sqrt(relX.mul(relX).add(relY.mul(relY)).add(relZ.mul(relZ)));
      const scale = origLen.div(newLen.max(0.0001));
      return vec3(worldX.add(relX.mul(scale)), relY.mul(scale), worldZ.add(relZ.mul(scale)));
    })();

    grassMat.colorNode = Fn(() => {
      const t = uv().y;
      const clump = bladeData.element(instanceIndex).w.saturate();
      const gradient = pow(t, bladeGradientFalloff);
      const tipMix = float(1).sub(bladeColorVariation).add(clump.mul(bladeColorVariation));
      const variedTip = mix(bladeBaseColor, bladeTipColor, tipMix);
      return mix(bladeBaseColor, variedTip, gradient);
    })();

    grassMat.opacityNode = smoothstep(float(0.0), float(0.1), uv().y);
    grassMat.transparent = true;

    const bladeGeo = createBladeGeometry();
    const grass = new THREE.InstancedMesh(bladeGeo, grassMat, BLADE_COUNT);
    grass.name = "grassField";
    grass.frustumCulled = false;
    scene.add(grass);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < BLADE_COUNT; i++) grass.setMatrixAt(i, dummy.matrix);
    grass.instanceMatrix.needsUpdate = true;

    // ─── Icosahedron ──────────────────────────────────────────────────────────────
    const icoGeo = new THREE.IcosahedronGeometry(0.45, 1);
    icoGeo.computeVertexNormals();
    const icoMat = new THREE.MeshStandardNodeMaterial({ color: new THREE.Color("#ffffff"), roughness: 0.95, metalness: 0.05, flatShading: true });
    const icosahedron = new THREE.Mesh(icoGeo, icoMat);
    icosahedron.name = "icosahedron";
    icosahedron.position.set(0, 0.45, 0);
    icosahedron.castShadow = true;
    icosahedron.receiveShadow = true;
    scene.add(icosahedron);

    const icoVel = new THREE.Vector3();
    const icoSpd = 56.0, icoDamp = 0.92, grav = -25.0, jmpF = 10.0, gndY = 0.45;
    let icoYVel = 0, isGrounded = true;
    const keysPressed: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed[e.key.toLowerCase()] = true;
      if (e.code === "Space") { 
        e.preventDefault(); 
        if (isGrounded) { icoYVel = jmpF; isGrounded = false; } 
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => { 
      keysPressed[e.key.toLowerCase()] = false; 
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const camOff = new THREE.Vector3(0, 6, 14.5);
    const camLerp = 3.0;
    const camTP = new THREE.Vector3(), camTL = new THREE.Vector3();

    function updateIcosahedron(dt: number) {
      const a = new THREE.Vector3();
      if (keysPressed["w"]) a.z -= 1;
      if (keysPressed["s"]) a.z += 1;
      if (keysPressed["a"]) a.x -= 1;
      if (keysPressed["d"]) a.x += 1;
      if (a.length() > 0) { a.normalize().multiplyScalar(icoSpd * dt); icoVel.add(a); }
      icoVel.multiplyScalar(icoDamp);
      icosahedron.position.x += icoVel.x * dt;
      icosahedron.position.z += icoVel.z * dt;
      icoYVel += grav * dt;
      icosahedron.position.y += icoYVel * dt;
      if (icosahedron.position.y <= gndY) { icosahedron.position.y = gndY; icoYVel = 0; isGrounded = true; }
      const hf = FIELD_SIZE * 0.5;
      icosahedron.position.x = Math.max(-hf, Math.min(hf, icosahedron.position.x));
      icosahedron.position.z = Math.max(-hf, Math.min(hf, icosahedron.position.z));
      if (icoVel.length() > 0.01) {
        const ax = new THREE.Vector3(icoVel.z, 0, -icoVel.x).normalize();
        icosahedron.rotateOnWorldAxis(ax, icoVel.length() * dt * 5);
      }
      const hAbove = icosahedron.position.y - gndY;
      const airF = Math.max(0, 1 - hAbove * 1.5);
      icoWorld.value.set(icosahedron.position.x * airF + 99999 * (1 - airF), 0, icosahedron.position.z * airF + 99999 * (1 - airF));
      camTP.set(icosahedron.position.x + camOff.x, camOff.y, icosahedron.position.z + camOff.z);
      camTL.set(icosahedron.position.x, icosahedron.position.y - 0.75, icosahedron.position.z);
      const lf = 1 - Math.exp(-camLerp * dt);
      camera.position.lerp(camTP, lf);
      controls.target.lerp(camTL, lf);
    }

    // ─── Ground ───────────────────────────────────────────────────────────────────
    const groundMat = new THREE.MeshBasicNodeMaterial();
    groundMat.colorNode = Fn(() => {
      const wx = positionWorld.x, wz = positionWorld.z;
      const dist = sqrt(wx.mul(wx).add(wz.mul(wz)));
      const eN = noise2D(wx.mul(0.25).add(100), wz.mul(0.25).add(100));
      const maxR = groundRadius.add(eN.sub(0.5).mul(4.0));
      const t = smoothstep(maxR.sub(groundFalloff), maxR, dist);
      return mix(groundColor, backgroundColor, t);
    })();
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_SIZE * 5, FIELD_SIZE * 5), groundMat);
    ground.name = "groundPlane";
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    // scene.add(ground);

    // ─── Lights ───────────────────────────────────────────────────────────────────
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0xfff4e0, 1.5);
    dir.position.set(5, 10, 7);
    dir.castShadow = true;
    dir.shadow.mapSize.width = isMobile ? 512 : 1024;
    dir.shadow.mapSize.height = isMobile ? 512 : 1024;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 30;
    dir.shadow.camera.left = -12;
    dir.shadow.camera.right = 12;
    dir.shadow.camera.top = 12;
    dir.shadow.camera.bottom = -12;
    scene.add(dir);

    // ─── Mouse Raycast ────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();
    const grassPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hitPoint = new THREE.Vector3();

    const handleMouseMove = (e: MouseEvent) => {
      mouseNDC.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(mouseNDC, camera);
      if (raycaster.ray.intersectPlane(grassPlane, hitPoint)) mouseWorld.value.copy(hitPoint);
    };
    const handleMouseLeave = () => mouseWorld.value.set(99999, 0, 99999);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", updateSize);

    // ─── Boot ─────────────────────────────────────────────────────────────────────
    const init = async () => {
      if (isCancelled || !renderer) return;
      await renderer.init();
      await renderer.computeAsync(computeInit);
      const clock = new THREE.Clock();

      function animate() {
        if (isCancelled || !renderer) return;
        const dt = Math.min(clock.getDelta(), 0.05);
        updateIcosahedron(dt);
        renderer.compute(computeUpdate);
        controls.update();
        renderer.renderAsync(scene, camera);
      }
      renderer.setAnimationLoop(animate);
    };
    init();

    return () => {
      isCancelled = true;
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      
      if (renderer) {
        renderer.setAnimationLoop(null);
        if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" style={{ zIndex: 0 }} />;
}
