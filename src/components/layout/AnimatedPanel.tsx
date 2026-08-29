import React from 'react';

interface AnimatedPanelProps {
  visible: boolean;
  side: 'left' | 'right';
  width: number;
  children: React.ReactNode;
}

export const AnimatedPanel: React.FC<AnimatedPanelProps> = ({ visible, side, width, children }) => {
  const transformValue = visible ? 'translateX(0)' : (side === 'left' ? `translateX(-100%)` : `translateX(100%)`);
  
  return (
    <div
      style={{
        width: visible ? width : 0,
        opacity: visible ? 1 : 0,
        transform: transformValue,
        transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'transform, opacity, width',
        contain: 'layout style',
        overflow: 'hidden',
        display: 'flex',
        flexShrink: 0
      }}
    >
      <div style={{ width, flexShrink: 0, display: 'flex' }}>
        {children}
      </div>
    </div>
  );
};
