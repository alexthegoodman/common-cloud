import {
  TextAnimator,
  TextAnimationConfig,
  TextAnimationType,
  TextAnimationTiming,
  createTextAnimationPreset,
} from "./textAnimator";
import { TextRenderer } from "./text";
import { PolyfillQueue } from "./polyfill";
import { EasingType } from "./animations";

export interface TextAnimationSequence {
  id: string;
  name: string;
  animations: TextAnimationConfig[];
  totalDuration: number;
  loop: boolean;
}

export interface TextAnimationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  config: TextAnimationConfig;
  thumbnail?: string;
}

export class TextAnimationManager {
  private activeAnimators: Map<string, TextAnimator> = new Map();
  private templates: Map<string, TextAnimationTemplate> = new Map();
  private sequences: Map<string, TextAnimationSequence> = new Map();
  private currentTime: number = 0;

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Viral and trendy text animations
    const viralTemplates: TextAnimationTemplate[] = [
      {
        id: "viral-typewriter",
        name: "Viral Typewriter",
        description: "Classic typewriter effect perfect for hooks and reveals",
        category: "Viral",
        preview: "T-y-p-e-w-r-i-t-e-r",
        config: createTextAnimationPreset(TextAnimationType.Typewriter, {
          timing: TextAnimationTiming.CharByChar,
          delay: 120,
          duration: 80,
        }),
      },
      {
        id: "tiktok-bounce",
        name: "TikTok Bounce",
        description: "Energetic bounce animation trending on TikTok",
        category: "Viral",
        preview: "🎉 BOUNCE 🎉",
        config: createTextAnimationPreset(TextAnimationType.Bounce, {
          timing: TextAnimationTiming.CharByChar,
          delay: 100,
          duration: 600,
          // intensity: 3.0
        }),
      },
      {
        id: "instagram-pop",
        name: "Instagram Pop",
        description: "Eye-catching pop-in effect for Instagram Reels",
        category: "Viral",
        preview: "💥 POP 💥",
        config: createTextAnimationPreset(TextAnimationType.PopIn, {
          timing: TextAnimationTiming.FromCenter,
          delay: 80,
          duration: 500,
          // intensity: 2.5
        }),
      },
      {
        id: "youtube-wave",
        name: "YouTube Wave",
        description: "Smooth wave animation for YouTube Shorts",
        category: "Viral",
        preview: "~~~WAVE~~~",
        config: createTextAnimationPreset(TextAnimationType.Wave, {
          timing: TextAnimationTiming.AllAtOnce,
          duration: 2000,
          loop: true,
          // intensity: 2.0
        }),
      },
      {
        id: "neon-glow",
        name: "Neon Glow",
        description: "Cyberpunk-style neon glow effect",
        category: "Stylish",
        preview: "✨ GLOW ✨",
        config: createTextAnimationPreset(TextAnimationType.Glow, {
          timing: TextAnimationTiming.AllAtOnce,
          duration: 1500,
          loop: true,
          // intensity: 0.9
        }),
      },
      {
        id: "glitch-matrix",
        name: "Matrix Glitch",
        description: "Digital glitch effect inspired by The Matrix",
        category: "Stylish",
        preview: "⚡ GLITCH ⚡",
        config: createTextAnimationPreset(TextAnimationType.Glitch, {
          timing: TextAnimationTiming.AllAtOnce,
          duration: 2000,
          // intensity: 0.7
        }),
      },
      {
        id: "rainbow-flow",
        name: "Rainbow Flow",
        description: "Colorful rainbow transition effect",
        category: "Colorful",
        preview: "🌈 RAINBOW 🌈",
        config: createTextAnimationPreset(TextAnimationType.Rainbow, {
          timing: TextAnimationTiming.AllAtOnce,
          duration: 3000,
          loop: true,
          // intensity: 1.0
        }),
      },
      {
        id: "elastic-reveal",
        name: "Elastic Reveal",
        description: "Bouncy elastic animation for dramatic reveals",
        category: "Dynamic",
        preview: "🎯 ELASTIC 🎯",
        config: createTextAnimationPreset(TextAnimationType.Elastic, {
          timing: TextAnimationTiming.CharByChar,
          delay: 100,
          duration: 1000,
          // intensity: 0.8
        }),
      },
      {
        id: "slide-impact",
        name: "Slide Impact",
        description: "Powerful slide-in animation with impact",
        category: "Dynamic",
        preview: "💨 SLIDE 💨",
        config: createTextAnimationPreset(TextAnimationType.SlideIn, {
          timing: TextAnimationTiming.CharByChar,
          delay: 80,
          duration: 400,
          // intensity: 3.0
        }),
      },
      {
        id: "scale-burst",
        name: "Scale Burst",
        description: "Explosive scale animation for big reveals",
        category: "Dynamic",
        preview: "💥 BURST 💥",
        config: createTextAnimationPreset(TextAnimationType.ScaleIn, {
          timing: TextAnimationTiming.FromCenter,
          delay: 60,
          duration: 300,
          // intensity: 1.0
        }),
      },
    ];

