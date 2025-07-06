"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Stop,
  MagicWand,
  Lightning,
  Sparkle,
  Fire,
  Waves,
  Atom,
  Rainbow,
  Timer,
  Sliders,
  ArrowClockwise,
  Eye,
  Gear
} from "@phosphor-icons/react";
import { TextAnimationManager, TextAnimationTemplate } from "../../engine/textAnimationManager";
import { TextAnimationType, TextAnimationTiming, createTextAnimationPreset } from "../../engine/textAnimator";
import { EasingType } from "../../engine/animations";

interface TextAnimationPanelProps {
  animationManager: TextAnimationManager;
  onAnimationSelect: (templateId: string) => void;
  onAnimationPlay: () => void;
  onAnimationStop: () => void;
  className?: string;
}

const animationIcons: Record<string, React.ReactNode> = {
  "viral-typewriter": <Timer size={20} />,
  "tiktok-bounce": <Lightning size={20} />,
  "instagram-pop": <MagicWand size={20} />,
  "youtube-wave": <Waves size={20} />,
  "neon-glow": <Sparkle size={20} />,
  "glitch-matrix": <Atom size={20} />,
  "rainbow-flow": <Rainbow size={20} />,
  "elastic-reveal": <ArrowClockwise size={20} />,
  "slide-impact": <Lightning size={20} />,
  "scale-burst": <Fire size={20} />
};

const categoryColors: Record<string, string> = {
  "Viral": "bg-red-500/20 border-red-500/50 text-red-400",
  "Professional": "bg-blue-500/20 border-blue-500/50 text-blue-400",
  "Stylish": "bg-purple-500/20 border-purple-500/50 text-purple-400",
  "Dynamic": "bg-orange-500/20 border-orange-500/50 text-orange-400",
  "Colorful": "bg-pink-500/20 border-pink-500/50 text-pink-400"
};

export default function TextAnimationPanel({
  animationManager,
  onAnimationSelect,
  onAnimationPlay,
  onAnimationStop,
  className = ""
}: TextAnimationPanelProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Viral");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customConfig, setCustomConfig] = useState({
    duration: 1000,
    delay: 100,
    intensity: 1.0,
    timing: TextAnimationTiming.CharByChar,
    easing: EasingType.EaseOut,
    loop: false
  });

  const categories = ["Viral", "Professional", "Stylish", "Dynamic", "Colorful"];
  
  const getTemplatesByCategory = (category: string): TextAnimationTemplate[] => {
    switch (category) {
      case "Viral":
        return animationManager.getViralTemplates();
      case "Professional":
        return animationManager.getProfessionalTemplates();
      case "Stylish":
        return animationManager.getStylishTemplates();
      case "Dynamic":
        return animationManager.getDynamicTemplates();
      case "Colorful":
        return animationManager.getColorfulTemplates();
      default:
        return animationManager.getTemplates();
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    onAnimationSelect(templateId);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    onAnimationPlay();
  };

  const handleStop = () => {
    setIsPlaying(false);
    onAnimationStop();
  };

  const renderTemplateCard = (template: TextAnimationTemplate) => (
    <motion.div
      key={template.id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-3 rounded-lg border cursor-pointer transition-all duration-200
        ${selectedTemplate === template.id 
          ? 'bg-red-500/20 border-red-500 ring-2 ring-red-500/50' 
          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
        }
      `}
      onClick={() => handleTemplateSelect(template.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-red-400">
            {animationIcons[template.id] || <MagicWand size={20} />}
          </div>
          <span className="text-sm font-medium text-white">
            {template.name}
          </span>
        </div>
        <div className={`px-2 py-1 text-xs rounded border ${categoryColors[template.category]}`}>
          {template.category}
        </div>
      </div>
      
      <p className="text-xs text-gray-400 mb-2">{template.description}</p>
      
      <div className="text-xs font-mono text-gray-500 bg-slate-900/50 px-2 py-1 rounded">
        {template.preview}
      </div>

      {selectedTemplate === template.id && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 border-2 border-red-500 rounded-lg pointer-events-none"
        />
      )}
    </motion.div>
  );

  return (
    <div className={`bg-slate-900 border border-slate-700 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MagicWand size={20} className="text-red-400" />
            Text Animators
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              title="Advanced Settings"
            >
              <Gear size={16} className="text-gray-400" />
            </button>
            <button
              onClick={isPlaying ? handleStop : handlePlay}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
                ${isPlaying 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
                }
              `}
            >
              {isPlaying ? <Stop size={16} /> : <Play size={16} />}
              {isPlaying ? 'Stop' : 'Play'}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-3 py-1.5 text-sm rounded transition-all duration-200
                ${selectedCategory === category
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-slate-700'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Settings */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-slate-700 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Duration (ms)</label>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={customConfig.duration}
                    onChange={(e) => setCustomConfig(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{customConfig.duration}ms</span>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Delay (ms)</label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={customConfig.delay}
                    onChange={(e) => setCustomConfig(prev => ({ ...prev, delay: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">{customConfig.delay}ms</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Timing</label>
                  <select
                    value={customConfig.timing}
                    onChange={(e) => setCustomConfig(prev => ({ ...prev, timing: e.target.value as TextAnimationTiming }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                  >
                    <option value={TextAnimationTiming.CharByChar}>Char by Char</option>
                    <option value={TextAnimationTiming.WordByWord}>Word by Word</option>
                    <option value={TextAnimationTiming.AllAtOnce}>All at Once</option>
                    <option value={TextAnimationTiming.FromCenter}>From Center</option>
                    <option value={TextAnimationTiming.RandomOrder}>Random</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Easing</label>
                  <select
                    value={customConfig.easing}
                    onChange={(e) => setCustomConfig(prev => ({ ...prev, easing: e.target.value as EasingType }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
                  >
                    <option value={EasingType.Linear}>Linear</option>
                    <option value={EasingType.EaseIn}>Ease In</option>
                    <option value={EasingType.EaseOut}>Ease Out</option>
                    <option value={EasingType.EaseInOut}>Ease In Out</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={customConfig.loop}
                    onChange={(e) => setCustomConfig(prev => ({ ...prev, loop: e.target.checked }))}
                    className="w-4 h-4 bg-slate-800 border border-slate-600 rounded"
                  />
                  Loop Animation
                </label>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Intensity</span>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={customConfig.intensity}
                    onChange={(e) => setCustomConfig(prev => ({ ...prev, intensity: parseFloat(e.target.value) }))}
                    className="w-20 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 w-8">{customConfig.intensity}x</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates Grid */}
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">
            {selectedCategory} Animations
          </h4>
          <span className="text-xs text-gray-500">
            {getTemplatesByCategory(selectedCategory).length} templates
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
          <AnimatePresence mode="wait">
            {getTemplatesByCategory(selectedCategory).map(renderTemplateCard)}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-slate-700">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleTemplateSelect("viral-typewriter")}
            className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2 text-red-400">
              <Timer size={16} />
              <span className="text-xs">Hook</span>
            </div>
          </button>
          
          <button
            onClick={() => handleTemplateSelect("tiktok-bounce")}
            className="p-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2 text-orange-400">
              <Lightning size={16} />
              <span className="text-xs">Viral</span>
            </div>
          </button>
          
          <button
            onClick={() => handleTemplateSelect("brand-reveal")}
            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2 text-blue-400">
              <Eye size={16} />
              <span className="text-xs">Brand</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}