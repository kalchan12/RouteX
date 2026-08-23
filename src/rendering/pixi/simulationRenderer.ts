import { Application, Container } from 'pixi.js';
import { SimulationSnapshot } from '../../types';
import { RoadRenderer } from './roadRenderer';
import { NodeRenderer } from './nodeRenderer';
import { VehicleRenderer } from './vehicleRenderer';
import { TrafficLightRenderer } from './trafficLightRenderer';
import { Viewport, RenderLayer } from './types';

export interface SimulationRendererOptions {
  backgroundColor: number;
  antialias: boolean;
  resolution: number;
  autoDensity: boolean;
  roadRendererOptions?: any;
  nodeRendererOptions?: any;
  vehicleRendererOptions?: any;
  trafficLightRendererOptions?: any;
}

const DEFAULT_OPTIONS: SimulationRendererOptions = {
  backgroundColor: 0x0f0f1a,
  antialias: true,
  resolution: 1,
  autoDensity: true,
};

export class SimulationRenderer {
  private app: Application | null = null;
  private container: HTMLDivElement | null = null;
  private options: SimulationRendererOptions;
  
  private worldContainer: Container | null = null;
  private layers: RenderLayer | null = null;
  
  private roadRenderer: RoadRenderer | null = null;
  private nodeRenderer: NodeRenderer | null = null;
  private vehicleRenderer: VehicleRenderer | null = null;
  private trafficLightRenderer: TrafficLightRenderer | null = null;

  private viewport: Viewport = {
    x: 0,
    y: 0,
    scale: 1,
    width: 0,
    height: 0,
  };

  private snapshot: SimulationSnapshot | null = null;
  private isInitialized = false;

  private dragStart = { x: 0, y: 0 };
  private isDragging = false;

  constructor(options: Partial<SimulationRendererOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async initialize(container: HTMLDivElement): Promise<void> {
    this.container = container;

    this.app = new Application();
    await this.app.init({
      background: this.options.backgroundColor,
      antialias: this.options.antialias,
      resolution: this.options.resolution,
      autoDensity: this.options.autoDensity,
      resizeTo: container,
    });

    container.appendChild(this.app.canvas);

    this.setupWorld();
    this.setupRenderers();
    this.setupInteraction();
    this.setupResize();

    this.isInitialized = true;
  }

  private setupWorld(): void {
    if (!this.app) return;

    this.worldContainer = new Container();
    this.worldContainer.sortableChildren = true;
    this.app.stage.addChild(this.worldContainer);

    this.layers = {
      roads: new Container(),
      nodes: new Container(),
      vehicles: new Container(),
      trafficLights: new Container(),
      routes: new Container(),
      incidents: new Container(),
    };

    this.layers.roads.zIndex = 0;
    this.layers.nodes.zIndex = 10;
    this.layers.trafficLights.zIndex = 15;
    this.layers.vehicles.zIndex = 20;
    this.layers.routes.zIndex = 25;
    this.layers.incidents.zIndex = 30;

    for (const layer of Object.values(this.layers)) {
      this.worldContainer!.addChild(layer);
    }

    this.viewport.width = this.app.screen.width;
    this.viewport.height = this.app.screen.height;
  }

  private setupRenderers(): void {
    if (!this.layers) return;

    this.roadRenderer = new RoadRenderer(this.layers.roads);
    this.nodeRenderer = new NodeRenderer(this.layers.nodes);
    this.vehicleRenderer = new VehicleRenderer(this.layers.vehicles);
    this.trafficLightRenderer = new TrafficLightRenderer(this.layers.trafficLights);
  }

  private setupInteraction(): void {
    if (!this.app) return;

    this.app.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      this.zoom(factor, e.clientX, e.clientY);
    }, { passive: false });

