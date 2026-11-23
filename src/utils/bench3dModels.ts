import * as THREE from 'three';
import {
  BeginnerCircuitId,
  BenchBoardId,
} from '../types/electronics';
import {
  BenchWireConnection,
  BOARD_PINS,
  CircuitSimulationResult,
  getPresetById,
} from './circuitSimulator';

export interface PinTargetMeta {
  targetType: 'board' | 'sensor';
  pinId: string;
  label: string;
  worldPos: THREE.Vector3;
}

export interface WorkbenchBuildResult {
  boardGroup: THREE.Group;
  sensorGroup: THREE.Group;
  boardPinAnchors: Map<string, PinTargetMeta>;
  sensorPinAnchors: Map<string, PinTargetMeta>;
  interactiveProxies: THREE.Mesh[];
  boardPowerLedMat: THREE.MeshStandardMaterial;
  boardUserLedMat: THREE.MeshStandardMaterial;
  sensorStatusLedMat: THREE.MeshStandardMaterial | null;
  ledDomeMat: THREE.MeshPhysicalMaterial | null;
  ledCoreMat: THREE.MeshBasicMaterial | null;
  obstacleGroup: THREE.Group | null;
  sonarWaveRings: THREE.Mesh[];
}

function makeRoundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const hw = w / 2;
  const hh = h / 2;
  const s = new THREE.Shape();
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

function configureCanvasTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  isColor = true
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function createEsdMatTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0e131b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle matte ESD speckle
    for (let i = 0; i < 1600; i++) {
      const x = (Math.sin(i * 19.31) * 0.5 + 0.5) * canvas.width;
      const y = (Math.cos(i * 41.17) * 0.5 + 0.5) * canvas.height;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(56,189,248,0.018)';
      ctx.fillRect(x, y, 2, 2);
    }

    // Technical grid (1cm minor, 5cm major)
    const step = 32;
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += step) {
      ctx.strokeStyle = x % (step * 4) === 0 ? 'rgba(125, 211, 252, 0.14)' : 'rgba(238, 240, 245, 0.045)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += step) {
      ctx.strokeStyle = y % (step * 4) === 0 ? 'rgba(125, 211, 252, 0.14)' : 'rgba(238, 240, 245, 0.045)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Perimeter technical border & scale ticks
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

    ctx.fillStyle = 'rgba(163, 169, 184, 0.55)';
    ctx.font = '600 14px monospace';
    ctx.fillText('PLUGPILOT ESD BENCH · 3.3V / 5.0V PROTOTYPING BAY', 44, 52);
  }
  return configureCanvasTexture(canvas, maxAnisotropy, true);
}

function createBreadboardTopTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#e7e9ee';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top + bottom power rail lines
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(24, 22, canvas.width - 48, 4);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(24, 42, canvas.width - 48, 4);

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(24, canvas.height - 46, canvas.width - 48, 4);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(24, canvas.height - 26, canvas.width - 48, 4);

    // Center divider trough graphic
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(16, canvas.height / 2 - 9, canvas.width - 32, 18);

    // Column numbering
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12px monospace';
    for (let i = 1; i <= 6; i++) {
      ctx.fillText(String(i * 5), 24 + i * 74, 62);
      ctx.fillText(String(i * 5), 24 + i * 74, canvas.height - 54);
    }
  }
  return configureCanvasTexture(canvas, maxAnisotropy, true);
}

function createUnoSilkscreenTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0e5263';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle PCB copper trace lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(90, 90 + i * 28);
      ctx.lineTo(240, 90 + i * 28);
      ctx.lineTo(270, 120 + i * 22);
      ctx.stroke();
    }

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('UNO R3', 135, 118);
    ctx.font = '600 13px monospace';
    ctx.fillStyle = '#bae6fd';
    ctx.fillText('ATmega328P · 5V LOGIC', 135, 142);

    // Bottom edge pin silkscreen legend aligned with header sockets
    const labels = ['5V', '3V3', 'GND', 'D2', 'D9', 'D10', 'D13'];
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    labels.forEach((lbl, idx) => {
      const x = 66 + idx * 58;
      ctx.fillText(lbl, x - lbl.length * 4, 336);
    });

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('ON', 416, 102);
    ctx.fillText('L', 418, 146);
  }
  return configureCanvasTexture(canvas, maxAnisotropy, true);
}

