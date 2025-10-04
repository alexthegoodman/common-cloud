import { vec2 } from "gl-matrix";
import { EasingType, UIKeyframe, KeyframeValue } from "./animations";
import { TextRenderer } from "./text";
import { rgbToWgpu } from "./editor";
import { Vertex } from "./vertex";
import { PolyfillQueue } from "./polyfill";

export enum TextAnimationType {
  Typewriter = "Typewriter",
  FadeIn = "FadeIn",
  SlideIn = "SlideIn",
  ScaleIn = "ScaleIn",
  Bounce = "Bounce",
  Wave = "Wave",
  Glow = "Glow",
  Shake = "Shake",
  PopIn = "PopIn",
  RollIn = "RollIn",
  BlurIn = "BlurIn",
  Elastic = "Elastic",
  Matrix = "Matrix",
  Glitch = "Glitch",
  Neon = "Neon",
  Fire = "Fire",
  Water = "Water",
  Electric = "Electric",
  Magnetic = "Magnetic",
  Rainbow = "Rainbow",
  Sparkle = "Sparkle",
}

export enum TextAnimationTiming {
  AllAtOnce = "AllAtOnce",
  WordByWord = "WordByWord",
  CharByChar = "CharByChar",
  LineByLine = "LineByLine",
  RandomOrder = "RandomOrder",
  FromCenter = "FromCenter",
  FromEdges = "FromEdges",
}

export interface TextAnimationConfig {
  id: string;
  type: TextAnimationType;
  timing: TextAnimationTiming;
  duration: number; // in milliseconds
  delay: number; // delay between characters/words
  intensity: number; // 0-1 for effect intensity
  easing: EasingType;
  startTime: number; // when animation starts
  loop: boolean;
  reverse: boolean;
  customParams?: Record<string, any>;
}

export interface AnimatedCharacter {
  index: number;
  char: string;
  position: vec2;
  originalPosition: vec2;
  scale: number;
  rotation: number;
  opacity: number;
  color: [number, number, number, number];
  originalColor: [number, number, number, number];
  vertices: Vertex[];
  animationProgress: number;
  animationDelay: number;
  isVisible: boolean;
  customData?: Record<string, any>;
}

export class TextAnimator {
  private animationConfig: TextAnimationConfig;
  private animatedCharacters: AnimatedCharacter[] = [];
  private currentTime: number = 0;
  private isPlaying: boolean = false;
  private animationStartTime: number = 0;

  constructor(textRenderer: TextRenderer, config: TextAnimationConfig) {
    this.animationConfig = config;
    this.initializeCharacters(textRenderer);
  }

  private initializeCharacters(textRenderer: TextRenderer): void {
    if (!textRenderer.vertices) return;

    this.animatedCharacters = [];
    const text = textRenderer.text;
    let charIndex = 0;
    let vertexIndex = 0;

    console.info("init text", text);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === " " || char === "\n") {
        charIndex++;
        continue; // Don't increment vertexIndex for spaces/newlines
      }

