import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({
  className = "",
  size = "md",
  showText = true,
}: LogoProps) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-12 h-12 text-xl",
  };

  const textSizeClasses = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} bg-blue-600 rounded-lg flex items-center justify-center`}
      >
        <span className="text-white font-bold">T</span>
      </div>
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]}`}>TokenHire</span>
      )}
    </div>
  );
}
