export class SimulationClock {
  tick = 0;
  time = 0;
  
  constructor(public readonly tickDuration: number = 1.0) {}
  
  step(): void {
    this.tick++;
    this.time += this.tickDuration;
  }
  
  reset(): void {
    this.tick = 0;
    this.time = 0;
  }
}