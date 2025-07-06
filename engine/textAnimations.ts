// Text Animation System - Main Export File
// This file provides a unified interface for all text animation features

export {
  TextAnimator,
  TextAnimationType,
  TextAnimationTiming,
  createTextAnimationPreset,
} from "./textAnimator";

export type { TextAnimationConfig, AnimatedCharacter } from "./textAnimator";

export { TextAnimationManager } from "./textAnimationManager";

export type {
  TextAnimationSequence,
  TextAnimationTemplate,
} from "./textAnimationManager";

// Re-export enhanced TextRenderer with animation capabilities
export { TextRenderer } from "./text";

// Utility function to quickly apply viral animations to text
export function quickViralAnimation(
  textRenderer: any,
  type: "hook" | "viral" | "brand" | "trendy" = "viral"
): void {
  switch (type) {
    case "hook":
      textRenderer.applyViralTypewriter();
      break;
    case "viral":
      textRenderer.applyTikTokBounce();
      break;
    case "brand":
      textRenderer.applyInstagramPop();
      break;
    case "trendy":
      textRenderer.applyYouTubeWave();
      break;
  }
  textRenderer.startTextAnimation();
}

// Preset configurations for common use cases
export const VIRAL_PRESETS = {
  TIKTOK_HOOK: "viral-typewriter",
  INSTAGRAM_POP: "instagram-pop",
  YOUTUBE_WAVE: "youtube-wave",
  BRAND_REVEAL: "brand-reveal",
  ATTENTION_GRABBER: "tiktok-bounce",
  NEON_STYLE: "neon-glow",
  MATRIX_EFFECT: "glitch-matrix",
  RAINBOW_FLOW: "rainbow-flow",
  ELASTIC_BOUNCE: "elastic-reveal",
  SLIDE_IMPACT: "slide-impact",
};

// Animation categories for UI organization
export const ANIMATION_CATEGORIES = {
  VIRAL: "Viral",
  PROFESSIONAL: "Professional",
  STYLISH: "Stylish",
  DYNAMIC: "Dynamic",
  COLORFUL: "Colorful",
};

// Quick setup function for new text renderers
export function setupTextAnimations(textRenderer: any): void {
  // The TextRenderer constructor now automatically initializes the animation manager
  // This function is provided for explicit setup if needed
  if (!textRenderer.animationManager) {
    console.warn(
      "TextRenderer should automatically have animationManager initialized"
    );
  }
}

// Helper to check if text animations are supported
export function isTextAnimationSupported(): boolean {
  // Check for required features
  return (
    typeof OffscreenCanvas !== "undefined" &&
    typeof requestAnimationFrame !== "undefined"
  );
}

// Performance monitoring utilities
export interface TextAnimationStats {
  activeAnimations: number;
  totalAnimations: number;
  averageFrameTime: number;
  memoryUsage: number;
}

export function getTextAnimationStats(
  animationManager: any
): TextAnimationStats {
  const activeAnimators = animationManager.getActiveAnimators();

  return {
    activeAnimations: activeAnimators.filter((a: any) => a.isAnimationPlaying())
      .length,
    totalAnimations: activeAnimators.length,
    averageFrameTime: 16.67, // Target 60fps
    memoryUsage: activeAnimators.length * 1024, // Rough estimate in bytes
  };
}