    this.app.canvas.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.dragStart.x = e.clientX;
      this.dragStart.y = e.clientY;
      this.app!.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging || !this.app) return;
      
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      
      this.pan(dx / this.viewport.scale, dy / this.viewport.scale);
      
      this.dragStart.x = e.clientX;
      this.dragStart.y = e.clientY;
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
      if (this.app) this.app.canvas.style.cursor = 'grab';
    });

    this.app.canvas.style.cursor = 'grab';
  }

  private setupResize(): void {
    if (!this.app) return;

    const resizeObserver = new ResizeObserver(() => {
      if (!this.app) return;
      
      this.viewport.width = this.app.screen.width;
      this.viewport.height = this.app.screen.height;
    });

    resizeObserver.observe(this.container!);
  }

  render(snapshot: SimulationSnapshot): void {
    if (!this.isInitialized || !this.app || !this.worldContainer || !this.layers) return;

    this.snapshot = snapshot;

    const net = snapshot.network;
    if (!net || !net.nodes || net.nodes.length === 0) {
      return;
    }

    this.roadRenderer?.renderRoads(net.nodes, net.edges);
    this.nodeRenderer?.renderNodes(net.nodes);
    this.vehicleRenderer?.setNetwork(net.nodes, net.edges);
    this.vehicleRenderer?.updateVehicles(snapshot.vehicles);
    
    if (this.trafficLightRenderer && this.snapshot) {
      const lights = new Map();
      for (const node of net.nodes) {
        if (node.trafficLightId) {
          lights.set(node.trafficLightId, {
            state: 'green' as const,
            stateTimer: 0,
            greenDuration: 15,
            redDuration: 15,
            offset: 0,
          });
        }
      }
      this.trafficLightRenderer.setNodes(net.nodes);
      this.trafficLightRenderer.renderTrafficLights(lights);
    }

    this.fitToScreen();
  }

  private fitToScreen(): void {
    if (!this.app || !this.worldContainer || !this.snapshot) return;

    const net = this.snapshot.network;
    if (!net || !net.nodes || net.nodes.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const n of net.nodes) {
      minX = Math.min(minX, n.x); minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x); maxY = Math.max(maxY, n.y);
    }

    const worldW = (maxX - minX) || 1;
    const worldH = (maxY - minY) || 1;
    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;

    const padding = 60;
    const scaleX = (screenW - padding * 2) / worldW;
    const scaleY = (screenH - padding * 2) / worldH;
    const scale = Math.min(scaleX, scaleY) * 0.95;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.viewport.scale = scale;
    this.viewport.x = centerX;
    this.viewport.y = centerY;

    this.worldContainer.scale.set(scale, scale);
    this.worldContainer.position.set(
      screenW / 2 - centerX * scale,
      screenH / 2 - centerY * scale
    );
  }

  zoom(factor: number, centerX?: number, centerY?: number): void {
    if (!this.app || !this.worldContainer) return;

    const oldScale = this.viewport.scale;
    const newScale = Math.max(0.1, Math.min(5, oldScale * factor));
    
    if (centerX !== undefined && centerY !== undefined) {
      const worldX = (centerX - this.worldContainer.position.x) / oldScale;
      const worldY = (centerY - this.worldContainer.position.y) / oldScale;
      
      this.worldContainer.scale.set(newScale, newScale);
      this.worldContainer.position.set(
        centerX - worldX * newScale,
        centerY - worldY * newScale
      );
    } else {
      this.worldContainer.scale.set(newScale, newScale);
    }

    this.viewport.scale = newScale;
  }

  pan(dx: number, dy: number): void {
    if (!this.worldContainer) return;
    
    this.worldContainer.position.set(
      this.worldContainer.position.x + dx,
      this.worldContainer.position.y + dy
    );
  }

  setViewport(viewport: Partial<Viewport>): void {
    this.viewport = { ...this.viewport, ...viewport };
    if (this.worldContainer && this.app) {
      this.worldContainer.scale.set(this.viewport.scale, this.viewport.scale);
      this.worldContainer.position.set(this.viewport.x, this.viewport.y);
    }
  }

  getViewport(): Viewport {
    return { ...this.viewport };
  }

  destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
    this.worldContainer = null;
    this.layers = null;
    this.roadRenderer = null;
    this.nodeRenderer = null;
    this.vehicleRenderer = null;
    this.trafficLightRenderer = null;
    this.isInitialized = false;
  }
}

export function createSimulationRenderer(options?: Partial<SimulationRendererOptions>): SimulationRenderer {
  return new SimulationRenderer(options);
}