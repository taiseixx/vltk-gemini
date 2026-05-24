/**
 * Cocos Creator Mimetic 2D Game Engine (Lightweight TypeScript Core)
 * Built to restructure game animations, rendering passes, and particle systems
 * for maximum performance and highly clean visual design.
 */

export namespace cc {
  export type Callback = () => void;

  export class Action {
    protected elapsed: number = 0;
    protected duration: number = 0;
    public finished: boolean = false;

    constructor(duration: number = 0) {
      this.duration = duration;
    }

    public start(target: Node) {
      this.elapsed = 0;
      this.finished = false;
    }

    public update(target: Node, dt: number) {
      this.elapsed += dt;
      if (this.elapsed >= this.duration) {
        this.elapsed = this.duration;
        this.finished = true;
      }
      this.step(target, this.duration > 0 ? this.elapsed / this.duration : 1);
    }

    protected step(target: Node, ratio: number) {}
  }

  export class MoveTo extends Action {
    private startX: number = 0;
    private startY: number = 0;
    private endX: number = 0;
    private endY: number = 0;

    constructor(duration: number, x: number, y: number) {
      super(duration);
      this.endX = x;
      this.endY = y;
    }

    public override start(target: Node) {
      super.start(target);
      this.startX = target.x;
      this.startY = target.y;
    }

    protected override step(target: Node, ratio: number) {
      target.x = this.startX + (this.endX - this.startX) * ratio;
      target.y = this.startY + (this.endY - this.startY) * ratio;
    }
  }

  export class FadeTo extends Action {
    private startOpacity: number = 1;
    private endOpacity: number = 0;

    constructor(duration: number, opacity: number) {
      super(duration);
      this.endOpacity = opacity;
    }

    public override start(target: Node) {
      super.start(target);
      this.startOpacity = target.opacity;
    }

    protected override step(target: Node, ratio: number) {
      target.opacity = this.startOpacity + (this.endOpacity - this.startOpacity) * ratio;
    }
  }

  export class ScaleTo extends Action {
    private startX: number = 1;
    private startY: number = 1;
    private endX: number = 1;
    private endY: number = 1;

    constructor(duration: number, scaleX: number, scaleY: number) {
      super(duration);
      this.endX = scaleX;
      this.endY = scaleY;
    }

    public override start(target: Node) {
      super.start(target);
      this.startX = target.scaleX;
      this.startY = target.scaleY;
    }

    protected override step(target: Node, ratio: number) {
      target.scaleX = this.startX + (this.endX - this.startX) * ratio;
      target.scaleY = this.startY + (this.endY - this.startY) * ratio;
    }
  }

  export class CallFunc extends Action {
    private cb: Callback;

    constructor(callback: Callback) {
      super(0);
      this.cb = callback;
    }

    public override update(target: Node, dt: number) {
      this.cb();
      this.finished = true;
    }
  }

  export class Sequence extends Action {
    private actions: Action[];
    private currentIndex: number = 0;

    constructor(...actions: Action[]) {
      super(actions.reduce((acc, act) => acc + (act as any).duration, 0));
      this.actions = actions;
    }

    public override start(target: Node) {
      super.start(target);
      this.currentIndex = 0;
      if (this.actions.length > 0) {
        this.actions[0].start(target);
      } else {
        this.finished = true;
      }
    }

    public override update(target: Node, dt: number) {
      if (this.finished) return;

      const action = this.actions[this.currentIndex];
      if (action) {
        action.update(target, dt);
        if (action.finished) {
          this.currentIndex++;
          if (this.currentIndex < this.actions.length) {
            this.actions[this.currentIndex].start(target);
          } else {
            this.finished = true;
          }
        }
      } else {
        this.finished = true;
      }
    }
  }

  export class Node {
    public x: number = 0;
    public y: number = 0;
    public scaleX: number = 1;
    public scaleY: number = 1;
    public rotation: number = 0; // In radians
    public opacity: number = 1;
    public anchorX: number = 0.5;
    public anchorY: number = 0.5;
    public width: number = 0;
    public height: number = 0;
    public color: string = "#ffffff";
    public active: boolean = true;

    public children: Node[] = [];
    public parent: Node | null = null;
    private runningActions: Action[] = [];

    public addChild(child: Node) {
      child.parent = this;
      this.children.push(child);
    }

