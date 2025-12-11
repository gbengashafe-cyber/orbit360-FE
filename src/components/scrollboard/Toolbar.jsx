import React from 'react';
import { Button } from '@/components/ui/button';
import { Hand, Type, RectangleHorizontal, Circle, Triangle, ArrowUpRight, Pencil, Eraser, Undo, Redo, Upload, ScreenShare, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

const tools = [
  { id: 'select', icon: Hand, label: 'Select & Pan' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'rectangle', icon: RectangleHorizontal, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'triangle', icon: Triangle, label: 'Triangle' },
  { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  { id: 'draw', icon: Pencil, label: 'Draw' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
];

const colors = ['#000000', '#FF0000', '#0000FF', '#008000', '#FFFF00', '#FFA500', '#FFFFFF'];

export default function Toolbar({ 
    activeTool, 
    onSelectTool, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    onUploadClick, 
    toolSettings, 
    onSettingChange,
    isRecording,
    onToggleRecording,
    onTogglePresentation
}) {
  return (
    <div className="absolute top-1/2 left-4 -translate-y-1/2 bg-white rounded-lg shadow-lg p-2 flex flex-col items-center gap-1 z-50 border">
      <div className="flex flex-col items-center gap-1 border-b pb-2 mb-2">
        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Undo"><Undo className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Redo"><Redo className="h-5 w-5" /></Button>
      </div>

      {tools.map(tool => (
        <Button
          key={tool.id}
          variant="ghost"
          size="icon"
          onClick={() => onSelectTool(tool.id)}
          className={cn('h-10 w-10', activeTool === tool.id && 'bg-blue-100 text-blue-700')}
          title={tool.label}
        >
          <tool.icon className="h-5 w-5" />
        </Button>
      ))}

      <div className="border-t my-2 pt-2 flex flex-col items-center gap-2">
         {['draw', 'rectangle', 'circle', 'triangle', 'arrow'].includes(activeTool) && (
            <div className="flex flex-wrap justify-center gap-1.5 w-14">
                {colors.map(color => (
                    <button key={color} onClick={() => onSettingChange('color', color)} className={cn("w-5 h-5 rounded-full border-2", toolSettings.color === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300', color === '#FFFFFF' && 'border-gray-400')} style={{ backgroundColor: color }} />
                ))}
            </div>
         )}
      </div>

      <div className="flex flex-col items-center gap-1 border-t pt-2 mt-2">
        <Button variant="ghost" size="icon" onClick={onUploadClick} title="Upload from Device"><Upload className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" title="Present (Live)" onClick={onTogglePresentation}><ScreenShare className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" title={isRecording ? "Stop Recording" : "Start Recording"} onClick={onToggleRecording}>
            <Mic className={cn("h-5 w-5", isRecording && "text-red-500 animate-pulse")} />
        </Button>
      </div>
    </div>
  );
}