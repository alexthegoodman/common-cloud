// Basic test file for text animation system
// Note: This is a simplified test - full testing would require WebGPU mock setup

import { 
  TextAnimationType, 
  TextAnimationTiming, 
  createTextAnimationPreset 
} from "../textAnimator";

import { TextAnimationManager } from "../textAnimationManager";

import { 
  VIRAL_PRESETS, 
  ANIMATION_CATEGORIES,
  isTextAnimationSupported 
} from "../textAnimations";

describe("Text Animation System", () => {
  let animationManager: TextAnimationManager;

  beforeEach(() => {
    animationManager = new TextAnimationManager();
  });

  test("should create animation manager with templates", () => {
    expect(animationManager).toBeDefined();
    
    const templates = animationManager.getTemplates();
    expect(templates.length).toBeGreaterThan(0);
    
    // Check for viral templates
    const viralTemplates = animationManager.getViralTemplates();
    expect(viralTemplates.length).toBeGreaterThan(0);
  });

  test("should create text animation presets", () => {
    const typewriterConfig = createTextAnimationPreset(TextAnimationType.Typewriter);
    
    expect(typewriterConfig.type).toBe(TextAnimationType.Typewriter);
    expect(typewriterConfig.timing).toBe(TextAnimationTiming.CharByChar);
    expect(typewriterConfig.duration).toBe(100);
    expect(typewriterConfig.delay).toBe(100);
  });

  test("should have predefined viral presets", () => {
    expect(VIRAL_PRESETS.TIKTOK_HOOK).toBe("viral-typewriter");
    expect(VIRAL_PRESETS.INSTAGRAM_POP).toBe("instagram-pop");
    expect(VIRAL_PRESETS.YOUTUBE_WAVE).toBe("youtube-wave");
  });

  test("should have animation categories", () => {
    expect(ANIMATION_CATEGORIES.VIRAL).toBe("Viral");
    expect(ANIMATION_CATEGORIES.PROFESSIONAL).toBe("Professional");
    expect(ANIMATION_CATEGORIES.STYLISH).toBe("Stylish");
  });

  test("should get templates by category", () => {
    const viralTemplates = animationManager.getViralTemplates();
    const professionalTemplates = animationManager.getProfessionalTemplates();
    const stylishTemplates = animationManager.getStylishTemplates();
    
    expect(viralTemplates.length).toBeGreaterThan(0);
    expect(professionalTemplates.length).toBeGreaterThan(0);
    expect(stylishTemplates.length).toBeGreaterThan(0);
    
    // Check that viral templates are properly categorized
    viralTemplates.forEach(template => {
      expect(template.category).toBe("Viral");
    });
  });

  test("should support feature detection", () => {
    const isSupported = isTextAnimationSupported();
    // In Node.js test environment, this might be false
    expect(typeof isSupported).toBe("boolean");
  });

  test("should create sequences", () => {
    const config1 = createTextAnimationPreset(TextAnimationType.Typewriter);
    const config2 = createTextAnimationPreset(TextAnimationType.Bounce);
    
    const sequence = animationManager.createSequence("Test Sequence", [config1, config2]);
    
    expect(sequence.name).toBe("Test Sequence");
    expect(sequence.animations.length).toBe(2);
    expect(sequence.totalDuration).toBeGreaterThan(0);
  });

  test("should export and import configuration", () => {
    const exportedConfig = animationManager.exportConfig();
    
    expect(exportedConfig).toHaveProperty("templates");
    expect(exportedConfig).toHaveProperty("sequences");
    expect(exportedConfig).toHaveProperty("activeAnimators");
    
    // Create new manager and import
    const newManager = new TextAnimationManager();
    newManager.importConfig(exportedConfig);
    
    const newTemplates = newManager.getTemplates();
    const originalTemplates = animationManager.getTemplates();
    
    expect(newTemplates.length).toBe(originalTemplates.length);
  });

  test("should validate template structure", () => {
    const templates = animationManager.getTemplates();
    
    templates.forEach(template => {
      expect(template).toHaveProperty("id");
      expect(template).toHaveProperty("name");
      expect(template).toHaveProperty("description");
      expect(template).toHaveProperty("category");
      expect(template).toHaveProperty("preview");
      expect(template).toHaveProperty("config");
      
      // Validate config structure
      expect(template.config).toHaveProperty("type");
      expect(template.config).toHaveProperty("timing");
      expect(template.config).toHaveProperty("duration");
      expect(template.config).toHaveProperty("delay");
      expect(template.config).toHaveProperty("intensity");
      expect(template.config).toHaveProperty("easing");
    });
  });

  test("should have specific viral animation templates", () => {
    const template = animationManager.getTemplate("viral-typewriter");
    expect(template).toBeDefined();
    expect(template?.name).toBe("Viral Typewriter");
    expect(template?.category).toBe("Viral");
    
    const bounceTemplate = animationManager.getTemplate("tiktok-bounce");
    expect(bounceTemplate).toBeDefined();
    expect(bounceTemplate?.name).toBe("TikTok Bounce");
  });
});

// Mock test for basic animation logic
describe("Text Animation Logic", () => {
  test("should calculate easing functions", () => {
    // These would need actual implementation testing
    // For now, just verify the types exist
    expect(TextAnimationType.Typewriter).toBeDefined();
    expect(TextAnimationType.Bounce).toBeDefined();
    expect(TextAnimationType.Wave).toBeDefined();
    expect(TextAnimationType.Glow).toBeDefined();
  });

  test("should have proper timing modes", () => {
    expect(TextAnimationTiming.CharByChar).toBeDefined();
    expect(TextAnimationTiming.WordByWord).toBeDefined();
    expect(TextAnimationTiming.AllAtOnce).toBeDefined();
    expect(TextAnimationTiming.FromCenter).toBeDefined();
    expect(TextAnimationTiming.RandomOrder).toBeDefined();
  });
});

// Performance test
describe("Text Animation Performance", () => {
  test("should handle large numbers of templates efficiently", () => {
    const startTime = performance.now();
    
    // Get all templates multiple times
    for (let i = 0; i < 1000; i++) {
      animationManager.getTemplates();
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should complete in reasonable time (< 100ms for 1000 operations)
    expect(duration).toBeLessThan(100);
  });

  test("should efficiently filter templates by category", () => {
    const startTime = performance.now();
    
    for (let i = 0; i < 100; i++) {
      animationManager.getViralTemplates();
      animationManager.getProfessionalTemplates();
      animationManager.getStylishTemplates();
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(50);
  });
});