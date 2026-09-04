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
  private vehicleMeshes = new Map<string, THREE.Group>();
  private lightMaterials = new Map<string, {r: THREE.MeshStandardMaterial, y: THREE.MeshStandardMaterial, g: THREE.MeshStandardMaterial}>();
  
  private peds: any[] = [];
  private birds: any[] = [];
  
  private lastTime = performance.now();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private selectedVehicleId: string | null = null;
  private onVehicleSelectCallback?: (id: string | null) => void;
  private selectionBeacon: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement, engine: SimulationEngine) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#87CEEB');
    this.scene.fog = new THREE.FogExp2('#87CEEB', 0.012);

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

    this.setupLighting();
    this.generateStaticWorld(engine);
    this.generateEnvironment();

    this.canvas.addEventListener('click', this.onCanvasClick);
  }

  public resize(width: number, height: number, dpr: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(dpr);
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight('#ffffff', 0.7);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight('#ffffff', 1.5);
    sun.position.set(50, 100, -30);
    sun.castShadow = true;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 250;
    sun.shadow.bias = -0.0005;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    this.scene.add(sun);
  }

  private generateStaticWorld(engine: SimulationEngine) {
    // 1. Ground
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({ color: '#559c55', roughness: 1, metalness: 0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.worldGroup.add(ground);

    // Patches for subtle color variation
    const patchMat = new THREE.MeshStandardMaterial({ color: '#4d8f4d', roughness: 1, metalness: 0 });
    for(let i = 0; i < 30; i++) {
        const patchGeo = new THREE.PlaneGeometry(10 + Math.random()*20, 10 + Math.random()*20);
        const patch = new THREE.Mesh(patchGeo, patchMat);
        patch.position.set((Math.random()-0.5)*400, 0.005, (Math.random()-0.5)*400);
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
      // Zebra crossings — flush on road surface
      const zebraGeo = new THREE.PlaneGeometry(0.6, 4);
      const zebraMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, depthWrite: true });
      for (let i = 0; i < 4; i++) {
        const dist = ix.size / 2 + 1.5;
        for (let j = -2.5; j <= 2.5; j += 0.9) {
          const zMesh = new THREE.Mesh(zebraGeo, zebraMat);
          if (i === 0) zMesh.position.set(ix.position.x + dist, 0.026, ix.position.y + j);
          if (i === 1) zMesh.position.set(ix.position.x - dist, 0.026, ix.position.y + j);
          if (i === 2) { zMesh.position.set(ix.position.x + j, 0.026, ix.position.y + dist); zMesh.rotation.y = Math.PI / 2; }
          if (i === 3) { zMesh.position.set(ix.position.x + j, 0.026, ix.position.y - dist); zMesh.rotation.y = Math.PI / 2; }
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

  private generateEnvironment() {
    // 1. Trees
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 3);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#3e2723', roughness: 0.9 });
    const canopyGeo = new THREE.DodecahedronGeometry(2.5, 1);
    
    for (let i = 0; i < 200; i++) {
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

      const color = ['#4ade80', '#22c55e', '#16a34a'][Math.floor(Math.random() * 3)]!;
      const canopyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.y = 3 + Math.random();
      canopy.scale.setScalar(0.8 + Math.random() * 0.5);
      canopy.castShadow = true;
      canopy.receiveShadow = true;
      tree.add(canopy);
      
      this.scene.add(tree);
    }

    // Bushes
    const bushGeo = new THREE.SphereGeometry(0.8, 8, 8);
    for(let i=0; i<100; i++) {
        const color = ['#166534', '#14532d', '#15803d'][Math.floor(Math.random()*3)];
        const bushMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
        const bush = new THREE.Mesh(bushGeo, bushMat);
        const bx = (Math.random()-0.5)*200;
        const bz = (Math.random()-0.5)*200;
        if(Math.abs(bx) < 10 || Math.abs(bz) < 10) continue;
        bush.position.set(bx, 0.4, bz);
        bush.scale.set(1, 0.8 + Math.random()*0.5, 1);
        bush.castShadow = true;
        this.scene.add(bush);
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
        
        this.scene.add(lamp);
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
        this.scene.add(b);
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

      this.scene.add(bGroup);
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
      this.scene.add(bird);
      this.birds.push({ mesh: bird, vx, vz, baseY: bird.position.y, offset: Math.random() * Math.PI * 2 });
    }

    // 4. Pedestrians
    const cws = [
      { lightLanes: ['n-in'], horizontal: true, x1: -5.5, x2: 5.5, z1: -7.5, z2: -5.5 },
      { lightLanes: ['s-in'], horizontal: true, x1: -5.5, x2: 5.5, z1: 5.5, z2: 7.5 },
      { lightLanes: ['e-in-0', 'e-in-1'], horizontal: false, x1: 5.5, x2: 7.5, z1: -5.5, z2: 5.5 },
      { lightLanes: ['w-in-0', 'w-in-1'], horizontal: false, x1: -7.5, x2: -5.5, z1: -5.5, z2: 5.5 },
    ];
    
    const headGeo = new THREE.SphereGeometry(0.12);
    const torsoGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.45);
    const limbGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4);
    limbGeo.translate(0, -0.2, 0); // pivot at top

    for (const cw of cws) {
      for (let i = 0; i < 8; i++) {
        const color = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#e2e8f0', '#c084fc'][Math.floor(Math.random() * 6)]!;
        const skinColor = ['#fca5a5', '#fdba74', '#d4a373', '#8b5a2b', '#3e2723'][Math.floor(Math.random() * 5)]!;
        
        const shirtMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.9 });
        
        const group = new THREE.Group();
        
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 0.85;
        group.add(head);
        
        const torso = new THREE.Mesh(torsoGeo, shirtMat);
        torso.position.y = 0.5;
        group.add(torso);
        
        const armL = new THREE.Mesh(limbGeo, skinMat);
        armL.position.set(0.18, 0.65, 0);
        group.add(armL);
        
        const armR = new THREE.Mesh(limbGeo, skinMat);
        armR.position.set(-0.18, 0.65, 0);
        group.add(armR);
        
        const legL = new THREE.Mesh(limbGeo, pantsMat);
        legL.position.set(0.08, 0.35, 0);
        group.add(legL);
        
        const legR = new THREE.Mesh(limbGeo, pantsMat);
        legR.position.set(-0.08, 0.35, 0);
        group.add(legR);
        
        group.castShadow = true;
        this.scene.add(group);
        
        this.peds.push({
          mesh: group, cw,
          armL, armR, legL, legR,
          x: cw.horizontal ? cw.x1 + Math.random()*(cw.x2-cw.x1) : cw.x1 + Math.random()*(cw.x2-cw.x1),
          z: cw.horizontal ? cw.z1 + Math.random()*(cw.z2-cw.z1) : cw.z1 + Math.random()*(cw.z2-cw.z1),
          dir: Math.random() > 0.5 ? 1 : -1,
          speed: 0.8 + Math.random() * 0.6,
          cycle: Math.random() * Math.PI * 2
        });
      }
    }
  }

  private createVehicleMesh(v: VehicleState): THREE.Group {
    const group = new THREE.Group();
    
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
    wheelGeo.rotateX(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.9 });
    
    const hlGeo = new THREE.BoxGeometry(0.1, 0.2, 0.3);
    const blMat = new THREE.MeshStandardMaterial({ color: '#500', emissive: '#500', emissiveIntensity: 0.5 });
    
    if (v.type === VehicleType.Bus) {
        // Bus body
        const geo = new THREE.BoxGeometry(v.length, 2.5, v.width);
        const mat = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.4 });
        const body = new THREE.Mesh(geo, mat);
        body.position.y = 1.5;
        body.castShadow = true;
        group.add(body);
        
        // Windows
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
        
        // Wheels
        for(const wx of [v.length/2 - 1, -v.length/2 + 1]) {
            for(const wz of [v.width/2, -v.width/2]) {
                const w = new THREE.Mesh(wheelGeo, wheelMat);
                w.position.set(wx, 0.3, wz);
                group.add(w);
            }
        }
    } else if (v.type === VehicleType.Truck) {
        // Cab
        const cabGeo = new THREE.BoxGeometry(v.length * 0.3, 2, v.width);
        const cabMat = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.4 });
        const cab = new THREE.Mesh(cabGeo, cabMat);
        cab.position.set(v.length * 0.35, 1.3, 0);
        cab.castShadow = true;
        group.add(cab);
        
        // Cargo
        const cargoGeo = new THREE.BoxGeometry(v.length * 0.65, 2.5, v.width);
        const cargoMat = new THREE.MeshStandardMaterial({ color: '#fff', roughness: 0.8 });
        const cargo = new THREE.Mesh(cargoGeo, cargoMat);
        cargo.position.set(-v.length * 0.15, 1.55, 0);
        cargo.castShadow = true;
        group.add(cargo);
        
        // Wheels
        for(const wx of [v.length/2 - 1, -v.length/2 + 1.5, -v.length/2 + 0.5]) {
            for(const wz of [v.width/2, -v.width/2]) {
                const w = new THREE.Mesh(wheelGeo, wheelMat);
                w.position.set(wx, 0.3, wz);
                group.add(w);
            }
        }
    } else if (v.type === VehicleType.Emergency) {
        // Ambulance body
        const geo = new THREE.BoxGeometry(v.length, 1.4, v.width);
        const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 });
        const body = new THREE.Mesh(geo, mat);
        body.position.y = 0.9;
        body.castShadow = true;
        group.add(body);

        // Emergency Red Stripe
        const stripeGeo = new THREE.BoxGeometry(v.length * 0.98, 0.35, v.width + 0.02);
        const stripeMat = new THREE.MeshStandardMaterial({ color: '#dc2626' });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.y = 0.9;
        group.add(stripe);

        // Flashing Lightbar
        const sirenGeo = new THREE.BoxGeometry(0.8, 0.25, v.width * 0.6);
        const sirenMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 2.5 });
        const siren = new THREE.Mesh(sirenGeo, sirenMat);
        siren.position.set(0, 1.7, 0);
        group.add(siren);
        group.userData.sirenMat = sirenMat;

        // Wheels
        for (const wx of [v.length / 2 - 0.8, -v.length / 2 + 0.8]) {
            for (const wz of [v.width / 2, -v.width / 2]) {
                const w = new THREE.Mesh(wheelGeo, wheelMat);
                w.position.set(wx, 0.3, wz);
                group.add(w);
            }
        }
    } else {
        // Car body
        const geo = new THREE.BoxGeometry(v.length, 0.8, v.width);
        const mat = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.3, metalness: 0.5 });
        const body = new THREE.Mesh(geo, mat);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);

        // Cabin
        const cabinGeo = new THREE.BoxGeometry(v.length * 0.5, 0.6, v.width - 0.1);
        const cabinMat = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.3, metalness: 0.5 });
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(-v.length * 0.1, 1.3, 0);
        group.add(cabin);
        
        // Windshield
        const glassGeo = new THREE.BoxGeometry(v.length * 0.52, 0.5, v.width - 0.08);
        const glassMat = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.1, metalness: 0.9 });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(-v.length * 0.1, 1.3, 0);
        group.add(glass);

        // Grille
        const grilleGeo = new THREE.BoxGeometry(0.1, 0.4, v.width * 0.6);
        const grilleMat = new THREE.MeshStandardMaterial({ color: '#222' });
        const grille = new THREE.Mesh(grilleGeo, grilleMat);
        grille.position.set(v.length/2 + 0.01, 0.6, 0);
        group.add(grille);

        // Wheels
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
    
    group.userData = { ...group.userData, brakelightMat: blMat, vehicleId: v.id };
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

  public rebuildWorld(engine: SimulationEngine) {
    while (this.worldGroup.children.length > 0) {
      const child = this.worldGroup.children[0]!;
      this.worldGroup.remove(child);
    }
    for (const [, mesh] of this.vehicleMeshes) {
      this.scene.remove(mesh);
    }
    this.vehicleMeshes.clear();
    this.lightMaterials.clear();
    this.generateStaticWorld(engine);
  }

  public render(engine: SimulationEngine): void {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.controls.update();
    if ((this as any).trafficMan) (this as any).trafficMan.rotation.y += dt * 2;

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
        mesh.rotation.y = -ang;
      }

      if (mesh.userData.brakelightMat) {
        const braking = v.acceleration < -0.5;
        mesh.userData.brakelightMat.color.set(braking ? '#f00' : '#500');
        mesh.userData.brakelightMat.emissive.set(braking ? '#f00' : '#500');
        mesh.userData.brakelightMat.emissiveIntensity = braking ? 2 : 0.5;
      }

      if (mesh.userData.sirenMat) {
        const flash = Math.sin(now * 0.015) > 0;
        mesh.userData.sirenMat.color.set(flash ? '#ef4444' : '#3b82f6');
        mesh.userData.sirenMat.emissive.set(flash ? '#ef4444' : '#3b82f6');
      }
    }
    
    for (const [id, mesh] of this.vehicleMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.vehicleMeshes.delete(id);
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
          p.cycle = 0;
      }
      
      const swing = Math.sin(p.cycle) * 0.5;
      p.armL.rotation.x = swing;
      p.armR.rotation.x = -swing;
      p.legL.rotation.x = -swing;
      p.legR.rotation.x = swing;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.canvas.removeEventListener('click', this.onCanvasClick);
    this.renderer.dispose();
  }
}
