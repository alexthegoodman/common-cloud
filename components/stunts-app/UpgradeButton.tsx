"use client";

import React, { useState } from "react";

interface UpgradeButtonProps {
  variant?: "main" | "minimal" | "bold" | "outline" | "ring";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export const UpgradeButton: React.FC<UpgradeButtonProps> = ({
  variant = "main",
  onClick,
  disabled = false,
  loading = false,
  children,
}) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (disabled || loading) return;

    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);

    if (onClick) {
      onClick();
    }
  };

  const getButtonClasses = () => {
    const baseClasses =
      "relative overflow-hidden font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-400/50";

    if (disabled) {
      return `${baseClasses} opacity-50 cursor-not-allowed bg-gray-400 text-gray-600 py-3 px-6 rounded-lg`;
    }

    switch (variant) {
      case "main":
        return `${baseClasses} bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-white font-bold py-2 px-8 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-yellow-500/50 transform hover:scale-105`;

      case "minimal":
        return `${baseClasses} bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-gray-900 py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-1`;

      case "bold":
        return `${baseClasses} bg-gradient-to-b from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl border-2 border-yellow-300 hover:border-yellow-200 transform hover:scale-105`;

      case "outline":
        return `${baseClasses} border-2 border-yellow-400 hover:border-yellow-300 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400 hover:bg-opacity-10 py-3 px-6 rounded-lg`;

      case "ring":
        return `${baseClasses} bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-white py-3 px-6 rounded-full shadow-lg hover:shadow-yellow-500/50 hover:shadow-2xl transform hover:scale-110`;

      default:
        return baseClasses;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <span className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Loading...</span>
        </span>
      );
    }

    if (children) {
      return children;
    }

    // Default content based on variant
    switch (variant) {
      case "main":
        return (
          <span className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>Upgrade to Premium</span>
          </span>
        );

      case "minimal":
        return (
          <span className="flex items-center justify-center space-x-2">
            <span>✨</span>
            <span>Upgrade Now</span>
          </span>
        );

      case "bold":
        return <span className="drop-shadow-sm">🚀 Go Premium</span>;

      case "outline":
        return (
          <span className="flex items-center justify-center space-x-2">
            <span>👑</span>
            <span>Premium Access</span>
          </span>
        );

      case "ring":
        return <span>⭐ Upgrade</span>;

      default:
        return "Upgrade";
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={`${getButtonClasses()} ${isClicked ? "animate-pulse" : ""}`}
    >
      {/* Shimmer effect for main variant */}
      {variant === "main" && !disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer"></div>
      )}

      {/* Glow ring for ring variant */}
      {variant === "ring" && !disabled && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
      )}

      <span className="relative z-10">{renderContent()}</span>
    </button>
  );
};

// Demo component showing all variants
const UpgradeButtonDemo: React.FC = () => {
  const handleUpgrade = (variant: string) => {
    console.log(`Upgrade clicked with variant: ${variant}`);
    // Add your upgrade logic here
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">
          Golden Upgrade Buttons
        </h1>

        {/* Main Featured Button */}
        <UpgradeButton variant="main" onClick={() => handleUpgrade("main")} />

        {/* Alternative Styles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <UpgradeButton
            variant="minimal"
            onClick={() => handleUpgrade("minimal")}
          />

          <UpgradeButton variant="bold" onClick={() => handleUpgrade("bold")} />

          <UpgradeButton
            variant="outline"
            onClick={() => handleUpgrade("outline")}
          />

          <UpgradeButton variant="ring" onClick={() => handleUpgrade("ring")} />
        </div>

        {/* Custom Content Examples */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <UpgradeButton
            variant="main"
            onClick={() => handleUpgrade("custom1")}
          >
            <span className="flex items-center space-x-2">
              <span>💎</span>
              <span>Custom Text</span>
            </span>
          </UpgradeButton>

          <UpgradeButton variant="minimal" loading={true} />

          <UpgradeButton variant="outline" disabled={true}>
            Disabled State
          </UpgradeButton>
        </div>

        {/* Demo Info */}
        <div className="mt-12 text-gray-400 text-sm space-y-2">
          <p>TypeScript React component with multiple variants</p>
          <p>
            Includes loading states, disabled states, and custom content support
          </p>
          <p>Click any button to see the interaction feedback</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default UpgradeButtonDemo;