function createEsp32SilkscreenTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#181c24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // PCB Wi-Fi antenna meander trace on left end
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(24, 90);
    ctx.lineTo(24, 210);
    ctx.lineTo(44, 210);
    ctx.lineTo(44, 110);
    ctx.lineTo(64, 110);
    ctx.lineTo(64, 210);
    ctx.stroke();

    ctx.fillStyle = '#eef0f5';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('ESP32 DevKit', 148, 86);
    ctx.font = '600 13px monospace';
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('3.3V LOGIC · Wi-Fi / BLE', 148, 108);

    const labels = ['VIN', '3V3', 'GND', 'G4', 'G5', 'G18', 'G2'];
    ctx.fillStyle = '#eef0f5';
    ctx.font = 'bold 15px monospace';
    labels.forEach((lbl, idx) => {
      const x = 66 + idx * 58;
      ctx.fillText(lbl, x - lbl.length * 4, 280);
    });
  }
  return configureCanvasTexture(canvas, maxAnisotropy, true);
}

function createResistorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#d8b786';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // 220 ohm 4-band: Red, Red, Brown, Gold
    const bands = [
      { x: 52, w: 16, color: '#dc2626' },
      { x: 88, w: 16, color: '#dc2626' },
      { x: 124, w: 16, color: '#78350f' },
      { x: 184, w: 14, color: '#eab308' },
    ];
    for (const b of bands) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, 0, b.w, canvas.height);
    }
  }
  return configureCanvasTexture(canvas, maxAnisotropy, true);
}

function createTransducerMeshTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#141820';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    for (let i = 0; i < 256; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(128, 128, 118, 0, Math.PI * 2);
    ctx.stroke();
  }
  return configureCanvasTexture(canvas, maxAnisotropy, true);
}

function createSensorPcbLabelTexture(
  maxAnisotropy: number,
  bgHex: string,
  title: string,
  pinLabels: string[]
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(title, 26, 46);

    ctx.font = 'bold 22px monospace';
    const spacing = (canvas.width - 64) / Math.max(1, pinLabels.length - 1);
    pinLabels.forEach((lbl, idx) => {
      const x = pinLabels.length === 1 ? canvas.width / 2 : 32 + idx * spacing;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(lbl, x - lbl.length * 6, 166);
    });
  }
  return configureCanvasTexture(canvas, maxAnisotropy, true);
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 14, 128, 128, 126);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.58)');
    grad.addColorStop(0.55, 'rgba(0, 0, 0, 0.24)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createStaticWorkbenchEnvironment(maxAnisotropy: number): THREE.Group {
  const envGroup = new THREE.Group();

  // 1. ESD Workbench Mat seated cleanly at y = 0
  const matGeo = new THREE.BoxGeometry(10.8, 0.08, 7.0);
  const matTex = createEsdMatTexture(maxAnisotropy);
  const matMaterial = new THREE.MeshStandardMaterial({
    map: matTex,
    roughness: 0.86,
    metalness: 0.04,
  });
  const esdMat = new THREE.Mesh(matGeo, matMaterial);
  esdMat.position.set(0, -0.04, 0.15);
  esdMat.receiveShadow = true;
  envGroup.add(esdMat);

  // 2. Central Prototype Breadboard seated cleanly in front of controller/sensor bays
  const bbZ = 1.35;
  const bbShape = makeRoundedRectShape(4.5, 1.85, 0.12);
  const bbGeo = new THREE.ExtrudeGeometry(bbShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
  });
  bbGeo.rotateX(-Math.PI / 2);

  const bbPlasticMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.55,
    metalness: 0.04,
  });
  const breadboardMesh = new THREE.Mesh(bbGeo, bbPlasticMat);
  breadboardMesh.position.set(0, 0.025, bbZ);
  breadboardMesh.castShadow = true;
  breadboardMesh.receiveShadow = true;
  envGroup.add(breadboardMesh);

  // Breadboard silkscreen decal face offset slightly above top to eliminate z-fighting
  const bbTopGeo = new THREE.PlaneGeometry(4.32, 1.69);
  bbTopGeo.rotateX(-Math.PI / 2);
  const bbTopMat = new THREE.MeshStandardMaterial({
    map: createBreadboardTopTexture(maxAnisotropy),
    roughness: 0.62,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const bbTop = new THREE.Mesh(bbTopGeo, bbTopMat);
  bbTop.position.set(0, 0.292, bbZ);
  bbTop.receiveShadow = true;
  envGroup.add(bbTop);

  // Instanced tie-point sockets (72 metallic/dark holes on the breadboard)
  const holeGeo = new THREE.BoxGeometry(0.06, 0.015, 0.06);
  const holeMat = new THREE.MeshStandardMaterial({
    color: 0x202733,
    roughness: 0.6,
    metalness: 0.5,
  });
  const cols = 18;
  const rows = 4;
  const holesMesh = new THREE.InstancedMesh(holeGeo, holeMat, cols * rows);
  const dummy = new THREE.Object3D();
  let idx = 0;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const zOff = r < 2 ? -0.42 + r * 0.18 : 0.24 + (r - 2) * 0.18;
      dummy.position.set(-1.95 + c * 0.23, 0.298, bbZ + zOff);
      dummy.updateMatrix();
      holesMesh.setMatrixAt(idx++, dummy.matrix);
    }
  }
  holesMesh.instanceMatrix.needsUpdate = true;
  holesMesh.computeBoundingSphere();
  envGroup.add(holesMesh);

  // Contact shadow grounding plane
  const shadowGeo = new THREE.PlaneGeometry(9.6, 5.8);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createContactShadowTexture(),
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.position.set(0, 0.008, 0.0);
  envGroup.add(contactShadow);

  return envGroup;
}

