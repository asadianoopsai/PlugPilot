import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  AlertTriangle,
  ArrowRight,
  Cable,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Play,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Square,
  Wrench,
  XCircle,
} from 'lucide-react';
import { ShinyButton } from '@/components/ui/shiny-button';
import { LabAssistantPanel } from './LabAssistantPanel';
import { buildLabGuideContext } from '../utils/labAssistant';
import {
  AppView,
  BeginnerCircuitId,
  BenchBoardId,
} from '../types/electronics';
import {
  BEGINNER_CIRCUIT_PRESETS,
  BenchEnvironmentInputs,
  BenchWireConnection,
  BOARD_PINS,
  evaluateCircuit,
  getIdealConnections,
  getMistakeConnections,
  getPresetById,
} from '../utils/circuitSimulator';
import {
  buildActiveHardware,
  buildWireMeshes,
  createStaticWorkbenchEnvironment,
  disposeObject3D,
  WorkbenchBuildResult,
} from '../utils/bench3dModels';

interface Sandbox3DViewProps {
  initialPresetId?: BeginnerCircuitId;
  initialBoardId?: BenchBoardId;
  onNavigate: (view: AppView) => void;
}

type DockTab = 'assistant' | 'wire' | 'check' | 'camera';
type CameraPresetId = 'overview' | 'board' | 'sensor' | 'top';

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { label: string; pos: [number, number, number]; target: [number, number, number] }
> = {
  overview: { label: 'Bench overview', pos: [0.15, 5.75, 8.65], target: [0.15, -1.05, 0.75] },
  board: { label: 'Controller pins', pos: [-2.2, 3.6, 3.5], target: [-2.2, -0.45, -0.15] },
  sensor: { label: 'Sensor & test bay', pos: [2.25, 3.5, 3.5], target: [2.25, -0.45, -0.1] },
  top: { label: 'Top wiring map', pos: [0.1, 8.8, 0.85], target: [0.1, 0.0, 0.45] },
};

// Pre-allocated math helpers (zero per-frame GC allocation)
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _rayPointer = new THREE.Vector2();

