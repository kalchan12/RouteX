import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SimulationEngine } from '../../core/simulation3d/SimulationEngine';
import { LightState, VehicleType, VehicleState } from '../../core/simulation3d/types';

export class Renderer3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private canvas: HTMLCanvasElement;

  private worldGroup = new THREE.Group();
  private environmentGroup = new THREE.Group();
  private vehicleMeshes = new Map<string, THREE.Group>();
  private lightMaterials = new Map<string, {r: THREE.MeshStandardMaterial, y: THREE.MeshStandardMaterial, g: THREE.MeshStandardMaterial}>();
  
  private peds: any[] = [];
  private birds: any[] = [];
  
  private lastTime = performance.now();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private selectedVehicleId: string | null = null;
  private actionCamTargetId: string | null = null;
  private onVehicleSelectCallback?: (id: string | null) => void;
  private selectionBeacon: THREE.Mesh;

  private sun: THREE.DirectionalLight | null = null;
  private ambient: THREE.AmbientLight | null = null;

  constructor(canvas: HTMLCanvasElement, engine: SimulationEngine) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();

    const env = engine.currentScenario?.environment;
    this.scene.background = new THREE.Color(env?.skyColor || '#87CEEB');
    this.scene.fog = new THREE.FogExp2(env?.fogColor || '#87CEEB', env?.fogDensity || 0.01);

    this.camera = new THREE.PerspectiveCamera(40, canvas.width / canvas.height, 1, 1000);
    this.camera.position.set(0, 80, 80);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
    this.controls.target.set(0, 0, 0);

    this.scene.add(this.worldGroup);
    this.scene.add(this.environmentGroup);

    // Cyan selection beacon over active vehicle
    const beaconGeo = new THREE.ConeGeometry(0.6, 1.4, 4);
    beaconGeo.rotateX(Math.PI);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: '#4cd7f6',
      emissive: '#4cd7f6',
      emissiveIntensity: 2.5
    });
    this.selectionBeacon = new THREE.Mesh(beaconGeo, beaconMat);
    this.selectionBeacon.visible = false;
    this.scene.add(this.selectionBeacon);

    this.setupLighting(env);
    this.generateStaticWorld(engine);
    this.generateEnvironment(engine);
    if (env?.landmarkType) {
      this.buildScenarioLandmarks(env.landmarkType);
    }

    this.canvas.addEventListener('click', this.onCanvasClick);
  }

  public resize(width: number, height: number, dpr: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(dpr);
  }

  private setupLighting(theme?: any) {
    this.ambient = new THREE.AmbientLight('#ffffff', 0.75);
    this.scene.add(this.ambient);

    this.sun = new THREE.DirectionalLight(theme?.sunColor || '#ffffff', theme?.sunIntensity || 1.5);
    const pos = theme?.sunPosition || [50, 100, -30];
    this.sun.position.set(pos[0], pos[1], pos[2]);
    this.sun.castShadow = true;
    this.sun.shadow.camera.left = -120;
    this.sun.shadow.camera.right = 120;
    this.sun.shadow.camera.top = 120;
    this.sun.shadow.camera.bottom = -120;
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 300;
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.mapSize.width = 2048;
    this.sun.shadow.mapSize.height = 2048;
    this.scene.add(this.sun);
  }

  private generateStaticWorld(engine: SimulationEngine) {
    const env = engine.currentScenario?.environment;
    const gColor = env?.groundColor || '#559c55';
    const pColor = env?.grassColor || '#4d8f4d';

    // 1. Ground
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshStandardMaterial({ color: gColor, roughness: 1, metalness: 0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.worldGroup.add(ground);

    // Patches for subtle terrain variation
    const patchMat = new THREE.MeshStandardMaterial({ color: pColor, roughness: 1, metalness: 0 });
    for(let i = 0; i < 35; i++) {
        const patchGeo = new THREE.PlaneGeometry(12 + Math.random()*25, 12 + Math.random()*25);
        const patch = new THREE.Mesh(patchGeo, patchMat);
        patch.position.set((Math.random()-0.5)*450, 0.005, (Math.random()-0.5)*450);
        patch.rotation.x = -Math.PI / 2;
        patch.rotation.z = Math.random() * Math.PI;
        patch.receiveShadow = true;
        this.worldGroup.add(patch);
    }

    const roadMat = new THREE.MeshStandardMaterial({ color: '#52525b', roughness: 0.8 });
    const swMat = new THREE.MeshStandardMaterial({ color: '#d4d4d8', roughness: 0.9 });
    const lineMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });

    // 2. Roads and Sidewalks
    for (const r of engine.network.getAllRoads()) {
      for (const lane of r.lanes) {
        for (let i = 0; i < lane.waypoints.length - 1; i++) {
          const p1 = lane.waypoints[i]!;
          const p2 = lane.waypoints[i+1]!;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          const angle = Math.atan2(dy, dx);
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          // Sidewalk base
          const swGeo = new THREE.PlaneGeometry(dist, 7.5);
          const swMesh = new THREE.Mesh(swGeo, swMat);
          swMesh.position.set(midX, 0.01, midY);
          swMesh.rotation.x = -Math.PI / 2;
          swMesh.rotation.z = -angle; // rotate in Z after X rotation to yaw
          swMesh.receiveShadow = true;
          this.worldGroup.add(swMesh);

          // Road surface
          const rdGeo = new THREE.PlaneGeometry(dist, 3.5);
          const rdMesh = new THREE.Mesh(rdGeo, roadMat);
          rdMesh.position.set(midX, 0.02, midY);
          rdMesh.rotation.x = -Math.PI / 2;
          rdMesh.rotation.z = -angle;
          rdMesh.receiveShadow = true;
          this.worldGroup.add(rdMesh);
          
          // Center line (dashed)
          const numDashes = Math.floor(dist / 1.5);
          const dashGeo = new THREE.PlaneGeometry(0.8, 0.1);
          for(let d = 0; d < numDashes; d++) {
             const t = (d + 0.5) / numDashes;
             const x = p1.x + dx * t;
             const y = p1.y + dy * t;
             const dash = new THREE.Mesh(dashGeo, lineMat);
             const perpX = -Math.sin(angle) * 1.75;
             const perpY = Math.cos(angle) * 1.75;
             dash.position.set(x + perpX, 0.03, y + perpY);
             dash.rotation.x = -Math.PI / 2;
             dash.rotation.z = -angle;
             this.worldGroup.add(dash);
          }

          // Edge lines (solid)
          const edgeGeo = new THREE.PlaneGeometry(dist, 0.1);
          const edge1 = new THREE.Mesh(edgeGeo, lineMat);
          const p1X = -Math.sin(angle) * 1.65;
          const p1Y = Math.cos(angle) * 1.65;
          edge1.position.set(midX + p1X, 0.03, midY + p1Y);
          edge1.rotation.x = -Math.PI / 2;
          edge1.rotation.z = -angle;
          this.worldGroup.add(edge1);
          
          const edge2 = new THREE.Mesh(edgeGeo, lineMat);
          edge2.position.set(midX - p1X, 0.03, midY - p1Y);
          edge2.rotation.x = -Math.PI / 2;
          edge2.rotation.z = -angle;
          this.worldGroup.add(edge2);
        }
      }
    }

    // 3. Intersections
    for (const ix of engine.network.getAllIntersections()) {
      const ixSwGeo = new THREE.PlaneGeometry(ix.size + 3.8, ix.size + 3.8);
      const ixSwMesh = new THREE.Mesh(ixSwGeo, swMat);
      ixSwMesh.position.set(ix.position.x, 0.015, ix.position.y);
      ixSwMesh.rotation.x = -Math.PI / 2;
      ixSwMesh.receiveShadow = true;
      this.worldGroup.add(ixSwMesh);

      const ixRdGeo = new THREE.PlaneGeometry(ix.size, ix.size);
      const ixRdMesh = new THREE.Mesh(ixRdGeo, roadMat);
      ixRdMesh.position.set(ix.position.x, 0.025, ix.position.y);
      ixRdMesh.rotation.x = -Math.PI / 2;
      ixRdMesh.receiveShadow = true;
      this.worldGroup.add(ixRdMesh);
      // Zebra crossings — proper dimensions with Z-fighting fix
      const zebraStripeW = 0.5;   // stripe width (along traffic)
      const zebraStripeL = 3.2;   // stripe length (across road)
      const zebraGap = 0.5;       // gap between stripes
      const zebraCount = 7;       // stripes per crossing
      const zebraTotalW = zebraCount * zebraStripeW + (zebraCount - 1) * zebraGap;
      const zebraGeo = new THREE.PlaneGeometry(zebraStripeW, zebraStripeL);
      const zebraMat = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.7,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      for (let i = 0; i < 4; i++) {
        const dist = ix.size / 2 + 1.5;
        for (let j = 0; j < zebraCount; j++) {
          const offset = -zebraTotalW / 2 + zebraStripeW / 2 + j * (zebraStripeW + zebraGap);
          const zMesh = new THREE.Mesh(zebraGeo, zebraMat);
          if (i === 0) zMesh.position.set(ix.position.x + dist, 0.028, ix.position.y + offset);
          if (i === 1) zMesh.position.set(ix.position.x - dist, 0.028, ix.position.y + offset);
          if (i === 2) { zMesh.position.set(ix.position.x + offset, 0.028, ix.position.y + dist); zMesh.rotation.y = Math.PI / 2; }
          if (i === 3) { zMesh.position.set(ix.position.x + offset, 0.028, ix.position.y - dist); zMesh.rotation.y = Math.PI / 2; }
          zMesh.rotation.x = -Math.PI / 2;
          zMesh.receiveShadow = true;
          this.worldGroup.add(zMesh);
        }
      }

      // Traffic man
      const manGroup = new THREE.Group();
      const mBodyGeo = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
      const mBodyMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a' }); // blue uniform
      const mBody = new THREE.Mesh(mBodyGeo, mBodyMat);
      mBody.position.y = 0.9;
      manGroup.add(mBody);
      const mVestGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.6);
      const mVestMat = new THREE.MeshStandardMaterial({ color: '#eab308' }); // yellow vest
      const mVest = new THREE.Mesh(mVestGeo, mVestMat);
      mVest.position.y = 0.9;
      manGroup.add(mVest);
      manGroup.position.set(ix.position.x, 0, ix.position.y);
      manGroup.castShadow = true;
      this.worldGroup.add(manGroup);
      (this as any).trafficMan = manGroup;

      // Traffic Lights
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.1, 6);
      const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 4);
      const poleMat = new THREE.MeshStandardMaterial({ color: '#1a1a22', metalness: 0.8 });
      const boxGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
      const boxMat = new THREE.MeshStandardMaterial({ color: '#111' });

      for (const light of ix.lights) {
        const p = engine.network.toWorld(light.controlledLaneIds[0]!, light.stopPosition);
        const a = engine.network.toAngle(light.controlledLaneIds[0]!, light.stopPosition);
        if (!p) continue;
        
        const perpX = -Math.sin(a) * 3.5;
        const perpY = Math.cos(a) * 3.5;
        
        const poleGroup = new THREE.Group();
        poleGroup.position.set(p.x + perpX, 0, p.y + perpY);
        poleGroup.rotation.y = -a;
        this.worldGroup.add(poleGroup);

        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(0, 3, 0);
        pole.castShadow = true;
        poleGroup.add(pole);

        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(-2, 5.8, 0);
        arm.rotation.z = Math.PI / 2;
        arm.castShadow = true;
        poleGroup.add(arm);

        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(-3.5, 4.5, 0);
        box.castShadow = true;
        poleGroup.add(box);

        const bulbGeo = new THREE.SphereGeometry(0.2);
        const bulbMatR = new THREE.MeshStandardMaterial({ color: '#330000' });
        const bulbMatY = new THREE.MeshStandardMaterial({ color: '#333300' });
        const bulbMatG = new THREE.MeshStandardMaterial({ color: '#003300' });
        
        const bulbR = new THREE.Mesh(bulbGeo, bulbMatR);
        bulbR.position.set(0, 0.6, 0.3);
        box.add(bulbR);
        
        const bulbY = new THREE.Mesh(bulbGeo, bulbMatY);
        bulbY.position.set(0, 0, 0.3);
        box.add(bulbY);
        
        const bulbG = new THREE.Mesh(bulbGeo, bulbMatG);
        bulbG.position.set(0, -0.6, 0.3);
        box.add(bulbG);
        
        this.lightMaterials.set(light.id, { r: bulbMatR, y: bulbMatY, g: bulbMatG });
      }
    }
  }

  private trafficOfficer: THREE.Group | null = null;

  private generateEnvironment(engine: SimulationEngine) {
    const env = engine.currentScenario?.environment;
    const treePalette = env?.vegetationDensity && env.vegetationDensity < 0.5
      ? ['#65a30d', '#a3e635', '#4d7c0f', '#ca8a04']
      : ['#4ade80', '#22c55e', '#16a34a', '#15803d'];

    // 1. Trees
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#3e2723', roughness: 0.9 });
    const canopyGeo = new THREE.DodecahedronGeometry(2.5, 1);
    
    const treeCount = Math.floor(180 * (env?.vegetationDensity ?? 1.0));
    for (let i = 0; i < treeCount; i++) {
      const x = (Math.random() - 0.5) * 300;
      const z = (Math.random() - 0.5) * 300;
      if (Math.abs(x) < 14 || Math.abs(z) < 14) continue;
      
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.5;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      const color = treePalette[Math.floor(Math.random() * treePalette.length)]!;
      const canopyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.y = 3 + Math.random();
      canopy.scale.setScalar(0.8 + Math.random() * 0.5);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      tree.add(canopy);
      
      this.environmentGroup.add(tree);
    }

    // Bushes
    const bushGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const bushCount = Math.floor(90 * (env?.vegetationDensity ?? 1.0));
    for(let i=0; i<bushCount; i++) {
        const color = treePalette[Math.floor(Math.random()*treePalette.length)]!;
        const bushMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
        const bush = new THREE.Mesh(bushGeo, bushMat);
        const bx = (Math.random()-0.5)*200;
        const bz = (Math.random()-0.5)*200;
        if(Math.abs(bx) < 10 || Math.abs(bz) < 10) continue;
        bush.position.set(bx, 0.4, bz);
        bush.scale.set(1, 0.8 + Math.random()*0.5, 1);
        bush.castShadow = true;
        this.environmentGroup.add(bush);
    }

    // Lamp posts
    const lampGeo = new THREE.CylinderGeometry(0.05, 0.1, 5);
    const lampMat = new THREE.MeshStandardMaterial({ color: '#222', metalness: 0.5 });
    const lampGlowGeo = new THREE.SphereGeometry(0.3);
    const lampGlowMat = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#fef08a', emissiveIntensity: 1 });
    
    for(let i=0; i<40; i++) {
        const lamp = new THREE.Group();
        const lx = (Math.random()-0.5)*180;
        const lz = (Math.random()-0.5)*180;
        if(Math.abs(lx) < 8 || Math.abs(lz) < 8) continue;
        lamp.position.set(lx, 0, lz);
        
        const pole = new THREE.Mesh(lampGeo, lampMat);
        pole.position.y = 2.5;
        lamp.add(pole);
        
        const glow = new THREE.Mesh(lampGlowGeo, lampGlowMat);
        glow.position.y = 5.2;
        lamp.add(glow);
        
        this.environmentGroup.add(lamp);
    }

    // Park benches
    const benchGroup = new THREE.Group();
    const seatGeo = new THREE.BoxGeometry(2, 0.1, 0.8);
    const legGeo = new THREE.BoxGeometry(0.1, 0.5, 0.8);
    const woodMat = new THREE.MeshStandardMaterial({ color: '#8b5a2b' });
    const metalMat = new THREE.MeshStandardMaterial({ color: '#111' });
    
    const seat = new THREE.Mesh(seatGeo, woodMat);
    seat.position.y = 0.5;
    benchGroup.add(seat);
    const back = new THREE.Mesh(seatGeo, woodMat);
    back.position.set(0, 0.9, -0.4);
    back.rotation.x = Math.PI / 4;
    benchGroup.add(back);
    const leg1 = new THREE.Mesh(legGeo, metalMat);
    leg1.position.set(-0.9, 0.25, 0);
    benchGroup.add(leg1);
    const leg2 = new THREE.Mesh(legGeo, metalMat);
    leg2.position.set(0.9, 0.25, 0);
    benchGroup.add(leg2);
    
    for(let i=0; i<15; i++) {
        const b = benchGroup.clone();
        b.position.set((Math.random()-0.5)*150, 0, (Math.random()-0.5)*150);
        b.rotation.y = Math.random() * Math.PI * 2;
        this.environmentGroup.add(b);
    }

    // 2. Buildings
    const bLayouts = [
      { x: -50, z: -50, w: 25, d: 25, h: 15 }, { x: -20, z: -60, w: 12, d: 20, h: 25 },
      { x: -70, z: -20, w: 20, d: 12, h: 10 }, { x: 25, z: -50, w: 30, d: 25, h: 20 },
      { x: 60, z: -20, w: 25, d: 15, h: 35 }, { x: -55, z: 25, w: 35, d: 20, h: 18 },
      { x: -25, z: 55, w: 15, d: 25, h: 12 }, { x: 25, z: 25, w: 20, d: 30, h: 40 },
      { x: 50, z: 50, w: 30, d: 30, h: 22 }, { x: -90, z: -80, w: 30, d: 40, h: 15 },
      { x: 70, z: -80, w: 40, d: 30, h: 28 }
    ];
    for (const b of bLayouts) {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, b.h / 2, b.z);
      
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const color = ['#e2e8f0', '#cbd5e1', '#f1f5f9', '#94a3b8'][Math.floor(Math.random() * 4)]!;
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bGroup.add(mesh);
      
      // Roof accent
      const roofGeo = new THREE.BoxGeometry(b.w - 1, 0.5, b.d - 1);
      const roofMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9 });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.y = b.h/2 + 0.25;
      bGroup.add(roof);

      // Windows
      const winGeo = new THREE.PlaneGeometry(1, 1.5);
      const winMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', emissive: '#1e3a8a', emissiveIntensity: 0.5 });
      
      for(let wx = -b.w/2 + 2; wx < b.w/2 - 1; wx += 3) {
          for(let wy = -b.h/2 + 3; wy < b.h/2 - 2; wy += 3) {
              if(Math.random() > 0.8) continue;
              const winFront = new THREE.Mesh(winGeo, winMat);
              winFront.position.set(wx, wy, b.d/2 + 0.01);
              bGroup.add(winFront);
              
              const winBack = new THREE.Mesh(winGeo, winMat);
              winBack.position.set(wx, wy, -b.d/2 - 0.01);
              winBack.rotation.y = Math.PI;
              bGroup.add(winBack);
          }
      }
      for(let wz = -b.d/2 + 2; wz < b.d/2 - 1; wz += 3) {
          for(let wy = -b.h/2 + 3; wy < b.h/2 - 2; wy += 3) {
              if(Math.random() > 0.8) continue;
              const winRight = new THREE.Mesh(winGeo, winMat);
              winRight.position.set(b.w/2 + 0.01, wy, wz);
              winRight.rotation.y = Math.PI/2;
              bGroup.add(winRight);
              
              const winLeft = new THREE.Mesh(winGeo, winMat);
              winLeft.position.set(-b.w/2 - 0.01, wy, wz);
              winLeft.rotation.y = -Math.PI/2;
              bGroup.add(winLeft);
          }
      }

      this.environmentGroup.add(bGroup);
    }

    // 3. Birds
    const birdGeo = new THREE.ConeGeometry(0.2, 0.8, 3);
    birdGeo.rotateX(Math.PI / 2);
    const birdMat = new THREE.MeshBasicMaterial({ color: '#fff' });
    for (let i = 0; i < 15; i++) {
      const bird = new THREE.Mesh(birdGeo, birdMat);
      bird.position.set(Math.random()*200-100, 20 + Math.random()*10, Math.random()*200-100);
      const vx = 1.5 + Math.random() * 2;
      const vz = -0.5 - Math.random() * 1.5;
      bird.lookAt(bird.position.x + vx, bird.position.y, bird.position.z + vz);
      this.environmentGroup.add(bird);
      this.birds.push({ mesh: bird, vx, vz, baseY: bird.position.y, offset: Math.random() * Math.PI * 2 });
    }

    // 4. Pedestrians — Articulated human model (Drillis & Contini proportions)
    const cws = [
      { lightLanes: ['n-in'], horizontal: true, x1: -5.5, x2: 5.5, z1: -7.5, z2: -5.5 },
      { lightLanes: ['s-in'], horizontal: true, x1: -5.5, x2: 5.5, z1: 5.5, z2: 7.5 },
      { lightLanes: ['e-in-0', 'e-in-1'], horizontal: false, x1: 5.5, x2: 7.5, z1: -5.5, z2: 5.5 },
      { lightLanes: ['w-in-0', 'w-in-1'], horizontal: false, x1: -7.5, x2: -5.5, z1: -5.5, z2: 5.5 },
    ];

    // Shared geometries for all pedestrians
    const pedHeadGeo = new THREE.SphereGeometry(0.10, 12, 10);
    const pedNeckGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.06);
    const pedTorsoGeo = new THREE.BoxGeometry(0.30, 0.42, 0.16);
    const pedHipsGeo = new THREE.BoxGeometry(0.24, 0.12, 0.14);
    const pedUpperArmGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.26);
    pedUpperArmGeo.translate(0, -0.13, 0); // pivot at shoulder
    const pedForearmGeo = new THREE.CylinderGeometry(0.03, 0.025, 0.22);
    pedForearmGeo.translate(0, -0.11, 0); // pivot at elbow
    const pedHandGeo = new THREE.SphereGeometry(0.025, 6, 6);
    const pedUpperLegGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.38);
    pedUpperLegGeo.translate(0, -0.19, 0); // pivot at hip
    const pedLowerLegGeo = new THREE.CylinderGeometry(0.045, 0.035, 0.36);
    pedLowerLegGeo.translate(0, -0.18, 0); // pivot at knee
    const pedShoeGeo = new THREE.BoxGeometry(0.07, 0.035, 0.11);

    for (const cw of cws) {
      for (let i = 0; i < 8; i++) {
        const color = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#e2e8f0', '#c084fc'][Math.floor(Math.random() * 6)]!;
        const skinColor = ['#fca5a5', '#fdba74', '#d4a373', '#8b5a2b', '#3e2723'][Math.floor(Math.random() * 5)]!;
        const pantsColor = ['#1e293b', '#292524', '#1c1917', '#334155', '#3f3f46'][Math.floor(Math.random() * 5)]!;
        const shoeColor = ['#1a1a1a', '#292524', '#78350f'][Math.floor(Math.random() * 3)]!;
        
        const shirtMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.9 });
        const shoeMat = new THREE.MeshStandardMaterial({ color: shoeColor, roughness: 0.9 });

        // Height variation: 0.92 - 1.08 scale
        const heightScale = 0.92 + Math.random() * 0.16;
        
        const group = new THREE.Group();
        group.scale.setScalar(heightScale);

        // Head
        const head = new THREE.Mesh(pedHeadGeo, skinMat);
        head.position.y = 1.56;
        head.castShadow = true;
        group.add(head);

        // Neck
        const neck = new THREE.Mesh(pedNeckGeo, skinMat);
        neck.position.y = 1.43;
        group.add(neck);
        
        // Torso
        const torso = new THREE.Mesh(pedTorsoGeo, shirtMat);
        torso.position.y = 1.16;
        torso.castShadow = true;
        group.add(torso);

        // Hips
        const hips = new THREE.Mesh(pedHipsGeo, pantsMat);
        hips.position.y = 0.89;
        group.add(hips);

        // --- Left Arm (hierarchical: shoulder → upper arm → forearm → hand) ---
        const armLGroup = new THREE.Group(); // pivot at shoulder
        armLGroup.position.set(0.17, 1.35, 0);
        const upperArmL = new THREE.Mesh(pedUpperArmGeo, shirtMat);
        armLGroup.add(upperArmL);
        const forearmLGroup = new THREE.Group(); // pivot at elbow
        forearmLGroup.position.set(0, -0.26, 0);
        const forearmL = new THREE.Mesh(pedForearmGeo, skinMat);
        forearmLGroup.add(forearmL);
        const handL = new THREE.Mesh(pedHandGeo, skinMat);
        handL.position.set(0, -0.22, 0);
        forearmLGroup.add(handL);
        armLGroup.add(forearmLGroup);
        group.add(armLGroup);

        // --- Right Arm ---
        const armRGroup = new THREE.Group();
        armRGroup.position.set(-0.17, 1.35, 0);
        const upperArmR = new THREE.Mesh(pedUpperArmGeo, shirtMat);
        armRGroup.add(upperArmR);
        const forearmRGroup = new THREE.Group();
        forearmRGroup.position.set(0, -0.26, 0);
        const forearmR = new THREE.Mesh(pedForearmGeo, skinMat);
        forearmRGroup.add(forearmR);
        const handR = new THREE.Mesh(pedHandGeo, skinMat);
        handR.position.set(0, -0.22, 0);
        forearmRGroup.add(handR);
        armRGroup.add(forearmRGroup);
        group.add(armRGroup);

        // --- Left Leg (hierarchical: hip → upper leg → lower leg → foot) ---
        const legLGroup = new THREE.Group(); // pivot at hip joint
        legLGroup.position.set(0.07, 0.83, 0);
        const upperLegL = new THREE.Mesh(pedUpperLegGeo, pantsMat);
        upperLegL.castShadow = true;
        legLGroup.add(upperLegL);
        const lowerLegLGroup = new THREE.Group(); // pivot at knee
        lowerLegLGroup.position.set(0, -0.38, 0);
        const lowerLegL = new THREE.Mesh(pedLowerLegGeo, pantsMat);
        lowerLegLGroup.add(lowerLegL);
        const footL = new THREE.Mesh(pedShoeGeo, shoeMat);
        footL.position.set(0, -0.36, 0.03);
        lowerLegLGroup.add(footL);
        legLGroup.add(lowerLegLGroup);
        group.add(legLGroup);

        // --- Right Leg ---
        const legRGroup = new THREE.Group();
        legRGroup.position.set(-0.07, 0.83, 0);
        const upperLegR = new THREE.Mesh(pedUpperLegGeo, pantsMat);
        upperLegR.castShadow = true;
        legRGroup.add(upperLegR);
        const lowerLegRGroup = new THREE.Group();
        lowerLegRGroup.position.set(0, -0.38, 0);
        const lowerLegR = new THREE.Mesh(pedLowerLegGeo, pantsMat);
        lowerLegRGroup.add(lowerLegR);
        const footR = new THREE.Mesh(pedShoeGeo, shoeMat);
        footR.position.set(0, -0.36, 0.03);
        lowerLegRGroup.add(footR);
        legRGroup.add(lowerLegRGroup);
        group.add(legRGroup);

        group.castShadow = true;
        this.environmentGroup.add(group);
        
        this.peds.push({
          mesh: group, cw, head, torso,
          armL: armLGroup, armR: armRGroup,
          forearmL: forearmLGroup, forearmR: forearmRGroup,
          legL: legLGroup, legR: legRGroup,
          lowerLegL: lowerLegLGroup, lowerLegR: lowerLegRGroup,
          x: cw.horizontal ? cw.x1 + Math.random()*(cw.x2-cw.x1) : cw.x1 + Math.random()*(cw.x2-cw.x1),
          z: cw.horizontal ? cw.z1 + Math.random()*(cw.z2-cw.z1) : cw.z1 + Math.random()*(cw.z2-cw.z1),
          dir: Math.random() > 0.5 ? 1 : -1,
          speed: 0.8 + Math.random() * 0.6,
          cycle: Math.random() * Math.PI * 2
        });
      }
    }

    // 5. Traffic Police Officer on Duty
    this.trafficOfficer = this.createTrafficOfficer();
    this.environmentGroup.add(this.trafficOfficer);
  }

  private createTrafficOfficer(): THREE.Group {
    const officer = new THREE.Group();
    officer.name = 'traffic-officer';
    officer.position.set(6.5, 0, 6.5); // At intersection curb

    // Dark trousers
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.75);
    legGeo.translate(0, -0.375, 0);
    const legMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.8 });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(0.11, 0.75, 0);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(-0.11, 0.75, 0);
    officer.add(legL, legR);

    // Torso with neon safety vest
    const torsoGeo = new THREE.BoxGeometry(0.42, 0.65, 0.25);
    const vestMat = new THREE.MeshStandardMaterial({ color: '#84cc16', emissive: '#4d7c0f', emissiveIntensity: 0.4 });
    const torso = new THREE.Mesh(torsoGeo, vestMat);
    torso.position.y = 1.05;
    officer.add(torso);

    // Reflective stripes
    const stripeGeo = new THREE.BoxGeometry(0.44, 0.08, 0.27);
    const stripeMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', emissive: '#ffffff', emissiveIntensity: 0.8 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 1.1;
    officer.add(stripe);

    // Head
    const headGeo = new THREE.SphereGeometry(0.14);
    const skinMat = new THREE.MeshStandardMaterial({ color: '#8b5a2b', roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.5;
    officer.add(head);

    // White Traffic Cap
    const capGeo = new THREE.CylinderGeometry(0.17, 0.15, 0.08, 16);
    const capMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 1.62;
    officer.add(cap);

    // Arm holding ticket notepad / baton
    const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.45);
    armGeo.translate(0, -0.22, 0);
    const armMat = new THREE.MeshStandardMaterial({ color: '#84cc16' });
    const armR = new THREE.Mesh(armGeo, armMat);
    armR.position.set(0.26, 1.35, 0);
    armR.rotation.x = -Math.PI / 2.3;
    officer.add(armR);

    const padGeo = new THREE.BoxGeometry(0.15, 0.22, 0.03);
    const padMat = new THREE.MeshStandardMaterial({ color: '#fef08a' });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0.26, 1.35, 0.4);
    officer.add(pad);

    return officer;
  }

  private buildScenarioLandmarks(landmarkType: string) {
    const group = new THREE.Group();
    group.name = 'scenario-landmarks';

    if (landmarkType === 'university') {
      const baseGeo = new THREE.CylinderGeometry(5, 6, 0.8, 24);
      const baseMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.6 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(-25, 0.4, -25);
      base.receiveShadow = true;
      group.add(base);

      const globeGeo = new THREE.SphereGeometry(2.2, 24, 24);
      const globeMat = new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.8, roughness: 0.2 });
      const globe = new THREE.Mesh(globeGeo, globeMat);
      globe.position.set(-25, 3.8, -25);
      globe.castShadow = true;
      group.add(globe);

      const ringGeo = new THREE.TorusGeometry(3.3, 0.15, 16, 40);
      const ringMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.9, roughness: 0.1 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(-25, 3.8, -25);
      ring.rotation.x = Math.PI / 3;
      ring.rotation.y = Math.PI / 4;
      group.add(ring);
    } else if (landmarkType === 'toll_plaza') {
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(0, 0, -45);

      const trussMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.7, roughness: 0.4 });
      const beamGeo = new THREE.BoxGeometry(24, 1, 1.2);
      const beam = new THREE.Mesh(beamGeo, trussMat);
      beam.position.y = 6;
      gantryGroup.add(beam);

      for (const px of [-11.5, 11.5]) {
        const pGeo = new THREE.BoxGeometry(0.8, 6, 0.8);
        const pMesh = new THREE.Mesh(pGeo, trussMat);
        pMesh.position.set(px, 3, 0);
        gantryGroup.add(pMesh);
      }

      const boothGeo = new THREE.BoxGeometry(1.4, 2.5, 3);
      const boothMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.5 });
      for (const bx of [-6, 0, 6]) {
        const booth = new THREE.Mesh(boothGeo, boothMat);
        booth.position.set(bx, 1.25, 0);
        gantryGroup.add(booth);

        const ledGeo = new THREE.BoxGeometry(0.8, 0.4, 0.2);
        const ledMat = new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 2 });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(bx, 5.2, 0.6);
        gantryGroup.add(led);
      }
      group.add(gantryGroup);
    } else if (landmarkType === 'monument_rotary') {
      const monumentGroup = new THREE.Group();
      monumentGroup.position.set(0, 0, 0);

      const pedGeo = new THREE.CylinderGeometry(4.5, 5.5, 1, 24);
      const stoneMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.9 });
      const ped = new THREE.Mesh(pedGeo, stoneMat);
      ped.position.y = 0.5;
      monumentGroup.add(ped);

      const obeliskGeo = new THREE.ConeGeometry(1.2, 13, 4);
      const obeliskMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3, metalness: 0.4 });
      const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
      obelisk.position.y = 7.5;
      monumentGroup.add(obelisk);

      group.add(monumentGroup);
    } else if (landmarkType === 'hospital_bay') {
      const hosp = new THREE.Group();
      hosp.position.set(38, 0, -35);

      const bldgGeo = new THREE.BoxGeometry(26, 11, 22);
      const bldgMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 });
      const bldg = new THREE.Mesh(bldgGeo, bldgMat);
      bldg.position.y = 5.5;
      hosp.add(bldg);

      const crossH = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 0.3), new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#dc2626', emissiveIntensity: 1.2 }));
      crossH.position.set(0, 7.5, 11.1);
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 0.3), new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#dc2626', emissiveIntensity: 1.2 }));
      crossV.position.set(0, 7.5, 11.1);
      hosp.add(crossH, crossV);

      const heliGeo = new THREE.CylinderGeometry(6, 6, 0.2, 32);
      const heliMat = new THREE.MeshStandardMaterial({ color: '#1e293b' });
      const heli = new THREE.Mesh(heliGeo, heliMat);
      heli.position.y = 11.1;
      hosp.add(heli);

      const ringGeo = new THREE.RingGeometry(4.5, 5, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: '#facc15' });
      const hRing = new THREE.Mesh(ringGeo, ringMat);
      hRing.position.y = 11.22;
      hosp.add(hRing);

      group.add(hosp);
    } else if (landmarkType === 'industrial_silos') {
      const indGroup = new THREE.Group();
      indGroup.position.set(-45, 0, 35);

      const siloGeo = new THREE.CylinderGeometry(3.5, 3.5, 14, 24);
      const siloDomeGeo = new THREE.SphereGeometry(3.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const siloMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.7, roughness: 0.3 });

      for (let i = 0; i < 3; i++) {
        const silo = new THREE.Group();
        silo.position.set(i * 8.5, 0, 0);

        const cylinder = new THREE.Mesh(siloGeo, siloMat);
        cylinder.position.y = 7;
        silo.add(cylinder);

        const dome = new THREE.Mesh(siloDomeGeo, siloMat);
        dome.position.y = 14;
        silo.add(dome);

        indGroup.add(silo);
      }
      group.add(indGroup);
    } else if (landmarkType === 'market_stalls') {
      const marketGroup = new THREE.Group();
      marketGroup.position.set(35, 0, 30);

      const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
      for (let mx = -14; mx <= 14; mx += 7) {
        for (let mz = -8; mz <= 8; mz += 8) {
          const stall = new THREE.Group();
          stall.position.set(mx, 0, mz);

          const tableGeo = new THREE.BoxGeometry(2.8, 0.8, 1.8);
          const tableMat = new THREE.MeshStandardMaterial({ color: '#78350f' });
          const table = new THREE.Mesh(tableGeo, tableMat);
          table.position.y = 0.4;
          stall.add(table);

          const canopyGeo = new THREE.ConeGeometry(2.4, 1.2, 4);
          canopyGeo.rotateY(Math.PI / 4);
          const cColor = colors[Math.floor(Math.random() * colors.length)]!;
          const canopyMat = new THREE.MeshStandardMaterial({ color: cColor, roughness: 0.6 });
          const canopy = new THREE.Mesh(canopyGeo, canopyMat);
          canopy.position.y = 2.4;
          stall.add(canopy);

          marketGroup.add(stall);
        }
      }
      group.add(marketGroup);
    } else if (landmarkType === 'transit_depot') {
      const depotGroup = new THREE.Group();
      depotGroup.position.set(-30, 0, -40);

      const railMat = new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.9, roughness: 0.2 });
      const tieMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.9 });
      for (let r = 0; r < 2; r++) {
        const offset = r * 3;
        for (let t = -30; t <= 30; t += 1.5) {
          const tie = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.4), tieMat);
          tie.position.set(t, 0.06, offset);
          depotGroup.add(tie);
        }
        const track1 = new THREE.Mesh(new THREE.BoxGeometry(62, 0.12, 0.08), railMat);
        track1.position.set(0, 0.16, offset - 0.7);
        const track2 = new THREE.Mesh(new THREE.BoxGeometry(62, 0.12, 0.08), railMat);
        track2.position.set(0, 0.16, offset + 0.7);
        depotGroup.add(track1, track2);
      }
      group.add(depotGroup);
    } else if (landmarkType === 'cyber_grid') {
      const cyberGroup = new THREE.Group();
      for (const pos of [[-35, -35], [35, -35], [-35, 35], [35, 35]]) {
        const towerGeo = new THREE.BoxGeometry(4, 28, 4);
        const towerMat = new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.2, metalness: 0.9 });
        const tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(pos[0]!, 14, pos[1]!);
        cyberGroup.add(tower);

        const trimGeo = new THREE.RingGeometry(2.5, 2.9, 4);
        trimGeo.rotateX(Math.PI / 2);
        const trimMat = new THREE.MeshStandardMaterial({ color: '#06b6d4', emissive: '#06b6d4', emissiveIntensity: 3 });
        for (let ty = 5; ty <= 25; ty += 7) {
          const trim = new THREE.Mesh(trimGeo, trimMat);
          trim.position.set(pos[0]!, ty, pos[1]!);
          cyberGroup.add(trim);
        }
      }
      group.add(cyberGroup);
    }

    this.environmentGroup.add(group);
  }

  private createVehicleMesh(v: VehicleState): THREE.Group {
    const group = new THREE.Group();
    
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    wheelGeo.rotateX(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.9 });
    
    const hlGeo = new THREE.BoxGeometry(0.1, 0.2, 0.3);
    const blMat = new THREE.MeshStandardMaterial({ color: '#500', emissive: '#500', emissiveIntensity: 0.5 });
    const hazardMat = new THREE.MeshStandardMaterial({ color: '#78350f', emissive: '#000000', emissiveIntensity: 0 });
    
    if (v.type === VehicleType.Bus) {
        const geo = new THREE.BoxGeometry(v.length, 2.5, v.width);
        const mat = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.4 });
        const body = new THREE.Mesh(geo, mat);
        body.position.y = 1.5;
        body.castShadow = true;
        group.add(body);
        
        const winGeo = new THREE.PlaneGeometry(1.2, 1);
        const winMat = new THREE.MeshStandardMaterial({ color: '#222', roughness: 0.1, metalness: 0.8 });
        for(let wx = -v.length/2 + 1; wx < v.length/2 - 1; wx += 1.5) {
            const wL = new THREE.Mesh(winGeo, winMat);
            wL.position.set(wx, 1.8, v.width/2 + 0.01);
            group.add(wL);
            const wR = new THREE.Mesh(winGeo, winMat);
            wR.position.set(wx, 1.8, -v.width/2 - 0.01);
            wR.rotation.y = Math.PI;
            group.add(wR);
        }
        
        for(const wx of [v.length/2 - 1, -v.length/2 + 1]) {
            for(const wz of [v.width/2, -v.width/2]) {
                const w = new THREE.Mesh(wheelGeo, wheelMat);
                w.position.set(wx, 0.3, wz);
                group.add(w);
            }
        }
    } else if (v.type === VehicleType.Truck) {
        const cabGeo = new THREE.BoxGeometry(v.length * 0.3, 2, v.width);
        const cabMat = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.4 });
        const cab = new THREE.Mesh(cabGeo, cabMat);
        cab.position.set(v.length * 0.35, 1.3, 0);
        cab.castShadow = true;
        group.add(cab);
        
        const cargoGeo = new THREE.BoxGeometry(v.length * 0.65, 2.5, v.width);
        const cargoMat = new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.8 });
        const cargo = new THREE.Mesh(cargoGeo, cargoMat);
        cargo.position.set(-v.length * 0.15, 1.55, 0);
        cargo.castShadow = true;
        group.add(cargo);
        
        for(const wx of [v.length/2 - 1, -v.length/2 + 1.5, -v.length/2 + 0.5]) {
            for(const wz of [v.width/2, -v.width/2]) {
                const w = new THREE.Mesh(wheelGeo, wheelMat);
                w.position.set(wx, 0.3, wz);
                group.add(w);
            }
        }
    } else if (v.type === VehicleType.Police) {
        // Police Interceptor Cruiser (Federal/Adama Police Navy & White)
        const geo = new THREE.BoxGeometry(v.length, 0.85, v.width);
        const bodyMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.3, metalness: 0.6 });
        const body = new THREE.Mesh(geo, bodyMat);
        body.position.y = 0.65;
        body.castShadow = true;
        group.add(body);

        // White Doors & Roof
        const doorGeo = new THREE.BoxGeometry(v.length * 0.5, 0.86, v.width + 0.02);
        const doorMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 });
        const doors = new THREE.Mesh(doorGeo, doorMat);
        doors.position.y = 0.65;
        group.add(doors);

        // Cabin
        const cabinGeo = new THREE.BoxGeometry(v.length * 0.48, 0.65, v.width - 0.1);
        const cabin = new THREE.Mesh(cabinGeo, doorMat);
        cabin.position.set(-v.length * 0.1, 1.35, 0);
        group.add(cabin);

        // Glass
        const glassGeo = new THREE.BoxGeometry(v.length * 0.5, 0.55, v.width - 0.08);
        const glassMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.1, metalness: 0.9 });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(-v.length * 0.1, 1.35, 0);
        group.add(glass);

        // High-Intensity Dual Siren Lightbar (Red + Blue)
        const sirenRedMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 2.5 });
        const sirenBlueMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', emissive: '#3b82f6', emissiveIntensity: 2.5 });
        const sirenGeo = new THREE.BoxGeometry(0.35, 0.2, v.width * 0.28);
        
        const sirenL = new THREE.Mesh(sirenGeo, sirenRedMat);
        sirenL.position.set(0, 1.75, 0.22);
        const sirenR = new THREE.Mesh(sirenGeo, sirenBlueMat);
        sirenR.position.set(0, 1.75, -0.22);
        group.add(sirenL, sirenR);

        group.userData.sirenRedMat = sirenRedMat;
        group.userData.sirenBlueMat = sirenBlueMat;

        // Front Push Bumper
        const bumperGeo = new THREE.BoxGeometry(0.12, 0.6, v.width * 0.85);
        const bumperMat = new THREE.MeshStandardMaterial({ color: '#111827' });
        const bumper = new THREE.Mesh(bumperGeo, bumperMat);
        bumper.position.set(v.length / 2 + 0.05, 0.6, 0);
        group.add(bumper);

        // Wheels
        for (const wx of [v.length / 2 - 0.8, -v.length / 2 + 0.8]) {
          for (const wz of [v.width / 2, -v.width / 2]) {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.position.set(wx, 0.3, wz);
            group.add(w);
          }
        }
    } else if (v.type === VehicleType.Motorcycle) {
        // Motorcycle
        const mWheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        mWheelGeo.rotateX(Math.PI / 2);
        const wFront = new THREE.Mesh(mWheelGeo, wheelMat);
        wFront.position.set(v.length * 0.4, 0.3, 0);
        const wRear = new THREE.Mesh(mWheelGeo, wheelMat);
        wRear.position.set(-v.length * 0.4, 0.3, 0);
        group.add(wFront, wRear);

        // Chassis & Fuel Tank
        const frameGeo = new THREE.BoxGeometry(v.length * 0.55, 0.4, 0.3);
        const frameMat = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.3 });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(0, 0.55, 0);
        group.add(frame);

        // Handlebars
        const barGeo = new THREE.BoxGeometry(0.1, 0.08, 0.65);
        const barMat = new THREE.MeshStandardMaterial({ color: '#334155' });
        const bars = new THREE.Mesh(barGeo, barMat);
        bars.position.set(v.length * 0.25, 0.85, 0);
        group.add(bars);

        // Rider Figure with Helmet
        const riderGeo = new THREE.BoxGeometry(0.35, 0.5, 0.3);
        const riderMat = new THREE.MeshStandardMaterial({ color: '#1e293b' });
        const rider = new THREE.Mesh(riderGeo, riderMat);
        rider.position.set(-0.05, 0.85, 0);
        group.add(rider);

        const helmGeo = new THREE.SphereGeometry(0.16);
        const helmMat = new THREE.MeshStandardMaterial({ color: '#f59e0b' });
        const helmet = new THREE.Mesh(helmGeo, helmMat);
        helmet.position.set(-0.05, 1.25, 0);
        group.add(helmet);
    } else if (v.type === VehicleType.Bajaj) {
        // 3-Wheeled Auto-Rickshaw (Bajaj)
        const bWheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.15, 14);
        bWheelGeo.rotateX(Math.PI / 2);
        
        // 1 Front wheel, 2 Rear wheels
        const wFront = new THREE.Mesh(bWheelGeo, wheelMat);
        wFront.position.set(v.length * 0.4, 0.24, 0);
        const wRearL = new THREE.Mesh(bWheelGeo, wheelMat);
        wRearL.position.set(-v.length * 0.35, 0.24, v.width / 2);
        const wRearR = new THREE.Mesh(bWheelGeo, wheelMat);
        wRearR.position.set(-v.length * 0.35, 0.24, -v.width / 2);
        group.add(wFront, wRearL, wRearR);

        // Lower body
        const bodyGeo = new THREE.BoxGeometry(v.length * 0.85, 0.6, v.width);
        const bodyMat = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.4 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(-0.05, 0.5, 0);
        group.add(body);

        // Curved Canvas Roof Canopy
        const roofGeo = new THREE.BoxGeometry(v.length * 0.8, 0.1, v.width * 0.95);
        const canopyMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });
        const roof = new THREE.Mesh(roofGeo, canopyMat);
        roof.position.set(-0.05, 1.55, 0);
        group.add(roof);

        // Canopy Poles
        const pGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.95);
        const pMat = new THREE.MeshStandardMaterial({ color: '#475569' });
        for (const px of [v.length * 0.3, -v.length * 0.4]) {
          for (const pz of [v.width * 0.4, -v.width * 0.4]) {
            const p = new THREE.Mesh(pGeo, pMat);
            p.position.set(px, 1.05, pz);
            group.add(p);
          }
        }

        // Windshield
        const wsGeo = new THREE.PlaneGeometry(v.width * 0.8, 0.65);
        const wsMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.1, metalness: 0.7 });
        const ws = new THREE.Mesh(wsGeo, wsMat);
        ws.position.set(v.length * 0.32, 1.05, 0);
        ws.rotation.y = Math.PI / 2;
        group.add(ws);
    } else if (v.type === VehicleType.MinibusTaxi) {
        // Ethiopian Blue & White Toyota HiAce Commuter Minibus
        const lowerGeo = new THREE.BoxGeometry(v.length, 0.9, v.width);
        const lowerMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 });
        const lowerBody = new THREE.Mesh(lowerGeo, lowerMat);
        lowerBody.position.y = 0.65;
        lowerBody.castShadow = true;
        group.add(lowerBody);

        // White Upper Body and Roof
        const upperGeo = new THREE.BoxGeometry(v.length * 0.95, 0.95, v.width - 0.05);
        const upperMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
        const upperBody = new THREE.Mesh(upperGeo, upperMat);
        upperBody.position.set(-v.length * 0.02, 1.5, 0);
        upperBody.castShadow = true;
        group.add(upperBody);

        // Windows along side
        const winGeo = new THREE.PlaneGeometry(0.9, 0.55);
        const winMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.1, metalness: 0.8 });
        for (let wx = -v.length / 2 + 0.8; wx < v.length / 2 - 0.8; wx += 1.1) {
          const wL = new THREE.Mesh(winGeo, winMat);
          wL.position.set(wx, 1.5, v.width / 2);
          group.add(wL);
          const wR = new THREE.Mesh(winGeo, winMat);
          wR.position.set(wx, 1.5, -v.width / 2);
          wR.rotation.y = Math.PI;
          group.add(wR);
        }

        // Roof Luggage Carrier Rack
        const rackGeo = new THREE.BoxGeometry(v.length * 0.6, 0.15, v.width * 0.8);
        const rackMat = new THREE.MeshStandardMaterial({ color: '#334155' });
        const rack = new THREE.Mesh(rackGeo, rackMat);
        rack.position.set(-v.length * 0.1, 2.05, 0);
        group.add(rack);

        // Wheels
        for (const wx of [v.length / 2 - 0.9, -v.length / 2 + 0.9]) {
          for (const wz of [v.width / 2, -v.width / 2]) {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.position.set(wx, 0.3, wz);
            group.add(w);
          }
        }
    } else if (v.type === VehicleType.Emergency) {
        const geo = new THREE.BoxGeometry(v.length, 1.4, v.width);
        const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 });
        const body = new THREE.Mesh(geo, mat);
        body.position.y = 0.9;
        body.castShadow = true;
        group.add(body);

        const stripeGeo = new THREE.BoxGeometry(v.length * 0.98, 0.35, v.width + 0.02);
        const stripeMat = new THREE.MeshStandardMaterial({ color: '#dc2626' });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 0.9;
        group.add(stripe);

        const sirenGeo = new THREE.BoxGeometry(0.8, 0.25, v.width * 0.6);
        const sirenMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 2.5 });
        const siren = new THREE.Mesh(sirenGeo, sirenMat);
        siren.position.set(0, 1.7, 0);
        group.add(siren);
        group.userData.sirenMat = sirenMat;

        for (const wx of [v.length / 2 - 0.8, -v.length / 2 + 0.8]) {
            for (const wz of [v.width / 2, -v.width / 2]) {
                const w = new THREE.Mesh(wheelGeo, wheelMat);
                w.position.set(wx, 0.3, wz);
                group.add(w);
            }
        }
    } else {
        // Standard Car
        const geo = new THREE.BoxGeometry(v.length, 0.8, v.width);
        const mat = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.3, metalness: 0.5 });
        const body = new THREE.Mesh(geo, mat);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);

        const cabinGeo = new THREE.BoxGeometry(v.length * 0.5, 0.6, v.width - 0.1);
        const cabinMat = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.3, metalness: 0.5 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(-v.length * 0.1, 1.3, 0);
        group.add(cabin);
        
        const glassGeo = new THREE.BoxGeometry(v.length * 0.52, 0.5, v.width - 0.08);
        const glassMat = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.1, metalness: 0.9 });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(-v.length * 0.1, 1.3, 0);
        group.add(glass);

        const grilleGeo = new THREE.BoxGeometry(0.1, 0.4, v.width * 0.6);
        const grilleMat = new THREE.MeshStandardMaterial({ color: '#222' });
        const grille = new THREE.Mesh(grilleGeo, grilleMat);
        grille.position.set(v.length/2 + 0.01, 0.6, 0);
        group.add(grille);

        for(const wx of [v.length/2 - 0.8, -v.length/2 + 0.8]) {
            for(const wz of [v.width/2, -v.width/2]) {
                const w = new THREE.Mesh(wheelGeo, wheelMat);
                w.position.set(wx, 0.3, wz);
                group.add(w);
            }
        }
    }

    // Headlights
    const hlMat = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff', emissiveIntensity: 1 });
    const hlL = new THREE.Mesh(hlGeo, hlMat);
    hlL.position.set(v.length/2, 0.6, -v.width/2 + 0.2);
    const hlR = new THREE.Mesh(hlGeo, hlMat);
    hlR.position.set(v.length/2, 0.6, v.width/2 - 0.2);
    group.add(hlL, hlR);

    // Brakelights
    const blL = new THREE.Mesh(hlGeo, blMat);
    blL.position.set(-v.length/2, 0.6, -v.width/2 + 0.2);
    const blR = new THREE.Mesh(hlGeo, blMat);
    blR.position.set(-v.length/2, 0.6, v.width/2 - 0.2);
    group.add(blL, blR);

    // Amber Hazard / Violation Flashers
    const hzGeo = new THREE.BoxGeometry(0.12, 0.15, 0.15);
    const hzFL = new THREE.Mesh(hzGeo, hazardMat);
    hzFL.position.set(v.length / 2, 0.75, -v.width / 2 + 0.1);
    const hzFR = new THREE.Mesh(hzGeo, hazardMat);
    hzFR.position.set(v.length / 2, 0.75, v.width / 2 - 0.1);
    const hzRL = new THREE.Mesh(hzGeo, hazardMat);
    hzRL.position.set(-v.length / 2, 0.75, -v.width / 2 + 0.1);
    const hzRR = new THREE.Mesh(hzGeo, hazardMat);
    hzRR.position.set(-v.length / 2, 0.75, v.width / 2 - 0.1);
    group.add(hzFL, hzFR, hzRL, hzRR);
    
    group.userData = { 
      ...group.userData, 
      brakelightMat: blMat, 
      hazardMat: hazardMat,
      vehicleId: v.id 
    };
    return group;
  }

  private onCanvasClick = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const meshes = Array.from(this.vehicleMeshes.values());
    const hits = this.raycaster.intersectObjects(meshes, true);
    if (hits.length > 0) {
      let target: THREE.Object3D | null = hits[0]!.object;
      while (target && !target.userData.vehicleId && target.parent) {
        target = target.parent;
      }
      const vId = target?.userData.vehicleId || null;
      this.setSelectedVehicle(vId);
      this.onVehicleSelectCallback?.(vId);
    } else {
      this.setSelectedVehicle(null);
      this.onVehicleSelectCallback?.(null);
    }
  };

  public setVehicleSelectCallback(cb: (id: string | null) => void) {
    this.onVehicleSelectCallback = cb;
  }

  public setSelectedVehicle(id: string | null) {
    this.selectedVehicleId = id;
  }

  public setActionCamTarget(id: string | null) {
    this.actionCamTargetId = id;
  }

  public getActionCamTarget(): string | null {
    return this.actionCamTargetId;
  }

  public rebuildWorld(engine: SimulationEngine) {
    while (this.worldGroup.children.length > 0) {
      const child = this.worldGroup.children[0]!;
      this.worldGroup.remove(child);
    }
    while (this.environmentGroup.children.length > 0) {
      const child = this.environmentGroup.children[0]!;
      this.environmentGroup.remove(child);
    }
    for (const [, mesh] of this.vehicleMeshes) {
      this.scene.remove(mesh);
    }
    this.vehicleMeshes.clear();
    this.lightMaterials.clear();
    this.peds = [];
    this.birds = [];

    const env = engine.currentScenario?.environment;
    if (env) {
      this.scene.background = new THREE.Color(env.skyColor || '#87CEEB');
      if (this.scene.fog) {
        this.scene.fog.color = new THREE.Color(env.fogColor || '#87CEEB');
        (this.scene.fog as THREE.FogExp2).density = env.fogDensity || 0.01;
      }
      if (this.sun) {
        this.sun.color = new THREE.Color(env.sunColor || '#ffffff');
        this.sun.intensity = env.sunIntensity || 1.5;
        const pos = env.sunPosition || [50, 100, -30];
        this.sun.position.set(pos[0], pos[1], pos[2]);
      }
    }

    this.generateStaticWorld(engine);
    this.generateEnvironment(engine);
    if (env?.landmarkType) {
      this.buildScenarioLandmarks(env.landmarkType);
    }
  }

  public render(engine: SimulationEngine): void {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Action Cam / Incident vehicle tracking
    if (this.actionCamTargetId && this.vehicleMeshes.has(this.actionCamTargetId)) {
      const targetMesh = this.vehicleMeshes.get(this.actionCamTargetId)!;
      this.controls.target.lerp(targetMesh.position, 0.08);
    } else if (engine.lastIncidentFocus && this.vehicleMeshes.has(engine.lastIncidentFocus.vehicleId)) {
      if (Date.now() - engine.lastIncidentFocus.time < 6000) {
        const targetMesh = this.vehicleMeshes.get(engine.lastIncidentFocus.vehicleId)!;
        this.controls.target.lerp(targetMesh.position, 0.05);
      }
    }

    this.controls.update();

    // 1. Sync Vehicles
    const currentIds = new Set<string>();
    const alpha = engine.getAlpha();

    for (const v of engine.network.getAllVehicles()) {
      currentIds.add(v.id);
      let mesh = this.vehicleMeshes.get(v.id);
      
      if (!mesh) {
        mesh = this.createVehicleMesh(v);
        this.scene.add(mesh);
        this.vehicleMeshes.set(v.id, mesh);
      }
      
      const pos = v.prevPosition + (v.position - v.prevPosition) * alpha;
      const wPos = engine.network.toWorld(v.laneId, pos);
      const ang = engine.network.toAngle(v.laneId, pos);
      
      if (wPos) {
        mesh.position.set(wPos.x, 0, wPos.y);
        
        // Smooth rotation: lerp towards target angle to prevent warping at intersections
        const targetRotY = -ang;
        let deltaRot = targetRotY - mesh.rotation.y;
        // Handle angle wrapping (-π to π)
        while (deltaRot > Math.PI) deltaRot -= Math.PI * 2;
        while (deltaRot < -Math.PI) deltaRot += Math.PI * 2;
        // Smooth interpolation (0.15 = natural turning speed)
        mesh.rotation.y += deltaRot * 0.15;
      }

      if (mesh.userData.brakelightMat) {
        const braking = v.acceleration < -0.5;
        mesh.userData.brakelightMat.color.set(braking ? '#f00' : '#500');
        mesh.userData.brakelightMat.emissive.set(braking ? '#f00' : '#500');
        mesh.userData.brakelightMat.emissiveIntensity = braking ? 2 : 0.5;
      }

      // Police alternating dual sirens
      if (mesh.userData.sirenRedMat && mesh.userData.sirenBlueMat) {
        const flashPhase = Math.sin(now * 0.02) > 0;
        mesh.userData.sirenRedMat.emissiveIntensity = flashPhase ? 3.5 : 0.2;
        mesh.userData.sirenBlueMat.emissiveIntensity = flashPhase ? 0.2 : 3.5;
      } else if (mesh.userData.sirenMat) {
        // Emergency ambulance siren
        const flash = Math.sin(now * 0.015) > 0;
        mesh.userData.sirenMat.color.set(flash ? '#ef4444' : '#3b82f6');
        mesh.userData.sirenMat.emissive.set(flash ? '#ef4444' : '#3b82f6');
      }

      // Amber hazard lights on pulled over or violating vehicles
      if (mesh.userData.hazardMat) {
        const isHazard = v.isPulledOver || !!v.violation || v.isCrashed || v.hasHazardLights;
        const hazardBlink = isHazard && (Math.sin(now * 0.012) > 0);
        mesh.userData.hazardMat.emissive.set(hazardBlink ? '#f59e0b' : '#000000');
        mesh.userData.hazardMat.emissiveIntensity = hazardBlink ? 2.5 : 0;
      }
    }
    
    for (const [id, mesh] of this.vehicleMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.vehicleMeshes.delete(id);
      }
    }

    // Traffic Police Officer tracking violators
    if (this.trafficOfficer) {
      const violator = Array.from(engine.network.getAllVehicles()).find(veh => veh.isPulledOver || veh.isViolator || !!veh.violation);
      if (violator) {
        const vMesh = this.vehicleMeshes.get(violator.id);
        if (vMesh) {
          this.trafficOfficer.lookAt(vMesh.position.x, 0, vMesh.position.z);
        }
      }
    }

    // Update Selection Beacon
    if (this.selectedVehicleId && this.vehicleMeshes.has(this.selectedVehicleId)) {
      const vMesh = this.vehicleMeshes.get(this.selectedVehicleId)!;
      this.selectionBeacon.visible = true;
      this.selectionBeacon.position.set(vMesh.position.x, 3.8 + Math.sin(now * 0.008) * 0.3, vMesh.position.z);
      this.selectionBeacon.rotation.y += dt * 3;
    } else {
      this.selectionBeacon.visible = false;
    }

    // 2. Traffic Lights
    const ix = engine.network.getIntersection('ix');
    if (ix) {
      for (const light of ix.lights) {
        const mats = this.lightMaterials.get(light.id);
        if (mats) {
          const isR = light.state === LightState.Red;
          const isY = light.state === LightState.Yellow;
          const isG = light.state === LightState.Green;
          
          mats.r.color.set(isR ? '#ff0000' : '#330000');
          mats.r.emissive.set(isR ? '#ff0000' : '#330000');
          mats.r.emissiveIntensity = isR ? 2 : 0;
          
          mats.y.color.set(isY ? '#ffff00' : '#333300');
          mats.y.emissive.set(isY ? '#ffff00' : '#333300');
          mats.y.emissiveIntensity = isY ? 2 : 0;
          
          mats.g.color.set(isG ? '#00ff00' : '#003300');
          mats.g.emissive.set(isG ? '#00ff00' : '#003300');
          mats.g.emissiveIntensity = isG ? 2 : 0;
        }
      }
    }

    // 3. Birds
    for (const b of this.birds) {
      b.mesh.position.x += b.vx * dt;
      b.mesh.position.z += b.vz * dt;
      b.mesh.position.y = b.baseY + Math.sin(now * 0.005 + b.offset);
      if (b.mesh.position.x > 150) b.mesh.position.x = -150;
      if (b.mesh.position.z < -150) b.mesh.position.z = 150;
    }

    // 4. Pedestrians
    for (const p of this.peds) {
      let canCross = false;
      if (ix) {
        let allRed = true;
        for (const laneName of p.cw.lightLanes) {
          for (const l of ix.lights) {
            if (l.controlledLaneIds.includes(laneName)) {
              if (l.state !== LightState.Red) { allRed = false; break; }
            }
          }
          if (!allRed) break;
        }
        canCross = allRed;
      }

      let isAtEdge = false;
      const active = engine.getSnapshot().isRunning;
      
      let moved = false;
      if (p.cw.horizontal) {
        if (p.dir === 1 && p.x <= p.cw.x1 + 1) isAtEdge = true;
        if (p.dir === -1 && p.x >= p.cw.x2 - 1) isAtEdge = true;
        if (!isAtEdge || canCross) {
            p.x += p.dir * p.speed * dt * (active ? 1 : 0);
            moved = active;
        }
        if (p.x > p.cw.x2 + 1.5) { p.dir = -1; p.speed = 0.6 + Math.random(); }
        if (p.x < p.cw.x1 - 1.5) { p.dir = 1; p.speed = 0.6 + Math.random(); }
        
        p.mesh.rotation.y = p.dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        if (p.dir === 1 && p.z <= p.cw.z1 + 1) isAtEdge = true;
        if (p.dir === -1 && p.z >= p.cw.z2 - 1) isAtEdge = true;
        if (!isAtEdge || canCross) {
            p.z += p.dir * p.speed * dt * (active ? 1 : 0);
            moved = active;
        }
        if (p.z > p.cw.z2 + 1.5) { p.dir = -1; p.speed = 0.6 + Math.random(); }
        if (p.z < p.cw.z1 - 1.5) { p.dir = 1; p.speed = 0.6 + Math.random(); }
        
        p.mesh.rotation.y = p.dir === 1 ? 0 : Math.PI;
      }

      p.mesh.position.set(p.x, 0, p.z);
      
      if (moved) {
          p.cycle += dt * p.speed * 8;
      } else {
          p.cycle *= 0.95;
      }

      if (Math.abs(p.cycle) > 0.05) {
        // Walking gait cycle (biomechanical joint kinematics)
        const hipSwing = Math.sin(p.cycle) * 0.44;
        const kneeFlexL = Math.max(0, Math.sin(p.cycle * 2) * 0.6);
        const kneeFlexR = Math.max(0, Math.sin(p.cycle * 2 + Math.PI) * 0.6);
        const armSwing = Math.sin(p.cycle + Math.PI) * 0.35;
        const forearmBendL = 0.25 + Math.max(0, Math.sin(p.cycle + Math.PI)) * 0.25;
        const forearmBendR = 0.25 + Math.max(0, Math.sin(p.cycle)) * 0.25;
        const bounce = Math.abs(Math.sin(p.cycle)) * 0.025;
        const torsoTwist = Math.sin(p.cycle) * 0.04;

        p.armL.rotation.x = -armSwing;
        p.forearmL.rotation.x = forearmBendL;
        p.armR.rotation.x = armSwing;
        p.forearmR.rotation.x = forearmBendR;
        
        p.legL.rotation.x = hipSwing;
        p.lowerLegL.rotation.x = kneeFlexL;
        p.legR.rotation.x = -hipSwing;
        p.lowerLegR.rotation.x = kneeFlexR;

        p.mesh.position.y = bounce;
        p.torso.rotation.y = torsoTwist;
      } else {
        // Idle animation with subtle breathing & weight shift
        const idleSway = Math.sin(now * 0.0008) * 0.015;
        const headLook = Math.sin(now * 0.0003 + p.speed) * 0.12;
        
        p.armL.rotation.x = 0;
        p.armR.rotation.x = 0;
        p.forearmL.rotation.x = 0.15;
        p.forearmR.rotation.x = 0.15;
        p.legL.rotation.x = 0;
        p.legR.rotation.x = 0;
        p.lowerLegL.rotation.x = 0;
        p.lowerLegR.rotation.x = 0;
        p.mesh.position.y = 0;
        p.torso.rotation.z = idleSway;
        if (p.head) p.head.rotation.y = headLook;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.canvas.removeEventListener('click', this.onCanvasClick);
    this.renderer.dispose();
  }
}