function addInteractivePin(
  parent: THREE.Group,
  localPos: THREE.Vector3,
  pinId: string,
  label: string,
  targetType: 'board' | 'sensor',
  pinHousingMat: THREE.Material,
  goldMat: THREE.Material,
  proxyMat: THREE.Material,
  anchorsMap: Map<string, PinTargetMeta>,
  proxies: THREE.Mesh[],
  boardOrigin: THREE.Vector3
) {
  const pinGroup = new THREE.Group();
  pinGroup.position.copy(localPos);

  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.18), pinHousingMat);
  housing.position.y = 0.11;
  housing.castShadow = true;
  pinGroup.add(housing);

  const goldPin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.34, 8), goldMat);
  goldPin.position.y = 0.24;
  pinGroup.add(goldPin);

  // Layer 1 raycast hitbox for effortless pin clicking
  const proxy = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.48, 12), proxyMat);
  proxy.position.y = 0.24;
  proxy.layers.set(1);
  proxy.userData = { targetType, pinId, label };
  pinGroup.add(proxy);
  proxies.push(proxy);

  parent.add(pinGroup);

  const worldAnchor = new THREE.Vector3(
    boardOrigin.x + localPos.x,
    boardOrigin.y + localPos.y + 0.34,
    boardOrigin.z + localPos.z
  );
  anchorsMap.set(pinId, {
    targetType,
    pinId,
    label,
    worldPos: worldAnchor,
  });
}

