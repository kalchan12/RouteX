export interface Vector2 {
  x: number;
  y: number;
}

export class Camera {
  public position: Vector2;   // world center
  public zoom: number;        // pixels per meter
  
  private minZoom = 0.5;
  private maxZoom = 20;
  private screenWidth = 0;
  private screenHeight = 0;
  
  // Smooth animation targets
  private targetPosition: Vector2 | null = null;
  private targetZoom: number | null = null;
  private animationSpeed = 0.08;
  
  constructor(initialPosition: Vector2 = { x: 0, y: 0 }, initialZoom: number = 1) {
    this.position = { ...initialPosition };
    this.zoom = initialZoom;
  }

  public setScreenSize(w: number, h: number): void {
    this.screenWidth = w;
    this.screenHeight = h;
  }

  public pan(dxScreen: number, dyScreen: number): void {
    const dxWorld = dxScreen / this.zoom;
    const dyWorld = dyScreen / this.zoom;
    
    this.position.x -= dxWorld;
    this.position.y -= dyWorld;
    
    if (this.targetPosition) {
      this.targetPosition.x -= dxWorld;
      this.targetPosition.y -= dyWorld;
    }
  }

  public zoomAt(screenPoint: Vector2, factor: number): void {
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
    if (newZoom === this.zoom) return;

    // The world coordinate under the pointer should remain the same
    const worldBefore = this.screenToWorld(screenPoint);
    
    this.zoom = newZoom;
    
    // Recalculate camera position so that screenPoint maps to worldBefore under new zoom
    this.position.x = worldBefore.x - (screenPoint.x - this.screenWidth / 2) / this.zoom;
    this.position.y = worldBefore.y - (screenPoint.y - this.screenHeight / 2) / this.zoom;

    if (this.targetZoom !== null) {
      this.targetZoom = newZoom;
      this.targetPosition = { ...this.position };
    }
  }

  public focusOn(worldX: number, worldY: number, targetZoom?: number): void {
    this.targetPosition = { x: worldX, y: worldY };
    if (targetZoom !== undefined) {
      this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, targetZoom));
    }
  }

  public update(): void {
    if (this.targetPosition) {
      const dx = this.targetPosition.x - this.position.x;
      const dy = this.targetPosition.y - this.position.y;
      
      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) {
        this.position.x = this.targetPosition.x;
        this.position.y = this.targetPosition.y;
        this.targetPosition = null;
      } else {
        this.position.x += dx * this.animationSpeed;
        this.position.y += dy * this.animationSpeed;
      }
    }

    if (this.targetZoom !== null) {
      const dz = this.targetZoom - this.zoom;
      
      if (Math.abs(dz) < 0.001) {
        this.zoom = this.targetZoom;
        this.targetZoom = null;
      } else {
        this.zoom += dz * this.animationSpeed;
      }
    }
  }

  public worldToScreen(world: Vector2): Vector2 {
    return {
      x: (world.x - this.position.x) * this.zoom + this.screenWidth / 2,
      y: (world.y - this.position.y) * this.zoom + this.screenHeight / 2,
    };
  }

  public screenToWorld(screen: Vector2): Vector2 {
    return {
      x: (screen.x - this.screenWidth / 2) / this.zoom + this.position.x,
      y: (screen.y - this.screenHeight / 2) / this.zoom + this.position.y,
    };
  }

  public getViewBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const tl = this.screenToWorld({ x: 0, y: 0 });
    const br = this.screenToWorld({ x: this.screenWidth, y: this.screenHeight });
    
    return {
      minX: Math.min(tl.x, br.x),
      minY: Math.min(tl.y, br.y),
      maxX: Math.max(tl.x, br.x),
      maxY: Math.max(tl.y, br.y),
    };
  }

  public isAnimating(): boolean {
    return this.targetPosition !== null || this.targetZoom !== null;
  }
}
