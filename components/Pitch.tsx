import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ItemType, TacticalItem, Position, LineType, TacticalLine, PitchType } from '../types';
import { ITEM_CONFIG, LINE_CONFIG } from '../constants';
import { RotateCw, Trash2, Move } from 'lucide-react';

interface PitchProps {
  items: TacticalItem[];
  setItems: React.Dispatch<React.SetStateAction<TacticalItem[]>>;
  lines: TacticalLine[];
  setLines: React.Dispatch<React.SetStateAction<TacticalLine[]>>;
  selection: { type: 'item' | 'line'; id: string } | null;
  setSelection: (sel: { type: 'item' | 'line'; id: string } | null) => void;
  activeTool: 'cursor' | LineType;
  pitchType: PitchType;
  onActionComplete: () => void;
}

const Pitch: React.FC<PitchProps> = ({ 
  items, 
  setItems, 
  lines, 
  setLines, 
  selection, 
  setSelection,
  activeTool,
  pitchType,
  onActionComplete
}) => {
  const pitchRef = useRef<HTMLDivElement>(null);
  
  // Consolidated Drag State
  const [dragState, setDragState] = useState<{
    mode: 'item' | 'line_whole' | 'line_start' | 'line_end';
    id: string; // Item or Line ID
    startX: number; // Client X
    startY: number; // Client Y
    // Store initial data to calculate deltas
    initialPos?: Position; 
    initialLine?: { start: Position; end: Position };
    hasMoved?: boolean;
  } | null>(null);

  const [drawingLine, setDrawingLine] = useState<{ start: Position; end: Position; type: LineType } | null>(null);

  // Helper to convert mouse/touch event to percentage coordinates
  const getCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!pitchRef.current) return { x: 50, y: 50 };
    const rect = pitchRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    };
  }, []);

  // --- POINTER DOWN HANDLERS ---

  const handleItemPointerDown = (e: React.PointerEvent, id: string, currentPos: Position) => {
    if (activeTool !== 'cursor') return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    setSelection({ type: 'item', id });
    setDragState({
      mode: 'item',
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialPos: currentPos,
      hasMoved: false
    });
  };

  const handleLinePointerDown = (e: React.PointerEvent, id: string, line: TacticalLine) => {
    if (activeTool !== 'cursor') return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    setSelection({ type: 'line', id });
    setDragState({
      mode: 'line_whole',
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialLine: { start: line.start, end: line.end },
      hasMoved: false
    });
  };

  const handleLineHandleDown = (e: React.PointerEvent, id: string, type: 'start' | 'end') => {
    if (activeTool !== 'cursor') return;
    e.stopPropagation(); // Critical: Stop it from starting a "new line draw" via pitch click
    e.currentTarget.setPointerCapture(e.pointerId);
    // Note: We don't necessarily need to select the line when dragging a handle, but it helps visualize
    setSelection({ type: 'line', id }); 
    setDragState({
      mode: type === 'start' ? 'line_start' : 'line_end',
      id,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false
    });
  };

  // --- POINTER MOVE ---

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pitchRef.current) return;

    // 1. Drawing a new line
    if (activeTool !== 'cursor' && drawingLine) {
      e.preventDefault();
      const coords = getCoordinates(e.clientX, e.clientY);
      setDrawingLine(prev => prev ? { ...prev, end: coords } : null);
      return;
    }

    // 2. Dragging something
    if (dragState) {
      e.preventDefault();
      setDragState(prev => prev ? { ...prev, hasMoved: true } : null);

      const rect = pitchRef.current.getBoundingClientRect();
      const coords = getCoordinates(e.clientX, e.clientY);

      // Delta percentages
      const deltaX = ((e.clientX - dragState.startX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragState.startY) / rect.height) * 100;

      if (dragState.mode === 'item' && dragState.initialPos) {
        const newX = Math.max(0, Math.min(100, dragState.initialPos.x + deltaX));
        const newY = Math.max(0, Math.min(100, dragState.initialPos.y + deltaY));
        setItems(prev => prev.map(item => 
          item.id === dragState.id ? { ...item, pos: { x: newX, y: newY } } : item
        ));
      } else if (dragState.mode === 'line_whole' && dragState.initialLine) {
        // Move entire line
        const newStartX = Math.max(0, Math.min(100, dragState.initialLine.start.x + deltaX));
        const newStartY = Math.max(0, Math.min(100, dragState.initialLine.start.y + deltaY));
        const newEndX = Math.max(0, Math.min(100, dragState.initialLine.end.x + deltaX));
        const newEndY = Math.max(0, Math.min(100, dragState.initialLine.end.y + deltaY));
        
        setLines(prev => prev.map(line =>
          line.id === dragState.id ? { 
            ...line, 
            start: { x: newStartX, y: newStartY },
            end: { x: newEndX, y: newEndY }
          } : line
        ));
      } else if (dragState.mode === 'line_start') {
        setLines(prev => prev.map(line =>
          line.id === dragState.id ? { ...line, start: coords } : line
        ));
      } else if (dragState.mode === 'line_end') {
        setLines(prev => prev.map(line =>
          line.id === dragState.id ? { ...line, end: coords } : line
        ));
      }
    }
  };

  // --- POINTER UP ---

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragState) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      // Only save history if actual movement occurred
      if (dragState.hasMoved) {
        onActionComplete();
      }
      setDragState(null);
    }

    if (activeTool !== 'cursor' && drawingLine) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      const dist = Math.sqrt(
        Math.pow(drawingLine.start.x - drawingLine.end.x, 2) + 
        Math.pow(drawingLine.start.y - drawingLine.end.y, 2)
      );
      
      if (dist > 2) {
        const newLine: TacticalLine = {
          id: Math.random().toString(36).substr(2, 9),
          type: drawingLine.type,
          start: drawingLine.start,
          end: drawingLine.end
        };
        // Update lines immediately then save history
        setLines(prev => {
          const next = [...prev, newLine];
          return next;
        });
        setSelection({ type: 'line', id: newLine.id });
        
        // Timeout to allow state to settle in App before saving history snapshot
        setTimeout(onActionComplete, 0);
      }
      setDrawingLine(null);
    }
  };

  const handlePitchDown = (e: React.PointerEvent) => {
    if (activeTool !== 'cursor') {
      // Start Drawing
      e.currentTarget.setPointerCapture(e.pointerId);
      const coords = getCoordinates(e.clientX, e.clientY);
      setDrawingLine({
        start: coords,
        end: coords,
        type: activeTool
      });
      setSelection(null); 
    } else {
      // Clicked on empty space - deselect
      setSelection(null);
    }
  };

  // --- ACTIONS ---

  const handleRotate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop click propagation
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, rotation: (item.rotation + 45) % 360 } : item
    ));
    setTimeout(onActionComplete, 0);
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop click propagation
    setItems(prev => prev.filter(item => item.id !== id));
    setSelection(null);
    setTimeout(onActionComplete, 0);
  };

  const handleDeleteLine = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stop click propagation
    setLines(prev => prev.filter(line => line.id !== id));
    setSelection(null);
    setTimeout(onActionComplete, 0);
  };

  const renderPitchMarkings = () => {
    if (pitchType === PitchType.EMPTY) return null;

    if (pitchType === PitchType.HALF) {
      // GOAL AT BOTTOM
      return (
        <div className="absolute inset-4 border-2 border-white/60 pointer-events-none z-0">
          
          {/* Center Circle (Top Center) */}
          <div className="absolute top-0 left-1/2 w-[27%] aspect-square border-2 border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Penalty Box (Bottom Center) */}
          <div className="absolute bottom-0 left-1/2 w-[60%] h-[32%] border-2 border-b-0 border-white/60 -translate-x-1/2 bg-white/5"></div>
          
          {/* Goal Area (Small Box) */}
          <div className="absolute bottom-0 left-1/2 w-[27%] h-[11%] border-2 border-b-0 border-white/60 -translate-x-1/2"></div>
          
          {/* Penalty Spot (11m from goal line, pitch height 52.5m -> ~21%) */}
          <div className="absolute bottom-[21%] left-1/2 w-1.5 h-1.5 bg-white/80 rounded-full -translate-x-1/2 translate-y-1/2"></div>
          
          {/* D-Arc (Radius 9.15m centered on spot) */}
          {/* We use a circle centered on spot, and clip the bottom 75% so only the top arc shows above the box */}
          <div className="absolute bottom-[21%] left-1/2 w-[27%] aspect-square border-2 border-white/60 rounded-full -translate-x-1/2 translate-y-1/2 clip-arc-top"></div>
          
          {/* Corners */}
          <div className="absolute bottom-0 left-0 w-[2%] aspect-square border-t-2 border-r-2 border-white/60 rounded-tr-full"></div>
          <div className="absolute bottom-0 right-0 w-[2%] aspect-square border-t-2 border-l-2 border-white/60 rounded-tl-full"></div>
        </div>
      );
    }

    if (pitchType === PitchType.BOX) {
      // GOAL AT BOTTOM, FOCUSED AREA
      return (
        <div className="absolute inset-4 pointer-events-none z-0 border-2 border-white/60">
          
          {/* Penalty Box (Bottom Center) - Dimensions relative to ~45m depth */}
          {/* 16.5m / 45m = 36% */}
          <div className="absolute bottom-0 left-1/2 w-[60%] h-[37%] border-2 border-b-0 border-white/60 -translate-x-1/2 bg-white/5"></div>
          
          {/* Goal Area (Small Box) - 5.5m / 45m = 12% */}
          <div className="absolute bottom-0 left-1/2 w-[27%] h-[12%] border-2 border-b-0 border-white/60 -translate-x-1/2"></div>
          
          {/* Penalty Spot - 11m / 45m = 24.4% */}
          <div className="absolute bottom-[24%] left-1/2 w-2 h-2 bg-white/80 rounded-full -translate-x-1/2 translate-y-1/2"></div>
          
          {/* D-Arc */}
          <div className="absolute bottom-[24%] left-1/2 w-[27%] aspect-square border-2 border-white/60 rounded-full -translate-x-1/2 translate-y-1/2 clip-arc-top"></div>
        </div>
      );
    }

    // Default: FULL (Goal Left/Right)
    return (
      <div className="absolute inset-4 border-2 border-white/60 pointer-events-none z-0">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/60 -translate-x-1/2"></div>
        <div className="absolute left-1/2 top-1/2 w-[20%] aspect-square border-2 border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute left-0 top-1/2 w-[16%] h-[40%] border-r-2 border-y-2 border-white/60 -translate-y-1/2 bg-white/5"></div>
        <div className="absolute left-0 top-1/2 w-[6%] h-[18%] border-r-2 border-y-2 border-white/60 -translate-y-1/2"></div>
        <div className="absolute right-0 top-1/2 w-[16%] h-[40%] border-l-2 border-y-2 border-white/60 -translate-y-1/2 bg-white/5"></div>
        <div className="absolute right-0 top-1/2 w-[6%] h-[18%] border-l-2 border-y-2 border-white/60 -translate-y-1/2"></div>
        <div className="absolute left-0 top-0 w-[2%] aspect-square border-r-2 border-b-2 border-white/60 rounded-br-full"></div>
        <div className="absolute right-0 top-0 w-[2%] aspect-square border-l-2 border-b-2 border-white/60 rounded-bl-full"></div>
        <div className="absolute left-0 bottom-0 w-[2%] aspect-square border-r-2 border-t-2 border-white/60 rounded-tr-full"></div>
        <div className="absolute right-0 bottom-0 w-[2%] aspect-square border-l-2 border-t-2 border-white/60 rounded-tl-full"></div>
      </div>
    );
  };

  return (
    <div className="w-full h-full p-4 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      {/* 
         We override the Tailwind class with inline style for custom aspect ratios derived from prop 
         if needed, but for simplicity we use the closest tailwind class or style.
      */}
      <div 
        ref={pitchRef}
        onPointerDown={handlePitchDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative w-full max-w-5xl bg-pitch-grass shadow-2xl rounded-lg overflow-hidden border-4 border-white/20 select-none ${activeTool !== 'cursor' ? 'cursor-crosshair' : ''}`}
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              #15803d 0,
              #15803d 5%,
              #166534 5%,
              #166534 10%
            )
          `,
          aspectRatio: pitchType === PitchType.HALF ? '1.29' : pitchType === PitchType.BOX ? '1.51' : '1.5'
        }}
      >
        <style>{`
          .clip-half-left { clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%); }
          .clip-arc-right { clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%); }
          .clip-arc-top { clip-path: inset(0 0 78% 0); } /* Adjusted to show only top ~22% */
        `}</style>
        
        {renderPitchMarkings()}

        {/* SVG Layer for Lines */}
        <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <marker id="arrow-movement" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
              <path d="M0,0 L4,2 L0,4" fill={LINE_CONFIG[LineType.MOVEMENT].color} />
            </marker>
            <marker id="arrow-pass" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
              <path d="M0,0 L4,2 L0,4" fill={LINE_CONFIG[LineType.PASS].color} />
            </marker>
            <marker id="arrow-dribble" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
              <path d="M0,0 L4,2 L0,4" fill={LINE_CONFIG[LineType.DRIBBLE].color} />
            </marker>
          </defs>

          {lines.map(line => {
             const config = LINE_CONFIG[line.type];
             const markerId = `arrow-${line.type === LineType.MOVEMENT ? 'movement' : line.type === LineType.PASS ? 'pass' : 'dribble'}`;
             const isSelected = selection?.type === 'line' && selection.id === line.id;

             return (
               <g key={line.id} className="pointer-events-auto">
                  {/* Invisible wide stroke for selection/dragging - 10px wide relative to 100x100 viewbox is huge, so we use smaller but enough */}
                  <line 
                    x1={line.start.x} y1={line.start.y} 
                    x2={line.end.x} y2={line.end.y} 
                    stroke="transparent" 
                    strokeWidth="8"
                    className={activeTool === 'cursor' ? "cursor-move" : ""}
                    onPointerDown={(e) => handleLinePointerDown(e, line.id, line)}
                  />
                  
                  {/* Visible Line */}
                  <line 
                    x1={line.start.x} y1={line.start.y} 
                    x2={line.end.x} y2={line.end.y} 
                    stroke={isSelected ? '#3b82f6' : config.color} 
                    strokeWidth={isSelected ? (config.strokeWidth / 3) + 0.2 : config.strokeWidth / 3}
                    strokeDasharray={config.dashArray}
                    markerEnd={`url(#${markerId})`}
                    className="transition-colors pointer-events-none" // Events handled by transparent line
                  />
                  
                  {/* Invisible Handles (visible hit area only) */}
                  {isSelected && (
                    <>
                      {/* Start Handle */}
                      <circle 
                        cx={line.start.x} cy={line.start.y} r="3" 
                        fill="transparent" stroke="none"
                        className="cursor-move pointer-events-auto"
                        onPointerDown={(e) => handleLineHandleDown(e, line.id, 'start')}
                      />
                      {/* End Handle */}
                      <circle 
                        cx={line.end.x} cy={line.end.y} r="3" 
                        fill="transparent" stroke="none"
                        className="cursor-move pointer-events-auto"
                        onPointerDown={(e) => handleLineHandleDown(e, line.id, 'end')}
                      />
                    </>
                  )}
               </g>
             );
          })}

          {drawingLine && (
            <line 
              x1={drawingLine.start.x} y1={drawingLine.start.y} 
              x2={drawingLine.end.x} y2={drawingLine.end.y} 
              stroke={LINE_CONFIG[drawingLine.type].color} 
              strokeWidth={LINE_CONFIG[drawingLine.type].strokeWidth / 3}
              strokeDasharray={LINE_CONFIG[drawingLine.type].dashArray}
              markerEnd={`url(#arrow-${drawingLine.type.toLowerCase()})`}
              opacity={0.7}
            />
          )}
        </svg>

        {/* Selected Line Context Menu (Rendered via HTML absolute pos) */}
        {selection?.type === 'line' && activeTool === 'cursor' && (
          (() => {
            const line = lines.find(l => l.id === selection.id);
            if (!line) return null;
            // Position near the center of the line
            const centerX = (line.start.x + line.end.x) / 2;
            const centerY = (line.start.y + line.end.y) / 2;
            
            return (
              <div 
                className="absolute z-50 flex gap-1 bg-gray-800 rounded-lg p-1 shadow-lg pointer-events-auto"
                style={{
                  left: `${centerX}%`,
                  top: `${centerY}%`,
                  transform: 'translate(-50%, -150%)'
                }}
                onPointerDown={(e) => e.stopPropagation()} // Prevent deselection
              >
                <button 
                  onClick={(e) => handleDeleteLine(e, line.id)} 
                  className="p-1 hover:bg-red-900 rounded text-red-400"
                  title="Delete Line"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })()
        )}

        {/* Items */}
        {items.map(item => {
          // Cast config to allow width/height access if typescript is strict, though standard JS access works in TS with implicit any or flexible types
          const config = ITEM_CONFIG[item.type] as any; 
          const isSelected = selection?.type === 'item' && selection.id === item.id;
          const Icon = config.icon;

          const width = config.width || config.defaultSize;
          const height = config.height || config.defaultSize;

          return (
            <div
              key={item.id}
              onPointerDown={(e) => handleItemPointerDown(e, item.id, item.pos)}
              className={`absolute flex flex-col items-center justify-center touch-none transition-transform ${isSelected ? 'z-50' : 'z-20'} ${activeTool === 'cursor' ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
              style={{
                left: `${item.pos.x}%`,
                top: `${item.pos.y}%`,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${isSelected ? 1.1 : 1})`,
                width: `${width}px`,
                height: `${height}px`,
              }}
            >
              {/* Context Menu for Selected Item */}
              {isSelected && activeTool === 'cursor' && (
                <div 
                  className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 bg-gray-800 rounded-lg p-1 shadow-lg pointer-events-auto z-50"
                  style={{ transform: `translateX(-50%) rotate(${-item.rotation}deg)` }} // Counter-rotate controls
                  onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on menu click
                >
                  <button onClick={(e) => handleRotate(e, item.id)} className="p-1 hover:bg-gray-700 rounded text-white" title="Rotate">
                    <RotateCw size={14} />
                  </button>
                  <button onClick={(e) => handleDeleteItem(e, item.id)} className="p-1 hover:bg-red-900 rounded text-red-400" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {item.type === ItemType.LADDER ? (
                // Custom Ladder Visual
                <svg width="100%" height="100%" viewBox="0 0 30 120" preserveAspectRatio="none" className="drop-shadow-sm">
                  {/* Side Straps */}
                  <line x1="2" y1="0" x2="2" y2="120" stroke="#000" strokeWidth="2" opacity="0.6" />
                  <line x1="28" y1="0" x2="28" y2="120" stroke="#000" strokeWidth="2" opacity="0.6" />
                  {/* Rungs - roughly every 20px */}
                  <rect x="0" y="0" width="30" height="4" fill="#facc15" />
                  <rect x="0" y="20" width="30" height="4" fill="#facc15" />
                  <rect x="0" y="40" width="30" height="4" fill="#facc15" />
                  <rect x="0" y="60" width="30" height="4" fill="#facc15" />
                  <rect x="0" y="80" width="30" height="4" fill="#facc15" />
                  <rect x="0" y="100" width="30" height="4" fill="#facc15" />
                  <rect x="0" y="116" width="30" height="4" fill="#facc15" />
                </svg>
              ) : (
                <div className={`w-full h-full flex items-center justify-center rounded-full shadow-md ${config.color} ${config.textColor}`}>
                  {item.type === ItemType.GOAL ? (
                    <Icon size={config.defaultSize} strokeWidth={1} />
                  ) : (
                    <Icon size={config.defaultSize * 0.6} />
                  )}
                </div>
              )}
              
              {/* Label */}
              {item.label && (
                <span className="absolute -bottom-6 text-xs font-bold text-white bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm whitespace-nowrap shadow-sm pointer-events-none"
                  style={{ transform: `rotate(${-item.rotation}deg)` }}
                >
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pitch;