export function buildActiveHardware(
  boardId: BenchBoardId,
  presetId: BeginnerCircuitId,
  maxAnisotropy: number
): WorkbenchBuildResult {
  const boardPinAnchors = new Map<string, PinTargetMeta>();
  const sensorPinAnchors = new Map<string, PinTargetMeta>();
  const interactiveProxies: THREE.Mesh[] = [];

  const plasticMat = new THREE.MeshStandardMaterial({
    color: 0x151922,
    roughness: 0.72,
    metalness: 0.08,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xe6be53,
    roughness: 0.24,
    metalness: 0.92,
  });
  const metalBrushedMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.22,
    metalness: 0.92,
  });
  const proxyMat = new THREE.MeshBasicMaterial({
    visible: false,
  });

  // ---------------------------------------------------
  // 1. MICROCONTROLLER BOARD (Seated on left workbench bay)
  // ---------------------------------------------------
  const boardOrigin = new THREE.Vector3(-2.2, 0.06, -0.68);
  const boardGroup = new THREE.Group();
  boardGroup.position.copy(boardOrigin);

  const boardPowerLedMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x22c55e,
    emissiveIntensity: 0.85,
    roughness: 0.3,
  });
  const boardUserLedMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.3,
  });

  // 4 rubberized standoffs so board sits grounded with no floating
  const standoffGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.06, 12);
  const standoffCoords: Array<[number, number]> = [
    [-1.4, -0.95],
    [1.4, -0.95],
    [-1.4, 0.95],
    [1.4, 0.95],
  ];
  for (const [sx, sz] of standoffCoords) {
    const leg = new THREE.Mesh(standoffGeo, plasticMat);
    leg.position.set(sx, -0.03, sz);
    boardGroup.add(leg);
  }

  if (boardId === 'arduino-uno') {
    const pcbShape = makeRoundedRectShape(3.5, 2.35, 0.08);
    const pcbGeo = new THREE.ExtrudeGeometry(pcbShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    pcbGeo.rotateX(-Math.PI / 2);
    const unoPcbMat = new THREE.MeshStandardMaterial({
      color: 0x0e5263,
      roughness: 0.42,
      metalness: 0.12,
    });
    const pcb = new THREE.Mesh(pcbGeo, unoPcbMat);
    pcb.castShadow = true;
    pcb.receiveShadow = true;
    boardGroup.add(pcb);

    // Top silkscreen face
    const silkGeo = new THREE.PlaneGeometry(3.42, 2.28);
    silkGeo.rotateX(-Math.PI / 2);
    const silkMesh = new THREE.Mesh(
      silkGeo,
      new THREE.MeshStandardMaterial({
        map: createUnoSilkscreenTexture(maxAnisotropy),
        roughness: 0.45,
        metalness: 0.05,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    silkMesh.position.y = 0.118;
    boardGroup.add(silkMesh);

    // Brushed metallic USB-B housing on left edge
    const usb = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.46, 0.56), metalBrushedMat);
    usb.position.set(-1.52, 0.34, -0.45);
    usb.castShadow = true;
    boardGroup.add(usb);

    // Barrel power jack
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.44, 0.44), plasticMat);
    barrel.position.set(-1.54, 0.33, 0.56);
    barrel.castShadow = true;
    boardGroup.add(barrel);

    // ATmega328P DIP-28 chip + crystal
    const mcu = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.16, 0.44), plasticMat);
    mcu.position.set(0.35, 0.2, 0.12);
    mcu.castShadow = true;
    boardGroup.add(mcu);

    const crystal = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.24, 4, 10), metalBrushedMat);
    crystal.rotation.z = Math.PI / 2;
    crystal.position.set(-0.5, 0.18, -0.15);
    boardGroup.add(crystal);

    // Onboard PWR + L LEDs
    const pwrLed = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.07), boardPowerLedMat);
    pwrLed.position.set(1.18, 0.145, -0.58);
    boardGroup.add(pwrLed);

    const userLed = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.07), boardUserLedMat);
    userLed.position.set(1.18, 0.145, -0.28);
    boardGroup.add(userLed);
  } else {
    // ESP32 DevKit V1
    const pcbShape = makeRoundedRectShape(3.5, 1.95, 0.08);
    const pcbGeo = new THREE.ExtrudeGeometry(pcbShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    pcbGeo.rotateX(-Math.PI / 2);
    const espPcbMat = new THREE.MeshStandardMaterial({
      color: 0x181c24,
      roughness: 0.48,
      metalness: 0.14,
    });
    const pcb = new THREE.Mesh(pcbGeo, espPcbMat);
    pcb.castShadow = true;
    pcb.receiveShadow = true;
    boardGroup.add(pcb);

    const silkGeo = new THREE.PlaneGeometry(3.42, 1.88);
    silkGeo.rotateX(-Math.PI / 2);
    const silkMesh = new THREE.Mesh(
      silkGeo,
      new THREE.MeshStandardMaterial({
        map: createEsp32SilkscreenTexture(maxAnisotropy),
        roughness: 0.5,
        metalness: 0.06,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    silkMesh.position.y = 0.118;
    boardGroup.add(silkMesh);

    // ESP-WROOM-32 Brushed Metal RF Shield Can
    const shieldCan = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.18, 1.05), metalBrushedMat);
    shieldCan.position.set(-0.68, 0.21, 0);
    shieldCan.castShadow = true;
    boardGroup.add(shieldCan);

    // Micro-USB Connector on right side
    const microUsb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.42), metalBrushedMat);
    microUsb.position.set(1.62, 0.19, 0);
    microUsb.castShadow = true;
    boardGroup.add(microUsb);

    // EN and BOOT tactile microswitches
    const btnGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.07, 12);
    const enBtn = new THREE.Mesh(btnGeo, metalBrushedMat);
    enBtn.position.set(1.18, 0.16, -0.45);
    const bootBtn = new THREE.Mesh(btnGeo, metalBrushedMat);
    bootBtn.position.set(1.18, 0.16, 0.45);
    boardGroup.add(enBtn, bootBtn);

    const pwrLed = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.07), boardPowerLedMat);
    pwrLed.position.set(1.05, 0.145, -0.18);
    boardGroup.add(pwrLed);

    const userLed = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.07), boardUserLedMat);
    userLed.position.set(1.05, 0.145, 0.18);
    boardGroup.add(userLed);
  }

  // Interactive Board Pins mounted cleanly along the front header rail (+Z edge)
  const pins = BOARD_PINS[boardId];
  const boardPinZ = boardId === 'arduino-uno' ? 1.02 : 0.84;
  pins.forEach((pinDef, idx) => {
    const x = -1.26 + idx * 0.42;
    addInteractivePin(
      boardGroup,
      new THREE.Vector3(x, 0.11, boardPinZ),
      pinDef.id,
      pinDef.label,
      'board',
      plasticMat,
      goldMat,
      proxyMat,
      boardPinAnchors,
      interactiveProxies,
      boardOrigin
    );
  });

  // ---------------------------------------------------
  // 2. BEGINNER SENSOR / COMPONENT MODULE (Right bay)
  // ---------------------------------------------------
  const sensorOrigin = new THREE.Vector3(1.88, 0.06, -0.64);
  const sensorGroup = new THREE.Group();
  sensorGroup.position.copy(sensorOrigin);

  const preset = getPresetById(presetId);
  let sensorStatusLedMat: THREE.MeshStandardMaterial | null = null;
  let ledDomeMat: THREE.MeshPhysicalMaterial | null = null;
  let ledCoreMat: THREE.MeshBasicMaterial | null = null;
  let obstacleGroup: THREE.Group | null = null;
  const sonarWaveRings: THREE.Mesh[] = [];

  if (presetId === 'led-blink') {
    // Mini 2-pin prototype breakout PCB carrying LED + 220Ω resistor
    const pcbShape = makeRoundedRectShape(2.1, 1.9, 0.08);
    const pcbGeo = new THREE.ExtrudeGeometry(pcbShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    pcbGeo.rotateX(-Math.PI / 2);
    const pcb = new THREE.Mesh(
      pcbGeo,
      new THREE.MeshStandardMaterial({ color: 0x162436, roughness: 0.45, metalness: 0.14 })
    );
    pcb.castShadow = true;
    pcb.receiveShadow = true;
    sensorGroup.add(pcb);

    const silkGeo = new THREE.PlaneGeometry(2.02, 1.82);
    silkGeo.rotateX(-Math.PI / 2);
    const silk = new THREE.Mesh(
      silkGeo,
      new THREE.MeshStandardMaterial({
        map: createSensorPcbLabelTexture(maxAnisotropy, '#162436', 'LED + 220Ω', ['ANODE (+)', 'CATHODE (-)']),
        roughness: 0.5,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    silk.position.y = 0.118;
    sensorGroup.add(silk);

    // Translucent 10mm LED Bulb Assembly
    ledDomeMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.14,
      metalness: 0.02,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.72,
    });
    ledCoreMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
    });

    const ledBaseRim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.12, 24), ledDomeMat);
    ledBaseRim.position.set(0.25, 0.62, -0.15);
    const ledBody = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.52, 24), ledDomeMat);
    ledBody.position.set(0.25, 0.92, -0.15);
    const ledCap = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 16), ledDomeMat);
    ledCap.position.set(0.25, 1.18, -0.15);
    const ledCore = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.28, 12), ledCoreMat);
    ledCore.position.set(0.25, 0.9, -0.15);
    sensorGroup.add(ledBaseRim, ledBody, ledCap, ledCore);

    // Metallic Anode & Cathode leads
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.52, 8);
    const legAnode = new THREE.Mesh(legGeo, metalBrushedMat);
    legAnode.position.set(0.14, 0.34, -0.15);
    const legCathode = new THREE.Mesh(legGeo, metalBrushedMat);
    legCathode.position.set(0.36, 0.34, -0.15);
    sensorGroup.add(legAnode, legCathode);

    // 220Ω Axial Resistor bridging Anode side
    const resBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.54, 16),
      new THREE.MeshStandardMaterial({
        map: createResistorTexture(maxAnisotropy),
        roughness: 0.45,
        metalness: 0.05,
      })
    );
    resBody.rotation.z = Math.PI / 2;
    resBody.position.set(-0.35, 0.24, 0.15);
    resBody.castShadow = true;
    sensorGroup.add(resBody);

    const leadL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), metalBrushedMat);
    leadL.position.set(-0.66, 0.16, 0.15);
    const leadR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 8), metalBrushedMat);
    leadR.position.set(-0.04, 0.16, 0.15);
    sensorGroup.add(leadL, leadR);
  } else if (presetId === 'dht22-climate') {
    const pcbShape = makeRoundedRectShape(2.2, 2.0, 0.08);
    const pcbGeo = new THREE.ExtrudeGeometry(pcbShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    pcbGeo.rotateX(-Math.PI / 2);
    const pcb = new THREE.Mesh(
      pcbGeo,
      new THREE.MeshStandardMaterial({ color: 0x163a2c, roughness: 0.46, metalness: 0.1 })
    );
    pcb.castShadow = true;
    pcb.receiveShadow = true;
    sensorGroup.add(pcb);

    const silkGeo = new THREE.PlaneGeometry(2.12, 1.92);
    silkGeo.rotateX(-Math.PI / 2);
    const silk = new THREE.Mesh(
      silkGeo,
      new THREE.MeshStandardMaterial({
        map: createSensorPcbLabelTexture(maxAnisotropy, '#163a2c', 'DHT22 MODULE', ['VCC', 'DATA', 'GND']),
        roughness: 0.5,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    silk.position.y = 0.118;
    sensorGroup.add(silk);

    // Classic Ice-White Louvered DHT22 Body (Vertical upright module)
    const housingMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.36,
      metalness: 0.04,
    });
    const ventBackingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.1,
    });

    const dhtShell = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.15, 0.52), housingMat);
    dhtShell.position.set(0, 0.68, -0.2);
    dhtShell.castShadow = true;
    sensorGroup.add(dhtShell);

    // Mounting tab with screw hole collar at top
    const topTab = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.14), housingMat);
    topTab.position.set(0, 1.38, -0.34);
    sensorGroup.add(topTab);

    // Recessed louvered front grid slots
    const gridBack = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.82, 0.04), ventBackingMat);
    gridBack.position.set(0, 0.68, 0.055);
    sensorGroup.add(gridBack);

    for (let r = 0; r < 4; r++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.08, 0.05), housingMat);
      slat.position.set(0, 0.38 + r * 0.19, 0.068);
      sensorGroup.add(slat);
    }

    // Status LED on breakout PCB
    sensorStatusLedMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.3,
    });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.09), sensorStatusLedMat);
    led.position.set(0.75, 0.15, -0.52);
    sensorGroup.add(led);
  } else {
    // HC-SR04 Ultrasonic Distance Bench
    const pcbShape = makeRoundedRectShape(2.55, 1.85, 0.08);
    const pcbGeo = new THREE.ExtrudeGeometry(pcbShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    pcbGeo.rotateX(-Math.PI / 2);
    const pcb = new THREE.Mesh(
      pcbGeo,
      new THREE.MeshStandardMaterial({ color: 0x164178, roughness: 0.44, metalness: 0.14 })
    );
    pcb.castShadow = true;
    pcb.receiveShadow = true;
    sensorGroup.add(pcb);

    const silkGeo = new THREE.PlaneGeometry(2.47, 1.77);
    silkGeo.rotateX(-Math.PI / 2);
    const silk = new THREE.Mesh(
      silkGeo,
      new THREE.MeshStandardMaterial({
        map: createSensorPcbLabelTexture(maxAnisotropy, '#164178', 'HC-SR04 SONAR', [
          'VCC',
          'TRIG',
          'ECHO',
          'GND',
        ]),
        roughness: 0.5,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    silk.position.y = 0.118;
    sensorGroup.add(silk);

    // Rotated transducer faceplate + dual brushed metal barrels facing right-forward (+X / +Z)
    // so both honeycomb acoustic speaker grilles, sonar waves, and target obstacle are visible from the front
    const sonarAxisGroup = new THREE.Group();
    sonarAxisGroup.position.set(-0.22, 0, -0.44);
    sonarAxisGroup.rotation.y = Math.PI / 2 - 0.36;
    sensorGroup.add(sonarAxisGroup);

    const uprightBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.68, 0.98, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x164178, roughness: 0.42, metalness: 0.14 })
    );
    uprightBoard.position.set(0, 0.58, 0);
    uprightBoard.castShadow = true;
    sonarAxisGroup.add(uprightBoard);

    const grilleMat = new THREE.MeshStandardMaterial({
      map: createTransducerMeshTexture(maxAnisotropy),
      roughness: 0.45,
      metalness: 0.48,
    });

    [-0.44, 0.44].forEach((tx) => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.48, 28), metalBrushedMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(tx, 0.6, 0.22);
      barrel.castShadow = true;
      sonarAxisGroup.add(barrel);

      const faceMesh = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), grilleMat);
      faceMesh.position.set(tx, 0.6, 0.466);
      sonarAxisGroup.add(faceMesh);
    });

    // 4 MHz oscillator between transducers
    const xtal = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.18), metalBrushedMat);
    xtal.position.set(0, 0.96, 0.14);
    sonarAxisGroup.add(xtal);

    sensorStatusLedMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.3,
    });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.09), sensorStatusLedMat);
    led.position.set(0.95, 0.15, 0.22);
    sensorGroup.add(led);

    // Calibrated sonar rail track + movable 3D Ultrasonic Target Obstacle along beam (+Z of sonarAxisGroup)
    const railTrack = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.03, 1.85),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.15 })
    );
    railTrack.position.set(0, 0.015, 1.55);
    sonarAxisGroup.add(railTrack);

    obstacleGroup = new THREE.Group();
    obstacleGroup.position.set(0, 0, 1.45);

    const blockBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.12, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.2 })
    );
    blockBase.position.y = 0.06;
    const blockTarget = new THREE.Mesh(
      new THREE.BoxGeometry(0.84, 0.82, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xe5a93c, roughness: 0.38, metalness: 0.08 })
    );
    blockTarget.position.y = 0.52;
    blockTarget.castShadow = true;
    obstacleGroup.add(blockBase, blockTarget);
    sonarAxisGroup.add(obstacleGroup);

    // Two subtle pulsing sonar wave rings emitted from +0.56 along +Z toward obstacleGroup
    for (let i = 0; i < 2; i++) {
      const ringGeo = new THREE.TorusGeometry(0.24, 0.02, 8, 28);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(0, 0.64, 0.58);
      ringMesh.visible = false;
      sonarAxisGroup.add(ringMesh);
      sonarWaveRings.push(ringMesh);
    }
  }

  // Interactive Sensor Pins along the front edge (+Z)
  const sensorPinCount = preset.sensorPins.length;
  const sensorPinSpan = (sensorPinCount - 1) * 0.46;
  preset.sensorPins.forEach((sp, idx) => {
    const x = -sensorPinSpan / 2 + idx * 0.46;
    addInteractivePin(
      sensorGroup,
      new THREE.Vector3(x, 0.11, 0.72),
      sp.pinId,
      sp.label,
      'sensor',
      plasticMat,
      goldMat,
      proxyMat,
      sensorPinAnchors,
      interactiveProxies,
      sensorOrigin
    );
  });

  return {
    boardGroup,
    sensorGroup,
    boardPinAnchors,
    sensorPinAnchors,
    interactiveProxies,
    boardPowerLedMat,
    boardUserLedMat,
    sensorStatusLedMat,
    ledDomeMat,
    ledCoreMat,
    obstacleGroup,
    sonarWaveRings,
  };
}