      const charVertices = textRenderer.vertices.slice(
        vertexIndex,
        vertexIndex + 4
      );
      if (charVertices.length === 4) {
        const position = vec2.fromValues(
          charVertices[0].position[0],
          charVertices[0].position[1]
        );

        const animatedChar: AnimatedCharacter = {
          index: vertexIndex / 4, // Use vertex-based index for updateTextRenderer
          char: char,
          position: vec2.clone(position),
          originalPosition: vec2.clone(position),
          scale: 1.0,
          rotation: 0.0,
          opacity: 1.0,
          color: [...charVertices[0].color] as [number, number, number, number],
          originalColor: [...charVertices[0].color] as [
            number,
            number,
            number,
            number
          ],
          vertices: charVertices,
          animationProgress: 0.0,
          animationDelay: this.calculateCharacterDelay(charIndex, text.length),
          isVisible: true,
          customData: {},
        };

        this.animatedCharacters.push(animatedChar);
        vertexIndex += 4; // Only increment for actual rendered characters
      }
      charIndex++;
    }
  }

  private calculateCharacterDelay(
    charIndex: number,
    totalChars: number
  ): number {
    const baseDelay = this.animationConfig.delay;

    switch (this.animationConfig.timing) {
      case TextAnimationTiming.AllAtOnce:
        return 0;
      case TextAnimationTiming.CharByChar:
        return charIndex * baseDelay;
      case TextAnimationTiming.RandomOrder:
        return Math.random() * (totalChars * baseDelay);
      case TextAnimationTiming.FromCenter:
        const centerIndex = Math.floor(totalChars / 2);
        return Math.abs(charIndex - centerIndex) * baseDelay;
      case TextAnimationTiming.FromEdges:
        const edgeDistance = Math.min(charIndex, totalChars - 1 - charIndex);
        return (Math.floor(totalChars / 2) - edgeDistance) * baseDelay;
      default:
        return charIndex * baseDelay;
    }
  }

  public startAnimation(startTime: number = 0): void {
    this.isPlaying = true;
    this.animationStartTime = startTime;
    this.currentTime = startTime;

    console.info("Starting text animation:", this.animationConfig.id);
  }

  public stopAnimation(): void {
    this.isPlaying = false;
    this.resetCharacters();

    console.info("Stopping text animation:", this.animationConfig.id);
  }

  public pauseAnimation(): void {
    this.isPlaying = false;
  }

  public resumeAnimation(): void {
    this.isPlaying = true;
  }

  public updateAnimation(currentTime: number, queue: PolyfillQueue, textRenderer: TextRenderer): void {
    if (!this.isPlaying) return;

    this.currentTime = currentTime;
    const elapsedTime = currentTime - this.animationStartTime;

    for (const char of this.animatedCharacters) {
      const charStartTime = char.animationDelay;
      const charElapsedTime = elapsedTime - charStartTime;

      if (charElapsedTime >= 0) {
        const progress = Math.min(
          charElapsedTime / this.animationConfig.duration,
          1.0
        );
        char.animationProgress = this.applyEasing(progress);

        this.updateCharacterAnimation(char);
      } else {
        this.resetCharacterToInitialState(char);
      }
    }

    this.updateTextRenderer(queue, textRenderer);

    // Check if animation is complete
    if (elapsedTime >= this.getTotalAnimationDuration()) {
      if (this.animationConfig.loop) {
        this.animationStartTime = currentTime;
      } else {
        this.isPlaying = false;
      }
    }

    // console.info("Updating text animation:", this.animationConfig.id, {
    //   elapsedTime,
    //   isPlaying: this.isPlaying,
    //   totalDuration: this.getTotalAnimationDuration(),
    // });
  }

  private updateCharacterAnimation(char: AnimatedCharacter): void {
    const progress = char.animationProgress;
    const intensity = this.animationConfig.intensity;

    switch (this.animationConfig.type) {
      case TextAnimationType.Typewriter:
        char.isVisible = progress > 0;
        char.opacity = progress > 0 ? 1.0 : 0.0;
        break;

      case TextAnimationType.FadeIn:
        char.opacity = progress;
        break;

      case TextAnimationType.SlideIn:
        const slideOffset = (1 - progress) * 200 * intensity;
        char.position[0] = char.originalPosition[0] + slideOffset;
        char.opacity = progress;
        break;

      case TextAnimationType.ScaleIn:
        char.scale = progress * intensity;
        break;

      case TextAnimationType.Bounce:
        const bounceHeight = Math.sin(progress * Math.PI) * 50 * intensity;
        char.position[1] = char.originalPosition[1] + bounceHeight;
        break;

      case TextAnimationType.Wave:
        const waveOffset =
          Math.sin(progress * Math.PI * 2 + char.index * 0.5) * 30 * intensity;
        char.position[1] = char.originalPosition[1] + waveOffset;
        break;

      case TextAnimationType.Glow:
        const glowIntensity =
          (Math.sin(progress * Math.PI * 4) + 1) * 0.5 * intensity;
        char.color[0] = char.originalColor[0] + glowIntensity;
        char.color[1] = char.originalColor[1] + glowIntensity;
        char.color[2] = char.originalColor[2] + glowIntensity;
        break;

      case TextAnimationType.Shake:
        const shakeX = (Math.random() - 0.5) * 15 * intensity * progress;
        const shakeY = (Math.random() - 0.5) * 15 * intensity * progress;
        char.position[0] = char.originalPosition[0] + shakeX;
        char.position[1] = char.originalPosition[1] + shakeY;
        break;

      case TextAnimationType.PopIn:
        const popScale =
          progress < 0.7 ? progress * 1.4 : 1.0 + (1 - progress) * 0.3;
        char.scale = popScale;
        char.opacity = progress;
        break;

      case TextAnimationType.RollIn:
        char.rotation = (1 - progress) * Math.PI * 2;
        char.scale = progress;
        break;

      case TextAnimationType.Elastic:
        const elasticScale =
          1 +
          Math.sin(progress * Math.PI * 6) * 0.3 * intensity * (1 - progress);
        char.scale = elasticScale;
        break;

      case TextAnimationType.Rainbow:
        const hue = (progress * 360 + char.index * 30) % 360;
        const rgb = this.hslToRgb(hue / 360, 1, 0.5);
        char.color[0] = rgb[0];
        char.color[1] = rgb[1];
        char.color[2] = rgb[2];
        break;

      case TextAnimationType.Glitch:
        if (Math.random() < 0.1 * intensity) {
          char.position[0] =
            char.originalPosition[0] + (Math.random() - 0.5) * 20;
          char.color[0] = Math.random();
          char.color[1] = Math.random();
          char.color[2] = Math.random();
        } else {
          char.position[0] = char.originalPosition[0];
          char.color = [...char.originalColor];
        }
        break;

      default:
        break;
    }
  }

  private resetCharacterToInitialState(char: AnimatedCharacter): void {
    char.position = vec2.clone(char.originalPosition);
    char.scale = 1.0;
    char.rotation = 0.0;
    char.opacity = 1.0;
    char.color = [...char.originalColor];
    char.isVisible = true;
    char.animationProgress = 0.0;

    // For typewriter effect, characters should start hidden
    if (this.animationConfig.type === TextAnimationType.Typewriter) {
      char.isVisible = false;
      char.opacity = 0.0;
    }
  }

  private resetCharacters(): void {
    for (const char of this.animatedCharacters) {
      this.resetCharacterToInitialState(char);
    }
  }

  private applyEasing(progress: number): number {
    switch (this.animationConfig.easing) {
      case EasingType.Linear:
        return progress;
      case EasingType.EaseIn:
        return progress * progress;
      case EasingType.EaseOut:
        return 1 - Math.pow(1 - progress, 2);
      case EasingType.EaseInOut:
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default:
        return progress;
    }
  }

  private updateTextRenderer(queue: PolyfillQueue, textRenderer: TextRenderer): void {
    if (!textRenderer.vertices) return;

    const updatedVertices = [...textRenderer.vertices];

    // For typewriter effect, hide all vertices initially
    if (this.animationConfig.type === TextAnimationType.Typewriter) {
      for (const vertex of updatedVertices) {
        vertex.color = [0, 0, 0, 0];
      }
    }

    for (const char of this.animatedCharacters) {
      const startIndex = char.index * 4;

      for (let i = 0; i < 4; i++) {
        const vertexIndex = startIndex + i;
        if (vertexIndex < updatedVertices.length) {
          const vertex = updatedVertices[vertexIndex];

          // Apply transformations
          if (char.isVisible) {
            // Apply scale to vertex position relative to character center
            const originalVertex = char.vertices[i];
            const centerX = char.originalPosition[0];
            const centerY = char.originalPosition[1];

            // Scale relative to character center
            const scaledX =
              centerX + (originalVertex.position[0] - centerX) * char.scale;
            const scaledY =
              centerY + (originalVertex.position[1] - centerY) * char.scale;

            // Apply position offset
            vertex.position[0] =
              scaledX + (char.position[0] - char.originalPosition[0]);
            vertex.position[1] =
              scaledY + (char.position[1] - char.originalPosition[1]);
            vertex.color = [...char.color];
          } else {
            vertex.color = [0, 0, 0, 0]; // Make invisible
          }
        }
      }
    }

    // Update vertex buffer
    queue.writeBuffer(
      textRenderer.vertexBuffer,
      0,
      new Float32Array(
        updatedVertices.flatMap((v) => [
          ...v.position,
          ...v.tex_coords,
          ...v.color,
          ...v.gradient_coords,
          v.object_type,
        ])
      )
    );
  }

  private getTotalAnimationDuration(): number {
    const maxDelay = Math.max(
      ...this.animatedCharacters.map((c) => c.animationDelay)
    );
    return maxDelay + this.animationConfig.duration;
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r, g, b];
  }

  public getConfig(): TextAnimationConfig {
    return { ...this.animationConfig };
  }

  public updateConfig(config: Partial<TextAnimationConfig>, textRenderer: TextRenderer): void {
    this.animationConfig = { ...this.animationConfig, ...config };
    this.initializeCharacters(textRenderer);
  }

  public getAnimatedCharacters(): AnimatedCharacter[] {
    return this.animatedCharacters;
  }

  public isAnimationPlaying(): boolean {
    return this.isPlaying;
  }
}

