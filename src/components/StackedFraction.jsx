import React from 'react';

/**
 * StackedFraction Component
 * Renders vertical fractions (e.g., 1 over 2 for 1/2, 1 up and 2 down)
 * as requested: "Medicine half Cup Option Like 1 - 2 This 1 up and 2 down"
 */
export const StackedFraction = ({ 
  num = 1, 
  den = 2, 
  whole = null, 
  className = "",
  size = "md" 
}) => {
  const sizeClasses = {
    sm: "text-[11px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-base"
  };

  return (
    <span className={`inline-flex items-center align-middle font-semibold font-mono ${className}`}>
      {whole !== null && whole !== undefined && whole !== 0 && (
        <span className="mr-0.5 text-inherit font-sans">{whole}</span>
      )}
      <span className="fraction-vertical inline-flex flex-col text-center justify-center leading-none mx-0.5">
        <span className={`numerator border-b border-current pb-[1px] leading-[0.8] px-0.5 ${sizeClasses[size] || sizeClasses.md}`}>
          {num}
        </span>
        <span className={`denominator pt-[1.5px] leading-[0.8] px-0.5 ${sizeClasses[size] || sizeClasses.md}`}>
          {den}
        </span>
      </span>
    </span>
  );
};

/**
 * Formats any text string that may contain fractions like "1/2", "1/4", "3/4", "1 1/2", "2 1/2"
 * and turns them into React nodes with StackedFraction!
 * Examples:
 *  "1/2+0+1/2" => [ <StackedFraction num={1} den={2} />, "+0+", <StackedFraction num={1} den={2} /> ]
 *  "1/2 কাপ (Half Cup) পানিতে" => [ <StackedFraction num={1} den={2} />, " কাপ (Half Cup) পানিতে" ]
 */
export const renderWithFractions = (text, size = "md") => {
  if (!text || typeof text !== 'string') return text;

  // Regex to match whole with fraction like "1 1/2", "2 1/2" or stand-alone fractions "1/2", "1/4", "3/4", "1/3", "2/3"
  const regex = /(\b\d+\s+)?(\b\d+)\/(\d+\b)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Push preceding text
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const wholeStr = match[1] ? match[1].trim() : null;
    const whole = wholeStr ? parseInt(wholeStr, 10) : null;
    const num = parseInt(match[2], 10);
    const den = parseInt(match[3], 10);

    parts.push(
      <StackedFraction
        key={`frac-${match.index}`}
        num={num}
        den={den}
        whole={whole}
        size={size}
      />
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

export default StackedFraction;
