
import React, { useState, useEffect, useRef } from 'react';
import { Scroll } from '@/api/entities';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to draw shapes
const renderShape = (object, theme) => {
    const { type, width, height, style } = object;
    const defaultColor = theme === 'dark' ? '#FFFFFF' : '#000000';
    const color = style?.color || defaultColor;
    const strokeWidth = style?.strokeWidth || 2;
    const fill = style?.fill || 'transparent';

    switch (type) {
        case 'rectangle':
            return <rect x={strokeWidth/2} y={strokeWidth/2} width={width - strokeWidth} height={height - strokeWidth} rx="3" fill={fill} stroke={color} strokeWidth={strokeWidth} />;
        case 'circle':
            return <circle cx={width/2} cy={height/2} r={Math.min(width, height)/2 - strokeWidth/2} fill={fill} stroke={color} strokeWidth={strokeWidth} />;
        case 'triangle':
            const points = `${width/2},${strokeWidth} ${strokeWidth},${height-strokeWidth} ${width-strokeWidth},${height-strokeWidth}`;
            return <polygon points={points} fill={fill} stroke={color} strokeWidth={strokeWidth} />;
        case 'arrow':
             const arrowPoints = `M${strokeWidth*2},${height/2} L${width - strokeWidth*2},${height/2} M${width - strokeWidth*3},${height/2 - height/4} L${width - strokeWidth},${height/2} L${width - strokeWidth*3},${height/2 + height/4}`;
            return <path d={arrowPoints} stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" />;
        default:
            return null;
    }
}

export default function ScrollObject({ object, onUpdate, onDelete, isSelected, onSelect, onResize, onDragStart, theme }) {
  const [content, setContent] = useState(object.content);
  const ref = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setContent(object.content);
  }, [object.content]);

  useEffect(() => {
    if (isSelected && object.type === 'text' && textareaRef.current) {
        textareaRef.current.focus();
        // Auto-resize on select
        autoResizeTextarea();
    }
  }, [isSelected, object.type]);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      const newHeight = textareaRef.current.scrollHeight;
      if (object.height !== newHeight) {
          onUpdate(object.id, { height: newHeight });
      }
    }
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    onSelect(object.id);
    onDragStart(e, object.id);
  };
  
  const handleContentChange = (e) => {
    setContent(e.target.value);
    autoResizeTextarea();
    onUpdate(object.id, { content: e.target.value });
  };
  
  const handleContentBlur = () => {
    Scroll.update(object.id, { content });
  };
  
  const handleResizePointerDown = (e, corner) => {
      e.stopPropagation();
      onResize(e, object.id, corner);
  }

  const renderObjectContent = () => {
    const defaultTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';
    const style = object.style || {};

    switch (object.type) {
      case 'text':
        return (
          <textarea
            ref={textareaRef}
            className="w-full h-full p-1 bg-transparent outline-none resize-none overflow-hidden"
            style={{ 
              color: style.color || defaultTextColor,
              fontSize: `${style.fontSize || 24}px`,
              fontFamily: style.fontFamily || 'Arial',
              fontWeight: style.fontWeight || 'normal',
            }}
            value={content}
            onChange={handleContentChange}
            onBlur={handleContentBlur}
            onInput={autoResizeTextarea}
            placeholder={isSelected ? "" : " "}
          />
        );
      case 'image':
        return <img src={object.content} alt="Uploaded content" className="w-full h-full object-contain" />;
      case 'draw':
        try {
            if (!object.content) return null;
            const pathData = JSON.parse(object.content);
            const pathColor = pathData.color || (theme === 'dark' ? '#FFFFFF' : '#000000');
            return (
                <svg viewBox={`0 0 ${object.width} ${object.height}`} className="w-full h-full" style={{pointerEvents: 'none'}}>
                    <path d={pathData.d} stroke={pathColor} strokeWidth={pathData.strokeWidth} fill="transparent" />
                </svg>
            );
        } catch (error) {
            console.error("Error parsing draw content:", error);
            return null;
        }
      default:
        return (
            <svg viewBox={`0 0 ${object.width} ${object.height}`} className="w-full h-full" style={{pointerEvents: 'none'}}>
                {renderShape(object, theme)}
            </svg>
        );
    }
  };

  const resizeHandles = ['tl', 'tr', 'bl', 'br'];

  return (
    <div
      ref={ref}
      onPointerDown={handlePointerDown}
      className={cn(
        "absolute transform-gpu flex items-center justify-center",
        isSelected && "ring-2 ring-blue-500 ring-offset-2 z-50",
        object.type === 'text' ? 'border border-transparent hover:border-gray-300' : 'hover:ring-1 hover:ring-blue-300'
      )}
      style={{
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        zIndex: object.zIndex,
        touchAction: 'none',
      }}
    >
      {isSelected && (
          <>
            <button
              className="absolute -top-3 -right-3 bg-white rounded-full p-0.5 border shadow-md z-[60] text-red-500 hover:bg-red-50"
              onPointerDown={(e) => { e.stopPropagation(); onDelete(object.id); }}
            >
              <X className="w-4 h-4" />
            </button>
            {resizeHandles.map(corner => (
                <div 
                    key={corner}
                    className={`absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full z-[70] 
                    ${corner.includes('t') ? '-top-1.5' : '-bottom-1.5'} 
                    ${corner.includes('l') ? '-left-1.5' : '-right-1.5'}`}
                    style={{ cursor: 'nwse-resize' }}
                    onPointerDown={(e) => handleResizePointerDown(e, corner)}
                />
            ))}
          </>
      )}
       {renderObjectContent()}
    </div>
  );
}