// Factory function to create common text animation presets
export function createTextAnimationPreset(
  type: TextAnimationType,
  customConfig?: Partial<TextAnimationConfig>
): TextAnimationConfig {
  const baseConfig: TextAnimationConfig = {
    id: `text-animation-${Date.now()}`,
    type,
    timing: TextAnimationTiming.CharByChar,
    duration: 1000,
    delay: 50,
    intensity: 1.0,
    easing: EasingType.EaseOut,
    startTime: 0,
    loop: false,
    reverse: false,
    ...customConfig,
  };

  // Preset-specific configurations
  switch (type) {
    case TextAnimationType.Typewriter:
      return {
        ...baseConfig,
        timing: TextAnimationTiming.CharByChar,
        duration: 100,
        delay: 100,
        easing: EasingType.Linear,
      };

    case TextAnimationType.Wave:
      return {
        ...baseConfig,
        timing: TextAnimationTiming.AllAtOnce,
        duration: 2000,
        loop: true,
        easing: EasingType.EaseInOut,
      };

    case TextAnimationType.Bounce:
      return {
        ...baseConfig,
        timing: TextAnimationTiming.CharByChar,
        duration: 800,
        delay: 100,
        easing: EasingType.EaseOut,
      };

    case TextAnimationType.PopIn:
      return {
        ...baseConfig,
        timing: TextAnimationTiming.CharByChar,
        duration: 600,
        delay: 80,
        easing: EasingType.EaseOut,
      };

    case TextAnimationType.Rainbow:
      return {
        ...baseConfig,
        timing: TextAnimationTiming.AllAtOnce,
        duration: 3000,
        loop: true,
        easing: EasingType.Linear,
      };

    case TextAnimationType.Glitch:
      return {
        ...baseConfig,
        timing: TextAnimationTiming.AllAtOnce,
        duration: 2000,
        intensity: 0.5,
        easing: EasingType.Linear,
      };

    default:
      return baseConfig;
  }
}
