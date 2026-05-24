interface FrameMetrics {
  fps: number;
  frameTime: number;
  entityCount: number;
  particleCount: number;
  drawCallEstimate: number;
  geminiPending: boolean;
}

export class PerfLogger {
  private history: FrameMetrics[] = [];
  private frameCount = 0;
  private lastLogTime = 0;
  private LOG_INTERVAL_MS = 5000;

  record(metrics: FrameMetrics) {
    this.history.push(metrics);
    this.frameCount++;
    
    // Auto-flush every interval
    if (this.lastLogTime === 0) this.lastLogTime = performance.now();
    const now = performance.now();
    if (now - this.lastLogTime > this.LOG_INTERVAL_MS) {
      this.flush();
      this.lastLogTime = now;
    }
  }

  private flush() {
    if (this.history.length === 0) return;
    const avg = this.getAverages();
    console.group(`[VLTK Perf] ${new Date().toLocaleTimeString()}`);
    console.log(`FPS avg/min: ${avg.fps.toFixed(1)} / ${this.getMin('fps').toFixed(1)}`);
    console.log(`Frame time avg: ${avg.frameTime.toFixed(2)}ms`);
    console.log(`Entities avg: ${avg.entityCount.toFixed(0)}`);
    console.log(`Particles peak: ${this.getMax('particleCount')}`);
    console.log(`Draw calls est avg: ${avg.drawCallEstimate.toFixed(0)}`);
    if (avg.fps < 30) console.warn('⚠️ FPS thấp nguy hiểm — xem particleCount và drawCalls');
    console.groupEnd();
    this.history = [];
  }

  private getAverages() {
    const len = this.history.length;
    if (len === 0) return { fps: 0, frameTime: 0, entityCount: 0, particleCount: 0, drawCallEstimate: 0 };
    
    let sumFps = 0, sumFrameTime = 0, sumEntityCount = 0, sumParticleCount = 0, sumDrawCallEstimate = 0;
    for (const h of this.history) {
      sumFps += h.fps;
      sumFrameTime += h.frameTime;
      sumEntityCount += h.entityCount;
      sumParticleCount += h.particleCount;
      sumDrawCallEstimate += h.drawCallEstimate;
    }
    return {
      fps: sumFps / len,
      frameTime: sumFrameTime / len,
      entityCount: sumEntityCount / len,
      particleCount: sumParticleCount / len,
      drawCallEstimate: sumDrawCallEstimate / len,
    };
  }

  private getMin(key: keyof FrameMetrics) {
    if (this.history.length === 0) return 0;
    return Math.min(...this.history.map(h => Number(h[key])));
  }

  private getMax(key: keyof FrameMetrics) {
    if (this.history.length === 0) return 0;
    return Math.max(...this.history.map(h => Number(h[key])));
  }
}

export const perfLogger = new PerfLogger();
