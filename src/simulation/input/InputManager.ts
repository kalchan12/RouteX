import { Camera, Vector2 } from '../camera/Camera';

const CLICK_DRAG_THRESHOLD = 5;

export class InputManager {
  public onEntityClick?: (worldPos: Vector2) => void;
  public onEntityHover?: (worldPos: Vector2) => void;

  private isDragging = false;
  private lastPointerPos: Vector2 | null = null;
  private dragDistance = 0;
  
  private activePointers: Map<number, { x: number; y: number }> = new Map();
  private initialPinchDistance: number = 0;
  private lastPinchDistance: number = 0;

  constructor(private camera: Camera, private canvas: HTMLCanvasElement) {
    this.canvas.style.touchAction = 'none';
    this.canvas.style.cursor = 'grab';
    this.attachListeners();
  }

  public destroy(): void {
    this.detachListeners();
  }

  private attachListeners(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerCancel);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvas.addEventListener('dblclick', this.onDoubleClick);
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
  }

  private detachListeners(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('dblclick', this.onDoubleClick);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
  }

  private getCanvasPos(e: PointerEvent | MouseEvent): Vector2 {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private getPinchDistance(): number {
    if (this.activePointers.size < 2) return 0;
    const pts = Array.from(this.activePointers.values());
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getPinchCenter(): Vector2 {
    const pts = Array.from(this.activePointers.values());
    return {
      x: (pts[0].x + pts[1].x) / 2,
      y: (pts[0].y + pts[1].y) / 2,
    };
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.canvas.setPointerCapture(e.pointerId);
    const pos = this.getCanvasPos(e);
    this.activePointers.set(e.pointerId, pos);

    if (this.activePointers.size === 1) {
      this.isDragging = true;
      this.lastPointerPos = pos;
      this.dragDistance = 0;
      this.canvas.style.cursor = 'grabbing';
    } else if (this.activePointers.size === 2) {
      this.isDragging = false;
      this.initialPinchDistance = this.getPinchDistance();
      this.lastPinchDistance = this.initialPinchDistance;
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    const pos = this.getCanvasPos(e);

    if (this.activePointers.has(e.pointerId)) {
      this.activePointers.set(e.pointerId, pos);
    }

    if (this.activePointers.size === 1 && this.isDragging && this.lastPointerPos) {
      const dx = pos.x - this.lastPointerPos.x;
      const dy = pos.y - this.lastPointerPos.y;
      this.dragDistance += Math.sqrt(dx * dx + dy * dy);
      
      this.camera.pan(dx, dy);
      this.lastPointerPos = pos;
    } else if (this.activePointers.size === 2) {
      const currentDist = this.getPinchDistance();
      if (this.lastPinchDistance > 0 && currentDist > 0) {
        const factor = currentDist / this.lastPinchDistance;
        const center = this.getPinchCenter();
        this.camera.zoomAt(center, factor);
      }
      this.lastPinchDistance = currentDist;
    }

    if (!this.isDragging && this.activePointers.size === 0 && this.onEntityHover) {
      const worldPos = this.camera.screenToWorld(pos);
      this.onEntityHover(worldPos);
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    this.canvas.releasePointerCapture(e.pointerId);
    this.activePointers.delete(e.pointerId);

    if (this.activePointers.size === 0) {
      this.canvas.style.cursor = 'grab';
      
      if (this.isDragging && this.dragDistance < CLICK_DRAG_THRESHOLD) {
        if (this.onEntityClick) {
          const pos = this.getCanvasPos(e);
          const worldPos = this.camera.screenToWorld(pos);
          this.onEntityClick(worldPos);
        }
      }
      
      this.isDragging = false;
      this.lastPointerPos = null;
    } else if (this.activePointers.size === 1) {
      // Revert to single finger drag
      this.isDragging = true;
      const remainingPointer = Array.from(this.activePointers.values())[0];
      this.lastPointerPos = remainingPointer;
    }
  };

  private onPointerCancel = (e: PointerEvent): void => {
    this.activePointers.delete(e.pointerId);
    if (this.activePointers.size === 0) {
      this.isDragging = false;
      this.lastPointerPos = null;
      this.canvas.style.cursor = 'grab';
    }
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const pos = this.getCanvasPos(e);
    
    // Zoom factor based on wheel delta
    const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    this.camera.zoomAt(pos, zoomFactor);
  };

  private onDoubleClick = (e: MouseEvent): void => {
    const pos = this.getCanvasPos(e);
    this.camera.zoomAt(pos, 1.5);
  };

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
  };
}
