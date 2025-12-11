import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ZoomIn, ZoomOut, Home, Trash2, Maximize, LayoutDashboard, Moon, Sun } from 'lucide-react';

export default function ViewControls({ zoom, onZoom, onReset, onClear, onFullScreen, theme, onToggleTheme }) {
  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2 flex flex-col items-center gap-1 z-50 border">
      <Button variant="ghost" size="icon" onClick={() => onZoom('in')} title="Zoom In"><ZoomIn className="w-5 h-5"/></Button>
      <div className="text-center text-xs font-semibold text-gray-600 tabular-nums">{Math.round(zoom * 100)}%</div>
      <Button variant="ghost" size="icon" onClick={() => onZoom('out')} title="Zoom Out"><ZoomOut className="w-5 h-5"/></Button>
      
      <div className="w-full h-px bg-gray-200 my-1"></div>
      
      <Button variant="ghost" size="icon" onClick={onReset} title="Reset View"><Home className="w-5 h-5" /></Button>
      <Button variant="ghost" size="icon" onClick={onFullScreen} title="Full Screen"><Maximize className="w-5 h-5" /></Button>
      <Button variant="ghost" size="icon" onClick={onToggleTheme} title="Toggle Theme">
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </Button>
      
      <div className="w-full h-px bg-gray-200 my-1"></div>

      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={onClear} title="Clear Board"><Trash2 className="w-5 h-5" /></Button>
      <Link to={createPageUrl("Dashboard")}>
        <Button variant="ghost" size="icon" title="Return to Dashboard"><LayoutDashboard className="w-5 h-5" /></Button>
      </Link>
    </div>
  );
}