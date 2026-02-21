
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Scroll } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import Toolbar from '../components/scrollboard/Toolbar';
import ViewControls from '../components/scrollboard/ViewControls';
import ScrollObject from '../components/scrollboard/ScrollObject';
import TextFormatToolbar from '../components/scrollboard/TextFormatToolbar';

const getSvgPathFromStroke = (stroke) => {
  if (!stroke || stroke.length === 0) return "";
  const d = stroke.reduce((acc, [x0, y0], i, arr) => {
    const [x1, y1] = arr[(i + 1) % arr.length];
    acc.push("Q", x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    return acc;
  }, ["M", ...stroke[0]]);
  d.push("Z");
  return d.join(" ");
};

const getPerfectShape = (x1, y1, x2, y2) => {
    const width = Math.abs(x1 - x2);
    const height = Math.abs(y1 - y2);
    const size = Math.max(width, height);
    return {
        x: x1 < x2 ? x1 : x1 - size,
        y: y1 < y2 ? y1 : y1 - size,
        width: size,
        height: size,
    }
}


const useHistory = (initialState) => {
    const [index, setIndex] = useState(0);
    const [history, setHistory] = useState([initialState]);

    const setState = (action, overwrite = false) => {
        const newState = typeof action === 'function' ? action(history[index]) : action;
        if (overwrite) {
            const historyCopy = [...history];
            historyCopy[index] = newState;
            setHistory(historyCopy);
        } else {
            const updatedHistory = history.slice(0, index + 1);
            setHistory([...updatedHistory, newState]);
            setIndex(index + 1);
        }
    };

    const undo = () => index > 0 && setIndex(index - 1);
    const redo = () => index < history.length - 1 && setIndex(index + 1);

    return [history[index], setState, undo, redo, index > 0, index < history.length - 1];
};


// ---------- Main ScrollBoard Component ----------
export default function ScrollBoard() {
  const [scrolls, setScrolls, undo, redo, canUndo, canRedo] = useHistory([]);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState('select');
  const [action, setAction] = useState('none');
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState('light');

  const [toolSettings, setToolSettings] = useState({
      color: '#000000',
      strokeWidth: 2,
      fontSize: 24,
      fontFamily: 'Arial',
      fontWeight: 'normal',
  });

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [presentingStream, setPresentingStream] = useState(null);

  const boardRef = useRef(null);
  const fileInputRef = useRef(null);
  const actionDataRef = useRef({});

  const selectedObject = scrolls.find(s => s.id === selectedObjectId);

  const loadScrolls = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedScrolls = await Scroll.list();
      setScrolls(Array.isArray(fetchedScrolls) ? fetchedScrolls : [], true);
    } catch (error) {
      console.error("Failed to load scrolls:", error);
    } finally {
      setLoading(false);
    }
  }, [setScrolls]);

  useEffect(() => {
    loadScrolls();
  }, []);


  const updateScrollObjectStyle = (id, newStyle) => {
    setScrolls(prev => prev.map(s => {
        if (s.id === id) {
            const updatedScroll = { ...s, style: { ...s.style, ...newStyle } };
            // Debounced update to backend
            const update = async () => {
                await Scroll.update(id, { style: updatedScroll.style });
            };
            setTimeout(update, 500); // Debounce DB update
            return updatedScroll;
        }
        return s;
    }), true);
  };

  const updateScrollObject = (id, updates) => {
    setScrolls(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s), true);
  };
  
  const deleteScrollObject = async (id) => {
    await Scroll.delete(id);
    setScrolls(prev => prev.filter(s => s.id !== id));
  };
  
  const getBoardCoordinates = (e) => {
      if (!boardRef.current) return {x: 0, y: 0};
      const rect = boardRef.current.getBoundingClientRect();
      return {
          x: (e.clientX - rect.left - pan.x) / zoom,
          y: (e.clientY - rect.top - pan.y) / zoom,
      };
  }
  
  const createNewObject = (type, x, y, width = 1, height = 1, content = '', style = {}) => {
      const newObject = {
          id: `temp-${Date.now()}`,
          type, x, y, width, height, content,
          style: { 
              ...toolSettings, 
              color: theme === 'dark' ? '#FFFFFF' : toolSettings.color,
              ...style 
          },
          zIndex: (scrolls?.length || 0) + 1,
      };
      setScrolls(prev => [...(prev || []), newObject]);
      return newObject;
  }

  const createTextObject = async (x, y) => {
    const newObjectData = {
        type: 'text',
        x: x,
        y: y,
        width: 200,
        height: 30, // Start with a smaller height
        content: '',
        style: {
            ...toolSettings,
            color: theme === 'dark' ? '#FFFFFF' : '#000000',
        },
        zIndex: (scrolls?.length || 0) + 1
    };
    const newDbObject = await Scroll.create(newObjectData);
    setScrolls(prev => [...(prev || []), newDbObject], true);
    setSelectedObjectId(newDbObject.id);
    setActiveTool('select');
  };

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    
    const { x, y } = getBoardCoordinates(e);
    actionDataRef.current = { startX: x, startY: y };
    
    // Deselect if clicking on the board itself
    if (e.target === boardRef.current) {
        setSelectedObjectId(null);
    }

    if (activeTool === 'text' && e.target === boardRef.current) {
        createTextObject(x, y);
        return;
    }

    if (activeTool === 'select' && e.target === boardRef.current) {
        setAction('panning');
        actionDataRef.current = { panStartX: pan.x, panStartY: pan.y, clientX: e.clientX, clientY: e.clientY };
    } else if (activeTool === 'eraser') {
        setAction('erasing');
    } else if (e.target === boardRef.current) {
        setAction('drawing');
        const newObject = createNewObject(activeTool, x, y, 1, 1, '', {color: toolSettings.color});
        actionDataRef.current.newObjectId = newObject.id;
    }
  };

  const handlePointerMove = (e) => {
    if (action === 'none') return;
    const { x, y } = getBoardCoordinates(e);
    
    if (action === 'panning') {
        const dx = e.clientX - actionDataRef.current.clientX;
        const dy = e.clientY - actionDataRef.current.clientY;
        setPan({ x: actionDataRef.current.panStartX + dx, y: actionDataRef.current.panStartY + dy });
    } else if (action === 'drawing') {
        const { startX, startY, newObjectId } = actionDataRef.current;
        const newWidth = x - startX;
        const newHeight = y - startY;
        
        let shapeProps = {
            x: newWidth > 0 ? startX : x,
            y: newHeight > 0 ? startY : y,
            width: Math.abs(newWidth),
            height: Math.abs(newHeight),
        };
        
        if (e.shiftKey && ['circle', 'rectangle'].includes(activeTool)) {
            shapeProps = getPerfectShape(startX, startY, x, y);
        }

        if (activeTool === 'draw') {
             setScrolls(prev => prev.map(s => {
                if (s.id !== newObjectId) return s;
                let currentContent;
                try {
                    currentContent = s.content ? JSON.parse(s.content) : { points: [], color: toolSettings.color, strokeWidth: toolSettings.strokeWidth };
                } catch {
                    currentContent = { points: [], color: toolSettings.color, strokeWidth: toolSettings.strokeWidth };
                }
                
                const newPoints = [...(currentContent.points || []), [x,y]];
                
                const minX = Math.min(...newPoints.map(p => p[0]));
                const minY = Math.min(...newPoints.map(p => p[1]));
                const maxX = Math.max(...newPoints.map(p => p[0]));
                const maxY = Math.max(...newPoints.map(p => p[1]));

                return {
                    ...s,
                    x: minX, y: minY,
                    width: maxX - minX, height: maxY - minY,
                    content: JSON.stringify({ 
                      d: getSvgPathFromStroke(newPoints.map(p => [p[0] - minX, p[1] - minY])),
                      color: currentContent.color,
                      strokeWidth: currentContent.strokeWidth,
                    })
                };
             }), true);

        } else {
             updateScrollObject(newObjectId, shapeProps);
        }

    } else if (action === 'moving') {
        const { startX, startY, objStartX, objStartY } = actionDataRef.current;
        const dx = (x - startX);
        const dy = (y - startY);
        updateScrollObject(selectedObjectId, { x: objStartX + dx, y: objStartY + dy });
    } else if (action === 'resizing') {
        const { obj, corner } = actionDataRef.current;
        let { x: objX, y: objY, width, height } = obj;

        if (corner.includes('r')) width = x - objX;
        if (corner.includes('l')) { width = objX + width - x; objX = x; }
        if (corner.includes('b')) height = y - objY;
        if (corner.includes('t')) { height = objY + height - y; objY = y; }
        
        if (width > 5 && height > 5) {
            updateScrollObject(selectedObjectId, { x: objX, y: objY, width, height });
        }
    } else if (action === 'erasing') {
        setScrolls(prev => prev.filter(s => {
            const isColliding = x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height;
            if(isColliding) Scroll.delete(s.id);
            return !isColliding;
        }));
    }
  };

  const handlePointerUp = async () => {
    if (action === 'drawing' && actionDataRef.current.newObjectId) {
        const object = scrolls.find(s => s.id === actionDataRef.current.newObjectId);
        if (object) {
            const { id, ...dataToSave } = object;
            if (dataToSave.type === 'draw' && (!dataToSave.content || JSON.parse(dataToSave.content).d === "")) { // Check for empty path
                setScrolls(prev => prev.filter(s => s.id !== id));
            } else {
                const newDbObject = await Scroll.create(dataToSave);
                setScrolls(prev => prev.map(s => s.id === id ? newDbObject : s));
            }
        }
    } else if (action === 'moving' || action === 'resizing') {
        const object = scrolls.find(s => s.id === selectedObjectId);
        if (object) {
            await Scroll.update(object.id, { x: object.x, y: object.y, width: object.width, height: object.height });
        }
    }
    setAction('none');
    actionDataRef.current = {};
  };

  const handleZoom = (direction) => {
      const zoomFactor = 1.2;
      const newZoom = direction === 'in' ? Math.min(zoom * zoomFactor, 5) : Math.max(zoom / zoomFactor, 0.1);
      setZoom(newZoom);
  };
  
  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear the entire board?")) {
        await Promise.all(scrolls.map(s => Scroll.delete(s.id)));
        setScrolls([]);
    }
  };
  
  const handleFullScreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
      } else {
          document.exitFullscreen();
      }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const { file_url } = await UploadFile({ file });
        // Calculate center of the current view
        const boardRect = boardRef.current.getBoundingClientRect();
        const centerX = (boardRect.width / 2 - pan.x) / zoom;
        const centerY = (boardRect.height / 2 - pan.y) / zoom;

        const newImage = createNewObject('image', centerX - 150, centerY - 100, 300, 200, file_url);
        const { id, ...dataToSave } = newImage;
        const newDbObject = await Scroll.create(dataToSave);
        setScrolls(prev => prev.map(s => s.id === id ? newDbObject : s));
    } catch (error) {
        console.error("Image upload failed", error);
    }
  };
  
  const handleDragStart = (e, id) => {
      if(activeTool !== 'select') return;
      setAction('moving');
      setSelectedObjectId(id);
      const { x, y } = getBoardCoordinates(e);
      const object = scrolls.find(s => s.id === id);
      actionDataRef.current = { startX: x, startY: y, objStartX: object.x, objStartY: object.y };
  };

  const handleResizeStart = (e, id, corner) => {
      e.stopPropagation();
      setAction('resizing');
      setSelectedObjectId(id);
      const object = scrolls.find(s => s.id === id);
      actionDataRef.current = { obj: object, corner };
  };

  // --- Presentation and Recording Handlers ---
  const handleTogglePresentation = async () => {
      if (presentingStream) {
          presentingStream.getTracks().forEach(track => track.stop());
          setPresentingStream(null);
      } else {
          try {
              const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
              setPresentingStream(stream);
              stream.getVideoTracks()[0].onended = () => {
                  setPresentingStream(null); // Stop when browser UI's stop button is clicked
              };
          } catch (err) {
              console.error("Error starting presentation:", err);
              alert("Could not start screen sharing. Please ensure you have granted permissions.");
          }
      }
  };

  const handleToggleRecording = async () => {
      if (isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              mediaRecorderRef.current = new MediaRecorder(stream);
              audioChunksRef.current = [];
              
              mediaRecorderRef.current.ondataavailable = (event) => {
                  audioChunksRef.current.push(event.data);
              };
              
              mediaRecorderRef.current.onstop = () => {
                  const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
                  const audioUrl = URL.createObjectURL(audioBlob);
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = audioUrl;
                  a.download = `scrollboard-recording-${new Date().toISOString()}.wav`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(audioUrl);
                  stream.getTracks().forEach(track => track.stop()); // Stop mic access
              };
              
              mediaRecorderRef.current.start();
              setIsRecording(true);
          } catch (err) {
              console.error("Error starting recording:", err);
              alert("Could not start recording. Please ensure you have granted microphone permissions.");
          }
      }
  };
  
  if (presentingStream) {
    return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-center">
            <video 
                ref={video => { if (video) video.srcObject = presentingStream; }} 
                autoPlay 
                className="max-w-full max-h-[90vh]"
            />
            <Button onClick={handleTogglePresentation} className="mt-4">Stop Presenting</Button>
        </div>
    );
  }

  return (
    <div className={cn("h-screen w-full flex flex-col overflow-hidden transition-colors", theme === 'dark' ? 'bg-gray-900' : 'bg-white')}>
      <Toolbar 
        activeTool={activeTool} 
        onSelectTool={setActiveTool}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onUploadClick={() => fileInputRef.current?.click()}
        toolSettings={toolSettings}
        onSettingChange={(key, value) => setToolSettings(prev => ({...prev, [key]: value}))}
        isRecording={isRecording}
        onToggleRecording={handleToggleRecording}
        onTogglePresentation={handleTogglePresentation}
      />
      
      {selectedObject?.type === 'text' && (
        <TextFormatToolbar
            object={selectedObject}
            onStyleChange={(style) => updateScrollObjectStyle(selectedObjectId, style)}
            theme={theme}
        />
      )}
      
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

      {loading ? (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className={cn("w-8 h-8 animate-spin", theme === 'dark' ? 'text-white' : 'text-purple-700')} />
        </div>
      ) : (
        <div
          ref={boardRef}
          className="flex-grow w-full h-full relative overflow-hidden"
          style={{ cursor: activeTool === 'select' ? 'grab' : (activeTool === 'text' ? 'text' : 'crosshair') }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={(e) => { e.preventDefault(); handleZoom(e.deltaY > 0 ? 'out' : 'in'); }}
        >
          <div
            className="absolute top-0 left-0"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
          >
            {scrolls?.map(scroll => (
              <ScrollObject 
                key={scroll.id} 
                object={scroll} 
                onUpdate={updateScrollObject}
                onDelete={deleteScrollObject}
                isSelected={selectedObjectId === scroll.id}
                onSelect={(id) => { setSelectedObjectId(id); setActiveTool('select'); }}
                onResize={handleResizeStart}
                onDragStart={handleDragStart}
                theme={theme}
              />
            ))}
          </div>
        </div>
      )}

      <ViewControls 
        zoom={zoom}
        onZoom={handleZoom}
        onReset={() => { setPan({x:0, y:0}); setZoom(1); }}
        onClear={handleClear}
        onFullScreen={handleFullScreen}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
      />
    </div>
  );
}
