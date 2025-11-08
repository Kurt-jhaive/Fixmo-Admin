'use client';

import React, { useEffect, useRef } from 'react';

export interface KebabMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'danger';
  disabled?: boolean;
  hidden?: boolean;
}

interface KebabMenuProps {
  items: KebabMenuItem[];
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
}

export default function KebabMenu({ items, isOpen, onClose, position = 'right' }: KebabMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const visibleItems = items.filter(item => !item.hidden);

  const getVariantClasses = (variant?: string, disabled?: boolean) => {
    if (disabled) return 'opacity-50 cursor-not-allowed';
    
    switch (variant) {
      case 'primary':
        return 'hover:bg-blue-50 text-gray-700 hover:text-blue-700 cursor-pointer';
      case 'success':
        return 'hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 cursor-pointer';
      case 'danger':
        return 'hover:bg-rose-50 text-gray-700 hover:text-rose-700 cursor-pointer';
      default:
        return 'hover:bg-gray-100 text-gray-700 hover:text-gray-900 cursor-pointer';
    }
  };

  return (
    <div
      ref={menuRef}
      className={`absolute ${position === 'right' ? 'right-0' : 'left-0'} mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200`}
    >
      {visibleItems.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              onClose();
            }
          }}
          disabled={item.disabled}
          className={`
            w-full text-left px-4 py-2.5 flex items-center gap-3 transition-all duration-150
            ${getVariantClasses(item.variant, item.disabled)}
            ${index !== visibleItems.length - 1 ? 'border-b border-gray-100' : ''}
          `}
        >
          <div className="flex-shrink-0 text-current transition-colors">
            {item.icon}
          </div>
          <span className="font-medium text-sm">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// Kebab Icon Button Component
interface KebabButtonProps {
  onClick: (e: React.MouseEvent) => void;
  isOpen?: boolean;
}

export function KebabButton({ onClick, isOpen }: KebabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-2 rounded-lg transition-all duration-200
        ${isOpen 
          ? 'bg-gray-200 text-gray-700' 
          : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
        }
      `}
      aria-label="More actions"
    >
      <svg 
        className="w-5 h-5" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <circle cx="10" cy="5" r="1.5" />
        <circle cx="10" cy="10" r="1.5" />
        <circle cx="10" cy="15" r="1.5" />
      </svg>
    </button>
  );
}