    public removeChild(child: Node) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        child.parent = null;
        this.children.splice(idx, 1);
      }
    }

    public runAction(action: Action) {
      action.start(this);
      this.runningActions.push(action);
    }

    public stopAllActions() {
      this.runningActions = [];
    }

    public update(dt: number) {
      if (!this.active) return;

      // Update actions
      for (let i = this.runningActions.length - 1; i >= 0; i--) {
        const action = this.runningActions[i];
        action.update(this, dt);
        if (action.finished) {
          this.runningActions.splice(i, 1);
        }
      }

      // Update children
      this.children.forEach(c => c.update(dt));
    }

    public render(ctx: CanvasRenderingContext2D) {
      if (!this.active || this.opacity <= 0) return;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(this.scaleX, this.scaleY);
      ctx.globalAlpha *= this.opacity;

      this.draw(ctx);

      // Render children
      this.children.forEach(c => c.render(ctx));

      ctx.restore();
    }

    protected draw(ctx: CanvasRenderingContext2D) {}
  }

  export class Sprite extends Node {
    private image: CanvasImageSource | null = null;

    constructor(image: CanvasImageSource | null = null, w: number = 0, h: number = 0) {
      super();
      this.image = image;
      this.width = w;
      this.height = h;
    }

    public setImage(image: CanvasImageSource) {
      this.image = image;
    }

    protected override draw(ctx: CanvasRenderingContext2D) {
      if (!this.image) return;
      const ox = -this.width * this.anchorX;
      const oy = -this.height * this.anchorY;
      ctx.drawImage(this.image, ox, oy, this.width, this.height);
    }
  }

  export class Label extends Node {
    public string: string = "";
    public fontSize: number = 14;
    public fontFamily: string = "Arial";
    public strokeColor: string = "#000000";
    public strokeWidth: number = 0;

    constructor(text: string, size: number = 14, color: string = "#ffffff") {
      super();
      this.string = text;
      this.fontSize = size;
      this.color = color;
    }

    protected override draw(ctx: CanvasRenderingContext2D) {
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.fillStyle = this.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (this.strokeWidth > 0) {
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.strokeWidth;
        ctx.strokeText(this.string, 0, 0);
      }
      ctx.fillText(this.string, 0, 0);
    }
  }

  // Optimized Particle Spawner Core
  export class ParticleSystem extends Node {
    public particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
      opacity: number;
    }> = [];

    public spawn(x: number, y: number, color: string, size: number = 3, count: number = 6) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 20 + Math.random() * 80;
        const maxLife = 0.3 + Math.random() * 0.45;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: maxLife,
          maxLife,
          color,
          size,
          opacity: 1,
        });
      }
    }

    public override update(dt: number) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        // Friction and air resistance
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.opacity = p.life / p.maxLife;
      }
    }

    public override render(ctx: CanvasRenderingContext2D) {
      ctx.save();
      this.particles.forEach(p => {
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  }

  export class Director {
    private static instance: Director;
    public scenes: Map<string, Node> = new Map();
    public currentScene: Node | null = null;
    public gameSpeed: number = 1.0;
    public screenShake: number = 0;
    public cameraZoom: number = 1.0;

    private constructor() {}

    public static getInstance(): Director {
      if (!Director.instance) {
        Director.instance = new Director();
      }
      return Director.instance;
    }

    public registerScene(name: string, scene: Node) {
      this.scenes.set(name, scene);
    }

    public loadScene(name: string) {
      const target = this.scenes.get(name);
      if (target) {
        this.currentScene = target;
      }
    }

    public update(dt: number) {
      const finalDt = dt * this.gameSpeed;
      if (this.currentScene) {
        this.currentScene.update(finalDt);
      }
      if (this.screenShake > 0) {
        this.screenShake = Math.max(0, this.screenShake - dt * 15);
      }
    }

    public applyCameraTransform(ctx: CanvasRenderingContext2D, targetX: number, targetY: number, width: number, height: number) {
      ctx.save();
      // Center camera with optional screen shake
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (this.screenShake > 0) {
        shakeOffsetX = (Math.random() - 0.5) * this.screenShake;
        shakeOffsetY = (Math.random() - 0.5) * this.screenShake;
      }

      ctx.translate(width / 2 + shakeOffsetX, height / 2 + shakeOffsetY);
      ctx.scale(this.cameraZoom, this.cameraZoom);
      ctx.translate(-targetX, -targetY);
    }

    public restoreCameraTransform(ctx: CanvasRenderingContext2D) {
      ctx.restore();
    }
  }

  export const director = Director.getInstance();

  // Helper convenience initializers like in standard Cocos
  export function moveTo(duration: number, x: number, y: number): MoveTo {
    return new MoveTo(duration, x, y);
  }

  export function fadeTo(duration: number, opacity: number): FadeTo {
    return new FadeTo(duration, opacity);
  }

  export function scaleTo(duration: number, sx: number, sy: number): ScaleTo {
    return new ScaleTo(duration, sx, sy);
  }

  export function callFunc(callback: Callback): CallFunc {
    return new CallFunc(callback);
  }

  export function sequence(...actions: Action[]): Sequence {
    return new Sequence(...actions);
  }
}