export const Sandbox3DView: React.FC<Sandbox3DViewProps> = ({
  initialPresetId = 'dht22-climate',
  initialBoardId,
  onNavigate,
}) => {
  const initialPreset = getPresetById(initialPresetId);
  const [presetId, setPresetId] = useState<BeginnerCircuitId>(initialPreset.id);
  const [boardId, setBoardId] = useState<BenchBoardId>(
    initialBoardId ?? initialPreset.defaultBoard
  );
  const [connections, setConnections] = useState<BenchWireConnection[]>(() =>
    getIdealConnections(initialPreset.id, initialBoardId ?? initialPreset.defaultBoard)
  );
  const [selectedSensorPin, setSelectedSensorPin] = useState<string | null>(null);
  const [hoveredPinLabel, setHoveredPinLabel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DockTab>('assistant');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [isCheckingLive, setIsCheckingLive] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('overview');
  const [webglError, setWebglError] = useState<string | null>(null);
  const [highlightedPair, setHighlightedPair] = useState<{
    sensorPinId: string;
    boardPinId: string;
  } | null>(null);
  const [envInputs, setEnvInputs] = useState<BenchEnvironmentInputs>({
    temperatureC: 24.5,
    humidityPct: 56,
    obstacleDistanceCm: 48,
    blinkEnabled: true,
  });

  const activePreset = useMemo(() => getPresetById(presetId), [presetId]);
  const simResult = useMemo(
    () => evaluateCircuit(presetId, boardId, connections, envInputs),
    [presetId, boardId, connections, envInputs]
  );
  const guideContext = useMemo(
    () => buildLabGuideContext(presetId, boardId, connections, simResult),
    [presetId, boardId, connections, simResult]
  );

  // Refs shared with the stable Three.js lifecycle
  const mountRef = useRef<HTMLDivElement | null>(null);
  const hardwareRef = useRef<WorkbenchBuildResult | null>(null);
  const hardwareRootRef = useRef<THREE.Group | null>(null);
  const wiresRootRef = useRef<THREE.Group | null>(null);
  const highlightRingRef = useRef<THREE.Mesh | null>(null);
  const guideSensorRingRef = useRef<THREE.Mesh | null>(null);
  const guideBoardRingRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);
  const isAnimatingRef = useRef(false);
  const cameraGoalRef = useRef<{
    active: boolean;
    pos: [number, number, number];
    target: [number, number, number];
  }>({
    active: false,
    pos: CAMERA_PRESETS.overview.pos,
    target: CAMERA_PRESETS.overview.target,
  });

  // Mutable state bridge so Three.js raycast handlers read current state cleanly
  const selectedSensorPinRef = useRef<string | null>(selectedSensorPin);
  selectedSensorPinRef.current = selectedSensorPin;

  const simResultRef = useRef(simResult);
  simResultRef.current = simResult;

  const envInputsRef = useRef(envInputs);
  envInputsRef.current = envInputs;

  const isCheckingLiveRef = useRef(isCheckingLive);
  isCheckingLiveRef.current = isCheckingLive;

  const presetIdRef = useRef(presetId);
  presetIdRef.current = presetId;

  const boardIdRef = useRef(boardId);
  boardIdRef.current = boardId;

  // Handle pin pair connection
  const handleConnectPair = (sensorPinId: string, targetBoardPinId: string) => {
    setConnections((prev) => {
      const filtered = prev.filter((c) => c.sensorPinId !== sensorPinId);
      return [...filtered, { sensorPinId, boardPinId: targetBoardPinId }];
    });
    setSelectedSensorPin(null);
  };

  const handleRemoveSensorWire = (sensorPinId: string) => {
    setConnections((prev) => prev.filter((c) => c.sensorPinId !== sensorPinId));
  };

  const switchPreset = (nextPresetId: BeginnerCircuitId) => {
    setPresetId(nextPresetId);
    setSelectedSensorPin(null);
    setHighlightedPair(null);
    setConnections(getIdealConnections(nextPresetId, boardId));
    setIsCheckingLive(true);
  };

  const switchBoard = (nextBoard: BenchBoardId) => {
    setBoardId(nextBoard);
    setSelectedSensorPin(null);
    setHighlightedPair(null);
    setConnections(getIdealConnections(presetId, nextBoard));
    setIsCheckingLive(true);
  };

  const handleStartGuidedPractice = () => {
    const firstPin = activePreset.sensorPins[0];
    setConnections([]);
    setSelectedSensorPin(null);
    setDockCollapsed(false);
    setActiveTab('assistant');
    if (firstPin) {
      setHighlightedPair({
        sensorPinId: firstPin.pinId,
        boardPinId: firstPin.idealBoardPins[boardId],
      });
    }
  };

  // Trigger camera preset glide
  const handleSelectCameraPreset = (id: CameraPresetId) => {
    setCameraPreset(id);
    const spec = CAMERA_PRESETS[id];
    cameraGoalRef.current = {
      active: true,
      pos: spec.pos,
      target: spec.target,
    };
    requestRenderRef.current?.();
  };

  // Callback ref stored cleanly for 3D raycast clicks
  const pinClickBridgeRef = useRef<(targetType: 'board' | 'sensor', pinId: string) => void>(
    () => {}
  );
  pinClickBridgeRef.current = (targetType, pinId) => {
    if (targetType === 'sensor') {
      setSelectedSensorPin((prev) => (prev === pinId ? null : pinId));
      setActiveTab('wire');
      return;
    }
    if (targetType === 'board') {
      const activeSensorPin = selectedSensorPinRef.current;
      if (activeSensorPin) {
        handleConnectPair(activeSensorPin, pinId);
      } else {
        // Select first unwired sensor pin if none selected, or prompt user cleanly
        const currentPreset = getPresetById(presetIdRef.current);
        const firstUnwired = currentPreset.sensorPins[0]?.pinId ?? null;
        if (firstUnwired) {
          setSelectedSensorPin(firstUnwired);
          setActiveTab('wire');
        }
      }
    }
  };

  // 1. Mount Three.js scene ONCE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError('WebGL 3D context is unavailable in this browser. Use the tabular wiring guide below.');
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const rect = container.getBoundingClientRect();
    const initW = Math.max(320, Math.round(rect.width));
    const initH = Math.max(320, Math.round(rect.height));
    renderer.setSize(initW, initH);
    renderer.domElement.className = 'block h-full w-full outline-none';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080d);
    scene.fog = new THREE.FogExp2(0x07080d, 0.032);

    // Studio Reflection Environment (RoomEnvironment) on every device
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, initW / initH, 0.1, 60);
    camera.position.set(...CAMERA_PRESETS.overview.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.overview.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 2.6;
    controls.maxDistance = 13.5;
    controls.maxPolarAngle = Math.PI / 2 - 0.08;
    controls.update();

    // Cancel automatic camera glide if user takes manual control
    controls.addEventListener('start', () => {
      cameraGoalRef.current.active = false;
    });

    // 3-Point Warm/Cool Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x161a24, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.2);
    keyLight.position.set(5.5, 9.0, 6.5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 25;
      keyLight.shadow.camera.left = -6.5;
      keyLight.shadow.camera.right = 6.5;
      keyLight.shadow.camera.top = 6.5;
      keyLight.shadow.camera.bottom = -6.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    rimLight.position.set(-5.0, 4.5, -5.5);
    scene.add(rimLight);

    // Static ESD mat + prototype breadboard
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const envRoot = createStaticWorkbenchEnvironment(maxAniso);
    scene.add(envRoot);

    // Dynamic roots for Board + Sensor + Wires
    const hardwareRoot = new THREE.Group();
    const wiresRoot = new THREE.Group();
    scene.add(hardwareRoot, wiresRoot);
    hardwareRootRef.current = hardwareRoot;
    wiresRootRef.current = wiresRoot;

    // Selection/Hover Highlight Ring + Dual Guide Assistant Target Rings (Cyan=Sensor, Amber=Board)
    const ringGeo = new THREE.TorusGeometry(0.14, 0.022, 10, 24);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const highlightRing = new THREE.Mesh(ringGeo, ringMat);
    highlightRing.visible = false;
    scene.add(highlightRing);
    highlightRingRef.current = highlightRing;

    const guideGeo = new THREE.TorusGeometry(0.175, 0.024, 10, 24);
    guideGeo.rotateX(Math.PI / 2);
    const guideSensorRing = new THREE.Mesh(
      guideGeo,
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    guideSensorRing.visible = false;
    const guideBoardRing = new THREE.Mesh(
      guideGeo.clone(),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    guideBoardRing.visible = false;
    scene.add(guideSensorRing, guideBoardRing);
    guideSensorRingRef.current = guideSensorRing;
    guideBoardRingRef.current = guideBoardRing;

    // Coalesced On-Demand & Paced Software-WebGL Loop
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 4);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 24);
          }
        };
        frameId = window.setTimeout(poll, 4);
      } else {
        frameId = window.setTimeout(cb, 24);
      }
    };

    const advanceScene = (dt: number, nowSec: number) => {
      // Smooth damped camera preset transitions
      if (cameraGoalRef.current.active) {
        _camGoalPos.set(...cameraGoalRef.current.pos);
        _camGoalTarget.set(...cameraGoalRef.current.target);
        if (reducedMotion) {
          camera.position.copy(_camGoalPos);
          controls.target.copy(_camGoalTarget);
          cameraGoalRef.current.active = false;
        } else {
          const factor = 1 - Math.exp(-8 * dt);
          camera.position.lerp(_camGoalPos, factor);
          controls.target.lerp(_camGoalTarget, factor);
          if (
            camera.position.distanceTo(_camGoalPos) < 0.03 &&
            controls.target.distanceTo(_camGoalTarget) < 0.03
          ) {
            camera.position.copy(_camGoalPos);
            controls.target.copy(_camGoalTarget);
            cameraGoalRef.current.active = false;
          }
        }
      }

      const hw = hardwareRef.current;
      const res = simResultRef.current;
      const env = envInputsRef.current;
      const live = isCheckingLiveRef.current;

      if (hw) {
        const working = live && res.overallStatus === 'working';

        // Fault indicator on controller user LED
        if (res.overallStatus === 'short_circuit') {
          hw.boardPowerLedMat.color.setHex(0xef4444);
          hw.boardPowerLedMat.emissive.setHex(0xef4444);
          hw.boardPowerLedMat.emissiveIntensity = 1.2;
        } else {
          hw.boardPowerLedMat.color.setHex(0x22c55e);
          hw.boardPowerLedMat.emissive.setHex(0x22c55e);
          hw.boardPowerLedMat.emissiveIntensity = 0.85;
        }

        // LED Circuit Animation (1 Hz blink when digital pin connected + blinkEnabled)
        const blinkOn =
          working &&
          res.telemetry.ledActive &&
          (!env.blinkEnabled || reducedMotion || Math.floor(nowSec * 1.4) % 2 === 0);

        if (hw.ledDomeMat && hw.ledCoreMat) {
          if (working && res.telemetry.ledActive && blinkOn) {
            hw.ledDomeMat.emissive.setHex(0x38bdf8);
            hw.ledDomeMat.emissiveIntensity = 1.15;
            hw.ledCoreMat.color.setHex(0xe0f2fe);
            hw.boardUserLedMat.emissive.setHex(0x38bdf8);
            hw.boardUserLedMat.emissiveIntensity = 1.1;
          } else {
            hw.ledDomeMat.emissive.setHex(0x000000);
            hw.ledDomeMat.emissiveIntensity = 0;
            hw.ledCoreMat.color.setHex(0x1e293b);
            hw.boardUserLedMat.emissive.setHex(0x000000);
            hw.boardUserLedMat.emissiveIntensity = 0;
          }
        }

        // DHT22 / HC-SR04 Status LED
        if (hw.sensorStatusLedMat) {
          if (working) {
            hw.sensorStatusLedMat.emissive.setHex(res.hasWarning ? 0xe5a93c : 0x4cc38a);
            hw.sensorStatusLedMat.emissiveIntensity = 1.1;
          } else if (res.overallStatus === 'short_circuit' || res.overallStatus === 'wiring_error') {
            hw.sensorStatusLedMat.emissive.setHex(0xef4444);
            hw.sensorStatusLedMat.emissiveIntensity = 0.9;
          } else {
            hw.sensorStatusLedMat.emissive.setHex(0x000000);
            hw.sensorStatusLedMat.emissiveIntensity = 0;
          }
        }

        // HC-SR04 Movable Obstacle Block & Ultrasonic Rings along local +Z of sonarAxisGroup
        if (hw.obstacleGroup) {
          const targetZ = THREE.MathUtils.mapLinear(
            THREE.MathUtils.clamp(env.obstacleDistanceCm, 10, 150),
            10,
            150,
            0.85,
            2.3
          );
          hw.obstacleGroup.position.z = reducedMotion
            ? targetZ
            : THREE.MathUtils.damp(hw.obstacleGroup.position.z, targetZ, 8, dt);

          hw.sonarWaveRings.forEach((ring, idx) => {
            if (!working || reducedMotion) {
              ring.visible = false;
              return;
            }
            ring.visible = true;
            const phase = ((nowSec * 0.85 + idx * 0.5) % 1 + 1) % 1;
            const zDist = Math.max(0.25, hw.obstacleGroup!.position.z - 0.52);
            ring.position.z = 0.54 + phase * zDist;
            const scale = 0.55 + phase * 0.85;
            ring.scale.set(scale, scale, 1);
            (ring.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.65;
          });
        }
      }

      controls.update();
    };

    const shouldKeepLooping = () => {
      if (disposed || reducedMotion) return false;
      if (cameraGoalRef.current.active) return true;
      const res = simResultRef.current;
      const liveWorking = isCheckingLiveRef.current && res.overallStatus === 'working';
      if (!liveWorking) return false;
      return (
        (presetIdRef.current === 'led-blink' && envInputsRef.current.blinkEnabled) ||
        presetIdRef.current === 'hcsr04-sonar'
      );
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame((now) => {
        if (disposed) return;
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        renderDirty = false;
        advanceScene(dt, now / 1000);
        renderer.render(scene, camera);
        renderer.domElement.dataset.renderedScene = `${boardIdRef.current}:${presetIdRef.current}`;

        const done = () => {
          renderBusy = false;
          if (disposed) return;
          if (renderDirty || shouldKeepLooping()) {
            requestRender();
          }
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };
    requestRenderRef.current = requestRender;

    controls.addEventListener('change', requestRender);

    // Pre-warm shaders once on hardware GPUs
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting for 3D Pin Hover & Click (Layer 1 hitboxes only)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    let lastHoverTime = 0;
    let pointerDownX = 0;
    let pointerDownY = 0;

    const getHitMeta = (clientX: number, clientY: number) => {
      const hw = hardwareRef.current;
      if (!hw) return null;
      const r = renderer.domElement.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return null;
      _rayPointer.x = ((clientX - r.left) / r.width) * 2 - 1;
      _rayPointer.y = -((clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(_rayPointer, camera);
      const hits = raycaster.intersectObjects(hw.interactiveProxies, false);
      if (hits.length === 0) return null;
      return hits[0].object;
    };

    const hwPosFromHit = (obj: THREE.Object3D) =>
      Boolean(obj.userData && typeof obj.userData.pinId === 'string');

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastHoverTime < 50) return;
      lastHoverTime = now;

      const hit = getHitMeta(e.clientX, e.clientY);
      const ring = highlightRingRef.current;
      if (hit && hwPosFromHit(hit)) {
        const { targetType, pinId, label } = hit.userData as {
          targetType: 'board' | 'sensor';
          pinId: string;
          label: string;
        };
        renderer.domElement.style.cursor = 'pointer';
        setHoveredPinLabel(`${targetType === 'board' ? 'Board' : 'Sensor'}: ${label} (${pinId})`);
        if (ring) {
          const anchorMap =
            targetType === 'board'
              ? hardwareRef.current?.boardPinAnchors
              : hardwareRef.current?.sensorPinAnchors;
          const anchor = anchorMap?.get(pinId);
          if (anchor) {
            ring.position.set(anchor.worldPos.x, anchor.worldPos.y - 0.14, anchor.worldPos.z);
            ring.visible = true;
            requestRender();
          }
        }
      } else {
        renderer.domElement.style.cursor = 'grab';
        setHoveredPinLabel(null);
        const sel = selectedSensorPinRef.current;
        const selAnchor = sel ? hardwareRef.current?.sensorPinAnchors.get(sel) : null;
        if (ring && selAnchor) {
          ring.position.set(selAnchor.worldPos.x, selAnchor.worldPos.y - 0.14, selAnchor.worldPos.z);
          ring.visible = true;
          requestRender();
        } else if (ring && ring.visible) {
          ring.visible = false;
          requestRender();
        }
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownX = e.clientX;
      pointerDownY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
      if (dist > 6) return; // Was an orbit drag, not a pin click
      const hit = getHitMeta(e.clientX, e.clientY);
      if (hit && hwPosFromHit(hit)) {
        const { targetType, pinId } = hit.userData as {
          targetType: 'board' | 'sensor';
          pinId: string;
        };
        pinClickBridgeRef.current(targetType, pinId);
      }
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError('3D graphics context was interrupted. Restore or refresh to continue.');
    };

    const onContextRestored = () => {
      setWebglError(null);
      requestRender();
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const ro = new ResizeObserver(() => {
      const box = container.getBoundingClientRect();
      const w = Math.max(320, Math.round(box.width));
      const h = Math.max(320, Math.round(box.height));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (!renderBusy && hardwareRef.current) {
        advanceScene(0, performance.now() / 1000);
        renderer.render(scene, camera);
        renderer.domElement.dataset.renderedScene = `${boardIdRef.current}:${presetIdRef.current}`;
      } else {
        requestRender();
      }
    });
    ro.observe(container);

    // Expose live animation state flag for automated verification checks
    isAnimatingRef.current = true;
    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      ro.disconnect();
      controls.removeEventListener('change', requestRender);
      controls.dispose();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);

      disposeObject3D(scene);
      envTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      rendererRef.current = null;
      requestRenderRef.current = null;
    };
  }, []);

  // 2. Rebuild Board + Sensor models when user switches kit or controller
  useEffect(() => {
    const hwRoot = hardwareRootRef.current;
    const renderer = rendererRef.current;
    if (!hwRoot || !renderer) return;

    while (hwRoot.children.length > 0) {
      const child = hwRoot.children[0];
      hwRoot.remove(child);
      disposeObject3D(child);
    }

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const built = buildActiveHardware(boardId, presetId, maxAniso);
    hwRoot.add(built.boardGroup, built.sensorGroup);
    hardwareRef.current = built;
    requestRenderRef.current?.();
  }, [boardId, presetId]);

  // 3. Rebuild Jumper Wires + trigger render whenever connections or telemetry change
  useEffect(() => {
    const wiresRoot = wiresRootRef.current;
    const hw = hardwareRef.current;
    if (!wiresRoot || !hw) return;

    while (wiresRoot.children.length > 0) {
      const child = wiresRoot.children[0];
      wiresRoot.remove(child);
      disposeObject3D(child);
    }

    const builtWires = buildWireMeshes(
      connections,
      hw.boardPinAnchors,
      hw.sensorPinAnchors,
      simResult
    );
    wiresRoot.add(builtWires);
    requestRenderRef.current?.();
  }, [connections, boardId, presetId, simResult]);

  // 4. Sync 3D Guide Rings when Assistant highlights next pins or detects a fault step
  useEffect(() => {
    const hw = hardwareRef.current;
    const sRing = guideSensorRingRef.current;
    const bRing = guideBoardRingRef.current;
    if (!hw || !sRing || !bRing) return;

    const targetPair =
      highlightedPair ??
      (guideContext.activeStep
        ? {
            sensorPinId: guideContext.activeStep.sensorPinId,
            boardPinId: guideContext.activeStep.boardPinId,
          }
        : null);

    if (targetPair) {
      const sAnchor = hw.sensorPinAnchors.get(targetPair.sensorPinId);
      const bAnchor = hw.boardPinAnchors.get(targetPair.boardPinId);
      if (sAnchor) {
        sRing.position.set(sAnchor.worldPos.x, sAnchor.worldPos.y - 0.14, sAnchor.worldPos.z);
        sRing.visible = true;
      } else {
        sRing.visible = false;
      }
      if (bAnchor) {
        bRing.position.set(bAnchor.worldPos.x, bAnchor.worldPos.y - 0.14, bAnchor.worldPos.z);
        bRing.visible = true;
      } else {
        bRing.visible = false;
      }
    } else {
      sRing.visible = false;
      bRing.visible = false;
    }

    requestRenderRef.current?.();
  }, [highlightedPair, guideContext.activeStep, boardId, presetId]);

  // Trigger render on env slider changes or live check toggles
  useEffect(() => {
    requestRenderRef.current?.();
  }, [envInputs, isCheckingLive]);

  const statusTone = useMemo(() => {
    if (simResult.overallStatus === 'short_circuit' || simResult.overallStatus === 'wiring_error') {
      return {
        border: 'border-[#ef4444]/40',
        text: 'text-[#f87171]',
        label: 'Wiring fault detected',
      };
    }
    if (simResult.overallStatus === 'working') {
      if (simResult.hasWarning) {
        return {
          border: 'border-[#e5a93c]/40',
          text: 'text-[#e5a93c]',
          label: 'Working (check level note)',
        };
      }
      return {
        border: 'border-[#4cc38a]/40',
        text: 'text-[#4cc38a]',
        label: 'Verified safe to build',
      };
    }
    if (simResult.overallStatus === 'incomplete') {
      return {
        border: 'border-[#38bdf8]/35',
        text: 'text-[#38bdf8]',
        label: 'Finish connecting pins',
      };
    }
    return {
      border: 'border-[#eef0f5]/[0.14]',
      text: 'text-[#a3a9b8]',
      label: 'Ready to wire',
    };
  }, [simResult]);

  const boardPins = BOARD_PINS[boardId];

  return (
    <div
      className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-[#07080d]"
      data-sandbox-status={simResult.overallStatus}
    >
      {/* Isolated WebGL Mount Container (Zero React children inside; 100% unobstructed center) */}
      <div
        ref={mountRef}
        data-testid="sandbox-3d-canvas"
        data-preserve-dark="true"
        className="absolute inset-0 h-full w-full"
      />

      {webglError && (
        <div className="relative z-20 mx-auto my-12 max-w-lg rounded-xl border border-[#eef0f5]/[0.14] bg-[#0b0d14] p-6 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-[#e5a93c]" strokeWidth={1.5} />
          <h2 className="mt-3 font-display text-lg font-medium text-[#eef0f5]">
            3D Viewport Unavailable
          </h2>
          <p className="mt-1.5 text-sm text-[#a3a9b8]">{webglError}</p>
        </div>
      )}

      {/* Minimal Top Spec Strip (Solid dark surface — NO backdrop-blur over WebGL) */}
      <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-7xl flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="pointer-events-auto rounded-xl border border-[#eef0f5]/[0.12] bg-[#0b0d14]/95 px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#7a8296]">
            <span className="font-medium text-[#38bdf8]">Beginner 3D Circuit Lab</span>
            <span aria-hidden="true">·</span>
            <span>{boardId === 'arduino-uno' ? 'Arduino Uno R3' : 'ESP32 DevKit V1'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-[#eef0f5]">{activePreset.shortTitle}</span>
          </div>
          <h1 className="mt-0.5 font-display text-base font-medium text-[#eef0f5] sm:text-lg">
            {activePreset.title}
          </h1>
          <p className="mt-0.5 text-xs text-[#a3a9b8]">
            {hoveredPinLabel
              ? `Click pin to wire: ${hoveredPinLabel}`
              : selectedSensorPin
              ? `Now click a microcontroller pin to connect ${selectedSensorPin}`
              : guideContext.activeStep
              ? `Guide Step ${guideContext.activeStep.stepNumber}: Connect ${guideContext.activeStep.sensorPinLabel} (cyan ring) → ${guideContext.activeStep.boardPinLabel} (amber ring)`
              : 'Drag to orbit 360° · Click any pin in 3D or ask the Beginner Guide below'}
          </p>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('assistant');
              setDockCollapsed(false);
            }}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-colors duration-150 ease-unslop ${
              activeTab === 'assistant' && !dockCollapsed
                ? 'border-[#38bdf8]/50 bg-[#0b0d14]/95 text-[#eef0f5]'
                : 'border-[#eef0f5]/[0.12] bg-[#0b0d14]/95 text-[#a3a9b8] hover:border-[#38bdf8]/40 hover:text-[#eef0f5]'
            }`}
          >
            <Sparkles className="h-4 w-4 text-[#38bdf8]" strokeWidth={1.5} />
            Beginner Guide
          </button>

          {/* Static Pre-Wiring Safety Verdict Badge (Zero pulsating dots) */}
          <div
            className={`flex items-center gap-2.5 rounded-xl border bg-[#0b0d14]/95 px-4 py-2.5 ${statusTone.border}`}
          >
            {simResult.overallStatus === 'working' ? (
              simResult.hasWarning ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#e5a93c]" strokeWidth={1.5} />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4cc38a]" strokeWidth={1.5} />
              )
            ) : simResult.overallStatus === 'short_circuit' || simResult.overallStatus === 'wiring_error' ? (
              <ShieldAlert className="h-4 w-4 shrink-0 text-[#f87171]" strokeWidth={1.5} />
            ) : (
              <Cable className="h-4 w-4 shrink-0 text-[#38bdf8]" strokeWidth={1.5} />
            )}
            <div>
              <div className={`text-xs font-medium ${statusTone.text}`}>{statusTone.label}</div>
              <div className="font-mono text-xs text-[#eef0f5] tabular-nums">
                {simResult.telemetry.primaryValue}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer ensuring center 3D scene stays open */}
      <div className="pointer-events-none flex-1" />

      {/* Collapsible Bottom Control Dock (Zero left/right side occlusion) */}
      <div className="pointer-events-none relative z-20 mx-auto mb-3 flex w-full max-w-[min(940px,95vw)] flex-col items-center px-2">
        <button
          type="button"
          onClick={() => setDockCollapsed((prev) => !prev)}
          aria-expanded={!dockCollapsed}
          className="pointer-events-auto inline-flex h-7 items-center gap-1.5 rounded-t-lg border border-b-0 border-[#eef0f5]/[0.14] bg-[#0b0d14]/95 px-3 text-xs font-medium text-[#a3a9b8] transition-colors duration-150 ease-unslop hover:text-[#eef0f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38bdf8]"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
              Show Wiring Controls
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
              Hide Controls
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto max-h-[54vh] w-full overflow-y-auto rounded-xl border border-[#eef0f5]/[0.14] bg-[#0b0d14]/96 p-3 shadow-2xl lg:max-h-none lg:overflow-visible">
            {/* Top Bar Inside Dock: Tabs + Kit Selector + Primary Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#eef0f5]/[0.08] pb-2.5">
              {/* 4 Functional Dock Tabs */}
              <div
                className="flex flex-wrap items-center gap-1 rounded-lg bg-[#11141c] p-1"
                role="tablist"
                aria-label="3D bench tabs"
              >
                {(
                  [
                    { id: 'assistant', label: 'Beginner Guide', icon: Sparkles },
                    { id: 'wire', label: '1. Connect Pins', icon: Cable },
                    { id: 'check', label: '2. Test & Verify', icon: CheckCircle2 },
                    { id: 'camera', label: '3. Camera & Spec', icon: Camera },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(tab.id)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ease-unslop ${
                        active
                          ? 'bg-[#1a1e28] text-[#eef0f5]'
                          : 'text-[#a3a9b8] hover:text-[#eef0f5]'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-[#38bdf8]" strokeWidth={1.5} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Quick Kit & Board Switchers */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg bg-[#11141c] p-1" role="group" aria-label="Beginner starter circuit">
                  {BEGINNER_CIRCUIT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => switchPreset(p.id)}
                      className={`h-7 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ease-unslop ${
                        presetId === p.id
                          ? 'bg-[#38bdf8] text-[#07080d]'
                          : 'text-[#a3a9b8] hover:text-[#eef0f5]'
                      }`}
                    >
                      {p.shortTitle}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 rounded-lg bg-[#11141c] p-1" role="group" aria-label="Microcontroller board">
                  {(
                    [
                      { id: 'arduino-uno', label: 'Arduino Uno' },
                      { id: 'esp32', label: 'ESP32' },
                    ] as const
                  ).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => switchBoard(b.id)}
                      className={`h-7 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ease-unslop ${
                        boardId === b.id
                          ? 'bg-[#1a1e28] text-[#eef0f5]'
                          : 'text-[#a3a9b8] hover:text-[#eef0f5]'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TAB 0: BEGINNER GUIDE ASSISTANT */}
            {activeTab === 'assistant' && (
              <LabAssistantPanel
                presetId={presetId}
                boardId={boardId}
                connections={connections}
                simResult={simResult}
                envInputs={envInputs}
                guideContext={guideContext}
                highlightedPair={highlightedPair}
                onHighlightPair={setHighlightedPair}
                onWireStep={(sPin, bPin) => {
                  handleConnectPair(sPin, bPin);
                  setHighlightedPair(null);
                  setIsCheckingLive(true);
                }}
                onStartGuidedPractice={handleStartGuidedPractice}
                onOpenManualWiring={() => setActiveTab('wire')}
                onToggleTestPower={() => {
                  setIsCheckingLive((prev) => !prev);
                  setActiveTab('check');
                }}
              />
            )}

            {/* TAB 1: CONNECT PINS */}
            {activeTab === 'wire' && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                  {/* Left: Sensor Pins */}
                  <div className="md:col-span-5">
                    <div className="text-xs font-medium text-[#a3a9b8]">
                      Step A · Pick a sensor pin
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {activePreset.sensorPins.map((sp) => {
                        const existing = connections.find((c) => c.sensorPinId === sp.pinId);
                        const isSelected = selectedSensorPin === sp.pinId;
                        const diag = simResult.checks.find((c) => c.id === sp.pinId);
                        return (
                          <div key={sp.pinId} className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedSensorPin((prev) =>
                                  prev === sp.pinId ? null : sp.pinId
                                )
                              }
                              className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 ease-unslop ${
                                isSelected
                                  ? 'border-[#38bdf8] bg-[#38bdf8]/15 text-[#eef0f5]'
                                  : diag?.status === 'error'
                                  ? 'border-[#ef4444]/50 bg-[#11141c] text-[#f87171]'
                                  : existing
                                  ? 'border-[#4cc38a]/40 bg-[#11141c] text-[#eef0f5]'
                                  : 'border-[#eef0f5]/[0.1] bg-[#11141c] text-[#a3a9b8] hover:text-[#eef0f5]'
                              }`}
                            >
                              <span className="font-mono">{sp.pinId}</span>
                              {existing && (
                                <span className="font-mono text-[#38bdf8]">
                                  → {existing.boardPinId}
                                </span>
                              )}
                            </button>
                            {existing && (
                              <button
                                type="button"
                                aria-label={`Disconnect ${sp.pinId} wire`}
                                onClick={() => handleRemoveSensorWire(sp.pinId)}
                                className="inline-flex h-8 w-7 items-center justify-center rounded-md border border-[#eef0f5]/[0.08] bg-[#11141c] text-xs text-[#7a8296] hover:text-[#eef0f5]"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Board Pins */}
                  <div className="md:col-span-7">
                    <div className="text-xs font-medium text-[#a3a9b8]">
                      Step B ·{' '}
                      {selectedSensorPin
                        ? `Connect ${selectedSensorPin} to a board pin:`
                        : 'Select a sensor pin first to route a wire'}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {boardPins.map((bp) => (
                        <button
                          key={bp.id}
                          type="button"
                          disabled={!selectedSensorPin}
                          onClick={() => {
                            if (selectedSensorPin) {
                              handleConnectPair(selectedSensorPin, bp.id);
                            }
                          }}
                          className={`inline-flex h-8 items-center rounded-md border px-2.5 font-mono text-xs whitespace-nowrap transition-colors duration-150 ease-unslop ${
                            selectedSensorPin
                              ? 'border-[#eef0f5]/[0.16] bg-[#1a1e28] text-[#eef0f5] hover:border-[#38bdf8] hover:text-[#38bdf8]'
                              : 'cursor-not-allowed border-[#eef0f5]/[0.06] bg-[#11141c] text-[#7a8296]/60'
                          }`}
                          title={bp.description}
                        >
                          {bp.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f5]/[0.08] pt-3">
                  <p className="text-xs text-[#a3a9b8]">{simResult.headline}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <ShinyButton
                      type="button"
                      size="sm"
                      cornerRadius={8}
                      fillColor="#0b0d14"
                      insetColor="rgba(56, 189, 248, 0.3)"
                      labelColor="#eef0f5"
                      accentColor="#38bdf8"
                      accentSoftColor="#7dd3fc"
                      label="Auto-Wire Correct"
                      onClick={() => {
                        setConnections(getIdealConnections(presetId, boardId));
                        setSelectedSensorPin(null);
                        setIsCheckingLive(true);
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#38bdf8]" strokeWidth={1.5} />
                      Auto-Wire Correct
                    </ShinyButton>

                    <ShinyButton
                      type="button"
                      size="sm"
                      cornerRadius={8}
                      fillColor="#11141c"
                      insetColor="rgba(238, 240, 245, 0.14)"
                      labelColor="#eef0f5"
                      accentColor="#ef4444"
                      accentSoftColor="#fca5a5"
                      speckleOpacity={0.22}
                      label="Test Mistake"
                      onClick={() => {
                        setConnections(getMistakeConnections(presetId, boardId));
                        setSelectedSensorPin(null);
                        setActiveTab('check');
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-[#f87171]" strokeWidth={1.5} />
                      Test Mistake
                    </ShinyButton>

                    <button
                      type="button"
                      onClick={() => {
                        setConnections([]);
                        setSelectedSensorPin(null);
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#eef0f5]/[0.1] bg-[#11141c] px-3 text-xs font-medium text-[#a3a9b8] whitespace-nowrap transition-colors duration-150 ease-unslop hover:border-[#eef0f5]/[0.2] hover:text-[#eef0f5]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('check')}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#38bdf8]/40 bg-[#11141c] px-3 text-xs font-medium text-[#38bdf8] whitespace-nowrap transition-colors duration-150 ease-unslop hover:bg-[#1a1e28]"
                    >
                      Check Circuit
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TEST & VERIFY */}
            {activeTab === 'check' && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-col justify-between gap-3 rounded-lg border border-[#eef0f5]/[0.08] bg-[#11141c] p-3 sm:flex-row sm:items-center">
                  <div>
                    <div className={`text-xs font-medium ${statusTone.text}`}>
                      {simResult.headline}
                    </div>
                    <p className="mt-0.5 text-xs text-[#a3a9b8]">{simResult.summary}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <ShinyButton
                      type="button"
                      size="sm"
                      cornerRadius={8}
                      fillColor="#0b0d14"
                      insetColor="rgba(56, 189, 248, 0.3)"
                      labelColor="#eef0f5"
                      accentColor={isCheckingLive ? '#4cc38a' : '#38bdf8'}
                      accentSoftColor="#7dd3fc"
                      label={isCheckingLive ? 'Power ON (Testing)' : 'Power USB Test'}
                      onClick={() => setIsCheckingLive((prev) => !prev)}
                      className="h-8 px-3 text-xs"
                    >
                      {isCheckingLive ? (
                        <>
                          <Square className="h-3.5 w-3.5 text-[#4cc38a]" strokeWidth={1.5} />
                          Power ON (Testing)
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 text-[#38bdf8]" strokeWidth={1.5} />
                          Power USB Test
                        </>
                      )}
                    </ShinyButton>
                  </div>
                </div>

                {/* Wire-by-Wire Verification Checklist */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {simResult.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className="flex items-start gap-2 rounded-lg border border-[#eef0f5]/[0.08] bg-[#11141c] px-3 py-2 text-xs"
                    >
                      {chk.status === 'pass' ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4cc38a]" strokeWidth={1.5} />
                      ) : chk.status === 'warning' ? (
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e5a93c]" strokeWidth={1.5} />
                      ) : chk.status === 'error' ? (
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f87171]" strokeWidth={1.5} />
                      ) : (
                        <Cable className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7a8296]" strokeWidth={1.5} />
                      )}
                      <div>
                        <div className="font-mono font-medium text-[#eef0f5]">{chk.label}</div>
                        <div className="text-[#a3a9b8]">{chk.message}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Environment Controls to Verify Real Sensor Response */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#eef0f5]/[0.08] pt-3">
                  {presetId === 'led-blink' && (
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#eef0f5]">
                      <input
                        type="checkbox"
                        checked={envInputs.blinkEnabled}
                        onChange={(e) =>
                          setEnvInputs((prev) => ({ ...prev, blinkEnabled: e.target.checked }))
                        }
                        className="h-4 w-4 accent-[#38bdf8]"
                      />
                      Enable 1 Hz digital blink pulse
                    </label>
                  )}

                  {presetId === 'dht22-climate' && (
                    <div className="flex flex-wrap items-center gap-5">
                      <label className="flex items-center gap-2 text-xs text-[#a3a9b8]">
                        <span>Simulated Temp:</span>
                        <input
                          type="range"
                          min={0}
                          max={50}
                          step={0.5}
                          value={envInputs.temperatureC}
                          onChange={(e) =>
                            setEnvInputs((prev) => ({
                              ...prev,
                              temperatureC: Number(e.target.value),
                            }))
                          }
                          className="accent-[#38bdf8]"
                        />
                        <span className="font-mono text-[#eef0f5] tabular-nums">
                          {envInputs.temperatureC.toFixed(1)} °C
                        </span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-[#a3a9b8]">
                        <span>Humidity:</span>
                        <input
                          type="range"
                          min={15}
                          max={95}
                          step={1}
                          value={envInputs.humidityPct}
                          onChange={(e) =>
                            setEnvInputs((prev) => ({
                              ...prev,
                              humidityPct: Number(e.target.value),
                            }))
                          }
                          className="accent-[#38bdf8]"
                        />
                        <span className="font-mono text-[#eef0f5] tabular-nums">
                          {envInputs.humidityPct}% RH
                        </span>
                      </label>
                    </div>
                  )}

                  {presetId === 'hcsr04-sonar' && (
                    <label className="flex items-center gap-2 text-xs text-[#a3a9b8]">
                      <span>Move 3D obstacle target:</span>
                      <input
                        type="range"
                        min={10}
                        max={150}
                        step={1}
                        value={envInputs.obstacleDistanceCm}
                        onChange={(e) =>
                          setEnvInputs((prev) => ({
                            ...prev,
                            obstacleDistanceCm: Number(e.target.value),
                          }))
                        }
                        className="accent-[#38bdf8]"
                      />
                      <span className="font-mono text-[#eef0f5] tabular-nums">
                        {envInputs.obstacleDistanceCm} cm ({simResult.telemetry.secondaryValue})
                      </span>
                    </label>
                  )}

                  <div className="font-mono text-xs text-[#38bdf8] tabular-nums">
                    {simResult.telemetry.primaryLabel}: {simResult.telemetry.primaryValue}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CAMERA & REAL BUILD GUIDE */}
            {activeTab === 'camera' && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-[#a3a9b8]">Camera views:</span>
                  {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((camKey) => (
                    <button
                      key={camKey}
                      type="button"
                      onClick={() => handleSelectCameraPreset(camKey)}
                      className={`h-8 rounded-md border px-3 text-xs font-medium whitespace-nowrap transition-colors duration-150 ease-unslop ${
                        cameraPreset === camKey
                          ? 'border-[#38bdf8]/60 bg-[#1a1e28] text-[#eef0f5]'
                          : 'border-[#eef0f5]/[0.1] bg-[#11141c] text-[#a3a9b8] hover:text-[#eef0f5]'
                      }`}
                    >
                      {CAMERA_PRESETS[camKey].label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate({
                        name: 'component-detail',
                        componentId: activePreset.relatedComponentId,
                      })
                    }
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#eef0f5]/[0.12] bg-[#11141c] px-3 text-xs font-medium text-[#eef0f5] whitespace-nowrap transition-colors duration-150 ease-unslop hover:border-[#eef0f5]/[0.24]"
                  >
                    <Cpu className="h-3.5 w-3.5 text-[#38bdf8]" strokeWidth={1.5} />
                    Inspect Pinout Spec
                  </button>

                  <ShinyButton
                    type="button"
                    size="sm"
                    cornerRadius={8}
                    fillColor="#0b0d14"
                    insetColor="rgba(56, 189, 248, 0.3)"
                    labelColor="#eef0f5"
                    accentColor="#38bdf8"
                    accentSoftColor="#7dd3fc"
                    label="Open Build Guide"
                    onClick={() =>
                      onNavigate({
                        name: 'project-detail',
                        projectId: activePreset.relatedProjectId,
                      })
                    }
                    className="h-8 px-3 text-xs"
                  >
                    <Wrench className="h-3.5 w-3.5 text-[#38bdf8]" strokeWidth={1.5} />
                    Open Build Guide
                  </ShinyButton>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