    // Professional templates
    const professionalTemplates: TextAnimationTemplate[] = [
      {
        id: "corporate-fade",
        name: "Corporate Fade",
        description: "Professional fade-in for business content",
        category: "Professional",
        preview: "CORPORATE",
        config: createTextAnimationPreset(TextAnimationType.FadeIn, {
          timing: TextAnimationTiming.AllAtOnce,
          duration: 1000,
          easing: EasingType.EaseInOut,
        }),
      },
      {
        id: "brand-reveal",
        name: "Brand Reveal",
        description: "Elegant reveal for brand announcements",
        category: "Professional",
        preview: "BRAND",
        config: createTextAnimationPreset(TextAnimationType.SlideIn, {
          timing: TextAnimationTiming.WordByWord,
          delay: 200,
          duration: 600,
          // intensity: 0.5
        }),
      },
      {
        id: "minimal-type",
        name: "Minimal Type",
        description: "Clean typewriter for minimalist aesthetics",
        category: "Professional",
        preview: "MINIMAL",
        config: createTextAnimationPreset(TextAnimationType.Typewriter, {
          timing: TextAnimationTiming.CharByChar,
          delay: 80,
          duration: 60,
        }),
      },
    ];

    // Store all templates
    [...viralTemplates, ...professionalTemplates].forEach((template) => {
      this.templates.set(template.id, template);
    });
  }

  public createAnimator(
    textRenderer: TextRenderer,
    config: TextAnimationConfig
  ): TextAnimator {
    const animator = new TextAnimator(textRenderer, config);
    this.activeAnimators.set(config.id, animator);
    return animator;
  }

  public createAnimatorFromTemplate(
    textRenderer: TextRenderer,
    templateId: string,
    overrides?: Partial<TextAnimationConfig>
  ): TextAnimator | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const config = { ...template.config, ...overrides };
    config.id = `${templateId}-${Date.now()}`;

    return this.createAnimator(textRenderer, config);
  }

  public removeAnimator(animatorId: string): void {
    const animator = this.activeAnimators.get(animatorId);
    if (animator) {
      animator.stopAnimation();
      this.activeAnimators.delete(animatorId);
    }
  }

  // public updateAnimations(currentTime: number, queue: PolyfillQueue): void {
  //   this.currentTime = currentTime;

  //   for (const animator of this.activeAnimators.values()) {
  //     animator.updateAnimation(currentTime, queue);
  //   }
  // }

  public getTemplates(): TextAnimationTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplatesByCategory(category: string): TextAnimationTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.category === category
    );
  }

  public getTemplate(templateId: string): TextAnimationTemplate | null {
    return this.templates.get(templateId) || null;
  }

  public getViralTemplates(): TextAnimationTemplate[] {
    return this.getTemplatesByCategory("Viral");
  }

  public getProfessionalTemplates(): TextAnimationTemplate[] {
    return this.getTemplatesByCategory("Professional");
  }

  public getStylishTemplates(): TextAnimationTemplate[] {
    return this.getTemplatesByCategory("Stylish");
  }

  public getDynamicTemplates(): TextAnimationTemplate[] {
    return this.getTemplatesByCategory("Dynamic");
  }

  public getColorfulTemplates(): TextAnimationTemplate[] {
    return this.getTemplatesByCategory("Colorful");
  }

  public createSequence(
    name: string,
    animations: TextAnimationConfig[],
    loop: boolean = false
  ): TextAnimationSequence {
    const sequence: TextAnimationSequence = {
      id: `sequence-${Date.now()}`,
      name,
      animations,
      totalDuration: this.calculateSequenceDuration(animations),
      loop,
    };

    this.sequences.set(sequence.id, sequence);
    return sequence;
  }

  private calculateSequenceDuration(animations: TextAnimationConfig[]): number {
    return animations.reduce((total, anim) => {
      return Math.max(total, anim.startTime + anim.duration);
    }, 0);
  }

  public playSequence(
    sequenceId: string,
    textRenderer: TextRenderer,
    startTime: number = 0
  ): void {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence) return;

    for (const animConfig of sequence.animations) {
      const animator = this.createAnimator(textRenderer, animConfig);
      animator.startAnimation(startTime + animConfig.startTime);
    }
  }

  public stopAllAnimations(): void {
    for (const animator of this.activeAnimators.values()) {
      animator.stopAnimation();
    }
    this.activeAnimators.clear();
  }

  public pauseAllAnimations(): void {
    for (const animator of this.activeAnimators.values()) {
      animator.pauseAnimation();
    }
  }

  public resumeAllAnimations(): void {
    for (const animator of this.activeAnimators.values()) {
      animator.resumeAnimation();
    }
  }

  public getActiveAnimators(): TextAnimator[] {
    return Array.from(this.activeAnimators.values());
  }

  public getAnimator(animatorId: string): TextAnimator | null {
    return this.activeAnimators.get(animatorId) || null;
  }

  // Utility methods for creating specific viral animation combinations
  public createViralHookAnimation(textRenderer: TextRenderer): TextAnimator {
    const config = createTextAnimationPreset(TextAnimationType.Typewriter, {
      timing: TextAnimationTiming.CharByChar,
      delay: 150,
      duration: 100,
      // intensity: 1.0
    });
    return this.createAnimator(textRenderer, config);
  }

  public createAttentionGrabber(textRenderer: TextRenderer): TextAnimator {
    const config = createTextAnimationPreset(TextAnimationType.Shake, {
      timing: TextAnimationTiming.AllAtOnce,
      duration: 1000,
      // intensity: 1.2,
      loop: true,
    });
    return this.createAnimator(textRenderer, config);
  }

  public createBrandReveal(textRenderer: TextRenderer): TextAnimator {
    const config = createTextAnimationPreset(TextAnimationType.PopIn, {
      timing: TextAnimationTiming.FromCenter,
      delay: 100,
      duration: 800,
      // intensity: 1.0,
      easing: EasingType.EaseOut,
    });
    return this.createAnimator(textRenderer, config);
  }

  public createTrendyTransition(textRenderer: TextRenderer): TextAnimator {
    const config = createTextAnimationPreset(TextAnimationType.SlideIn, {
      timing: TextAnimationTiming.RandomOrder,
      delay: 50,
      duration: 400,
      // intensity: 1.5,
      easing: EasingType.EaseOut,
    });
    return this.createAnimator(textRenderer, config);
  }

  // Export configuration for saving/loading
  public exportConfig(): any {
    return {
      templates: Array.from(this.templates.entries()),
      sequences: Array.from(this.sequences.entries()),
      activeAnimators: Array.from(this.activeAnimators.entries()).map(
        ([id, animator]) => ({
          id,
          config: animator.getConfig(),
        })
      ),
    };
  }

  public importConfig(config: any): void {
    // Import templates
    if (config.templates) {
      this.templates.clear();
      config.templates.forEach(
        ([id, template]: [string, TextAnimationTemplate]) => {
          this.templates.set(id, template);
        }
      );
    }

    // Import sequences
    if (config.sequences) {
      this.sequences.clear();
      config.sequences.forEach(
        ([id, sequence]: [string, TextAnimationSequence]) => {
          this.sequences.set(id, sequence);
        }
      );
    }
  }
}