const WIRE_PALETTE = [0xef4444, 0x38bdf8, 0xe5a93c, 0x4cc38a, 0xa855f7];

export function buildWireMeshes(
  connections: BenchWireConnection[],
  boardAnchors: Map<string, PinTargetMeta>,
  sensorAnchors: Map<string, PinTargetMeta>,
  simResult: CircuitSimulationResult
): THREE.Group {
  const wireGroup = new THREE.Group();
  const housingMat = new THREE.MeshStandardMaterial({
    color: 0x11151d,
    roughness: 0.55,
    metalness: 0.12,
  });

  connections.forEach((conn, idx) => {
    const startMeta = boardAnchors.get(conn.boardPinId);
    const endMeta = sensorAnchors.get(conn.sensorPinId);
    if (!startMeta || !endMeta) return;

    const p0 = startMeta.worldPos.clone();
    const p3 = endMeta.worldPos.clone();

    // Arc gracefully over center channel & avoid colliding with adjacent wires
    const midY = 0.95 + idx * 0.13;
    const midZ = 0.65 + idx * 0.15;
    const p1 = new THREE.Vector3(
      THREE.MathUtils.lerp(p0.x, p3.x, 0.28),
      midY,
      THREE.MathUtils.lerp(p0.z, midZ, 0.7)
    );
    const p2 = new THREE.Vector3(
      THREE.MathUtils.lerp(p0.x, p3.x, 0.72),
      midY,
      THREE.MathUtils.lerp(p3.z, midZ, 0.7)
    );

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
    const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.032, 10, false);

    // Pick semantic wire color or fault highlight
    const diag = simResult.checks.find((c) => c.id === conn.sensorPinId);
    let colorHex = WIRE_PALETTE[idx % WIRE_PALETTE.length];
    if (conn.sensorPinId === 'VCC' || conn.sensorPinId === 'ANODE') colorHex = 0xef4444;
    else if (conn.sensorPinId === 'GND' || conn.sensorPinId === 'CATHODE') colorHex = 0x334155;
    else if (conn.sensorPinId === 'DATA' || conn.sensorPinId === 'TRIG') colorHex = 0x38bdf8;
    else if (conn.sensorPinId === 'ECHO') colorHex = 0xe5a93c;

    const isFault = diag?.status === 'error';
    const isWarn = diag?.status === 'warning';

    if (isFault) {
      colorHex = 0xdc2626;
    }

    const wireMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: isFault ? 0xb91c1c : isWarn ? 0xb45309 : 0x000000,
      emissiveIntensity: isFault ? 0.48 : isWarn ? 0.3 : 0,
      roughness: 0.48,
      metalness: 0.05,
    });

    const wireMesh = new THREE.Mesh(tubeGeo, wireMat);
    wireMesh.castShadow = true;
    wireGroup.add(wireMesh);

    // Dupont molded connector housings at both ends
    const capGeo = new THREE.BoxGeometry(0.14, 0.22, 0.14);
    const startCap = new THREE.Mesh(capGeo, housingMat);
    startCap.position.set(p0.x, p0.y - 0.04, p0.z);
    const endCap = new THREE.Mesh(capGeo, housingMat);
    endCap.position.set(p3.x, p3.y - 0.04, p3.z);
    wireGroup.add(startCap, endCap);
  });

  return wireGroup;
}

export function disposeObject3D(root: THREE.Object3D | null | undefined) {
  if (!root) return;
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
      obj.geometry?.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (!m) return;
        for (const val of Object.values(m)) {
          if (val && typeof val === 'object' && 'isTexture' in val) {
            (val as THREE.Texture).dispose();
          }
        }
        m.dispose();
      });
    }
  });
}
