'use client';

import { useEffect } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const isCtrlPressed = shortcut.ctrlKey ? event.ctrlKey : true;
        const isMetaPressed = shortcut.metaKey ? event.metaKey : true;
        const isShiftPressed = shortcut.shiftKey ? event.shiftKey : !shortcut.shiftKey ? !event.shiftKey : true;
        
        // Check if it's macOS for Cmd key
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isModifierPressed = isMac ? isMetaPressed : isCtrlPressed;
        
        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          isModifierPressed &&
          isShiftPressed
        ) {
          event.preventDefault();
          shortcut.handler();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}

// Common shortcuts
export const commonShortcuts = {
  search: { key: 'k', ctrlKey: true, metaKey: true },
  save: { key: 's', ctrlKey: true, metaKey: true },
  escape: { key: 'Escape' },
  enter: { key: 'Enter' },
};