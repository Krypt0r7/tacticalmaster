import React, { useState, useEffect, useCallback } from 'react';
import { 
  Save, 
  FolderOpen, 
  Sparkles, 
  Layout,
  Menu,
  Download,
  MousePointer2,
  MoveUpRight,
  ArrowRight,
  Waves,
  Edit3,
  Trash2,
  Undo2,
  Redo2,
  RotateCcw,
  Settings2,
  X
} from 'lucide-react';
import Pitch from './components/Pitch';
import AICoach from './components/AICoach';
import { TacticalItem, ItemType, SavedTactic, LineType, TacticalLine, PitchType } from './types';
import { ITEM_CONFIG } from './constants';
import * as htmlToImage from 'html-to-image';

// Define selection type locally or import if moved to types
export type SelectionState = { type: 'item' | 'line'; id: string } | null;

interface HistoryState {
  items: TacticalItem[];
  lines: TacticalLine[];
  pitchType: PitchType;
}

function App() {
  // Current State
  const [items, setItems] = useState<TacticalItem[]>([]);
  const [lines, setLines] = useState<TacticalLine[]>([]);
  const [pitchType, setPitchType] = useState<PitchType>(PitchType.FULL);
  const [selection, setSelection] = useState<SelectionState>(null);
  
  // History State
  const [history, setHistory] = useState<HistoryState[]>([{ items: [], lines: [], pitchType: PitchType.FULL }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [activeTool, setActiveTool] = useState<'cursor' | LineType>('cursor');
  const [showAICoach, setShowAICoach] = useState(false);
  const [savedTactics, setSavedTactics] = useState<SavedTactic[]>([]);
  const [currentTacticName, setCurrentTacticName] = useState('New Session');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(true);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('tacticalMaster_saves');
    if (stored) {
      setSavedTactics(JSON.parse(stored));
    }
    // If we have no items, show setup. If we restored a state (not implemented here but hypothetical), we might hide it.
    // Since we start fresh, modal is true by default.
  }, []);

  // --- History Management ---

  const saveToHistory = useCallback(() => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ items, lines, pitchType });
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [items, lines, pitchType, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevState = history[prevIndex];
      setItems(prevState.items);
      setLines(prevState.lines);
      setPitchType(prevState.pitchType);
      setHistoryIndex(prevIndex);
      setSelection(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextState = history[nextIndex];
      setItems(nextState.items);
      setLines(nextState.lines);
      setPitchType(nextState.pitchType);
      setHistoryIndex(nextIndex);
      setSelection(null);
    }
  };

  const resetBoard = () => {
    if (confirm('Are you sure you want to clear the board?')) {
      setItems([]);
      setLines([]);
      setSelection(null);
      // Keep current pitch type or reset? Let's keep current.
      setTimeout(() => {
         setHistory(prev => [...prev.slice(0, historyIndex + 1), { items: [], lines: [], pitchType }]);
         setHistoryIndex(prev => prev + 1);
         setShowSetupModal(true); // Re-open setup on full reset
      }, 0);
    }
  };

  const changePitchType = (type: PitchType) => {
    setPitchType(type);
    setShowSetupModal(false);
    // Push to history immediately when changing background
    // We need to use the functional update to ensure we use the LATEST state
    // But since setPitchType is async, we can't just call saveToHistory immediately with the new value from closure
    // So we manually construct the history entry
    setHistory(prev => {
       const newHistory = prev.slice(0, historyIndex + 1);
       newHistory.push({ items, lines, pitchType: type });
       return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  };

  // --- Actions ---

  const addItem = (type: ItemType) => {
    const newItem: TacticalItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      pos: { x: 50, y: 50 }, // Center
      rotation: 0,
      label: type === ItemType.PLAYER_HOME ? '1' : type === ItemType.PLAYER_AWAY ? '1' : undefined,
      text: type === ItemType.NOTE ? '' : undefined
    };
    
    // State update
    const newItems = [...items, newItem];
    setItems(newItems);
    setSelection({ type: 'item', id: newItem.id });
    setActiveTool('cursor');
    
    // History update
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ items: newItems, lines, pitchType });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length);
  };

  const saveTactic = () => {
    const newSave: SavedTactic = {
      id: Math.random().toString(36).substr(2, 9),
      name: currentTacticName,
      createdAt: Date.now(),
      items: items,
      lines: lines,
      pitchType: pitchType
    };
    const existingIndex = savedTactics.findIndex(t => t.name === currentTacticName);
    let updated;
    if (existingIndex >= 0) {
        updated = [...savedTactics];
        updated[existingIndex] = newSave;
    } else {
        updated = [...savedTactics, newSave];
    }
    
    setSavedTactics(updated);
    localStorage.setItem('tacticalMaster_saves', JSON.stringify(updated));
    alert('Session saved!');
  };

  const loadTactic = (tactic: SavedTactic) => {
    setItems(tactic.items);
    setLines(tactic.lines || []);
    setPitchType(tactic.pitchType || PitchType.FULL);
    setCurrentTacticName(tactic.name);
    setSelection(null);
    setShowSetupModal(false);
    
    // Reset history for the new load
    setHistory([{ items: tactic.items, lines: tactic.lines || [], pitchType: tactic.pitchType || PitchType.FULL }]);
    setHistoryIndex(0);
    
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleApplyAITactic = (newItems: TacticalItem[], newLines: TacticalLine[]) => {
    setItems(newItems);
    setLines(newLines);
    
    // Push to history
    setHistory(prev => [...prev.slice(0, historyIndex + 1), { items: newItems, lines: newLines, pitchType }]);
    setHistoryIndex(prev => prev + 1);

    if (window.innerWidth < 640) setShowAICoach(false);
  };

  const exportImage = async () => {
    const node = document.getElementById('capture-area');
    if (node) {
      try {
        const dataUrl = await htmlToImage.toPng(node);
        const link = document.createElement('a');
        link.download = `${currentTacticName.replace(/\s+/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Export failed', error);
      }
    }
  };

  const updateSelectedLabel = (newLabel: string) => {
    if (selection?.type === 'item') {
      const updatedItems = items.map(item => 
        item.id === selection.id ? { ...item, label: newLabel } : item
      );
      setItems(updatedItems);
    }
  };

  const handleLabelBlur = () => {
      saveToHistory();
  };

  const getSelectedLabel = () => {
    if (selection?.type === 'item') {
        return items.find(i => i.id === selection.id)?.label || '';
    }
    return '';
  };

  const handleDeleteSelection = () => {
    if (!selection) return;
    let newItems = items;
    let newLines = lines;

    if (selection.type === 'item') {
        newItems = items.filter(i => i.id !== selection.id);
        setItems(newItems);
    } else {
        newLines = lines.filter(l => l.id !== selection.id);
        setLines(newLines);
    }
    setSelection(null);
    
    // Update History
    setHistory(prev => [...prev.slice(0, historyIndex + 1), { items: newItems, lines: newLines, pitchType }]);
    setHistoryIndex(prev => prev + 1);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden font-sans">
      
      {/* Modal for Pitch Setup */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-gray-800">Setup Pitch</h2>
               {items.length > 0 && (
                 <button onClick={() => setShowSetupModal(false)} className="text-gray-400 hover:text-gray-600">
                   <X size={24} />
                 </button>
               )}
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <button 
                  onClick={() => changePitchType(PitchType.FULL)}
                  className="flex flex-col items-center gap-3 p-4 border-2 border-gray-100 hover:border-brand-accent hover:bg-blue-50 rounded-xl transition-all group"
                >
                  <div className="w-full aspect-[1.5] bg-pitch-grass rounded border border-white/30 relative">
                     <div className="absolute inset-1 border border-white/50 rounded-sm"></div>
                     <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/50"></div>
                     <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-white/50 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-brand-accent">Full Field</span>
                </button>

                <button 
                  onClick={() => changePitchType(PitchType.HALF)}
                  className="flex flex-col items-center gap-3 p-4 border-2 border-gray-100 hover:border-brand-accent hover:bg-blue-50 rounded-xl transition-all group"
                >
                  <div className="w-full aspect-[1.3] bg-pitch-grass rounded border border-white/30 relative">
                     {/* Goal at bottom, Center line at top */}
                     <div className="absolute top-0 left-1/2 w-[30%] aspect-square border border-white/50 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                     <div className="absolute bottom-0 left-1/2 w-[60%] h-[30%] border-t border-x border-white/50 -translate-x-1/2"></div>
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-brand-accent">Half Field</span>
                </button>

                <button 
                  onClick={() => changePitchType(PitchType.BOX)}
                  className="flex flex-col items-center gap-3 p-4 border-2 border-gray-100 hover:border-brand-accent hover:bg-blue-50 rounded-xl transition-all group"
                >
                  <div className="w-full aspect-[1.5] bg-pitch-grass rounded border border-white/30 relative overflow-hidden">
                     <div className="absolute bottom-0 left-1/2 w-[60%] h-[50%] border-t border-x border-white/50 -translate-x-1/2"></div>
                     <div className="absolute bottom-[40%] left-1/2 w-[25%] aspect-square border border-white/50 rounded-full -translate-x-1/2"></div>
                  </div>
                  <span className="font-semibold text-gray-700 group-hover:text-brand-accent">Goal Area</span>
                </button>

                <button 
                  onClick={() => changePitchType(PitchType.EMPTY)}
                  className="flex flex-col items-center gap-3 p-4 border-2 border-gray-100 hover:border-brand-accent hover:bg-blue-50 rounded-xl transition-all group"
                >
                  <div className="w-full aspect-[1.5] bg-pitch-grass rounded border border-white/30"></div>
                  <span className="font-semibold text-gray-700 group-hover:text-brand-accent">Empty</span>
                </button>
             </div>

             <div className="text-center text-sm text-gray-500">
               Select a pitch layout to start your session. You can change this later.
             </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-brand text-white p-1.5 rounded-lg">
              <Layout size={20} />
            </div>
            <h1 className="text-lg font-bold text-gray-900 hidden sm:block tracking-tight">TacticalMaster</h1>
          </div>
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm hidden sm:inline">Session:</span>
            <input 
              type="text" 
              value={currentTacticName}
              onChange={(e) => setCurrentTacticName(e.target.value)}
              className="text-base font-semibold text-gray-800 bg-transparent border-none focus:ring-0 placeholder-gray-400 w-40 sm:w-64 p-0"
              placeholder="Session Name"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setShowSetupModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Pitch Settings"
          >
            <Settings2 size={16} />
            <span className="hidden lg:inline">Pitch</span>
          </button>

           <button 
            onClick={exportImage}
            className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Download Image"
          >
            <Download size={16} />
            Export
          </button>
          <button 
            onClick={saveTactic}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-accent rounded-lg transition-colors shadow-sm"
          >
            <Save size={16} />
            <span className="hidden sm:inline">Save</span>
          </button>
           <button 
            onClick={() => setShowAICoach(!showAICoach)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg transition-all shadow-md animate-pulse-slow"
          >
            <Sparkles size={16} />
            <span className="hidden sm:inline">AI Coach</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Tools */}
        <aside 
          className={`absolute lg:relative z-20 h-full bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col w-64 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-none'
          }`}
        >
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Items
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ITEM_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => addItem(key as ItemType)}
                      className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-brand-accent hover:text-brand-accent transition-all group bg-white shadow-sm"
                    >
                      <div className={`${config.color} ${config.textColor} p-2 rounded-full mb-1 group-hover:scale-110 transition-transform`}>
                         <Icon size={16} />
                      </div>
                      <span className="text-[10px] font-medium text-gray-600 group-hover:text-brand-accent text-center leading-tight">
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Saved Drills
              </h3>
              <div className="space-y-1">
                {savedTactics.length === 0 && (
                   <p className="text-xs text-gray-400 italic text-center py-2">No saved drills yet.</p>
                )}
                {savedTactics.map(tactic => (
                  <button
                    key={tactic.id}
                    onClick={() => loadTactic(tactic)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 group transition-colors flex items-center gap-3"
                  >
                    <FolderOpen size={14} className="text-gray-400 group-hover:text-brand" />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 truncate">{tactic.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 relative overflow-hidden bg-gray-100 flex flex-col">
          {/* Toolbar */}
          <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 overflow-x-auto no-scrollbar">
             
             {/* Mode Selector */}
             <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0 mr-4">
                <button
                  onClick={() => setActiveTool('cursor')}
                  className={`p-1.5 rounded-md flex items-center gap-2 transition-all ${activeTool === 'cursor' ? 'bg-white shadow text-brand-accent' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Select & Move Items"
                >
                  <MousePointer2 size={16} />
                  <span className="text-xs font-medium hidden md:inline">Move</span>
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button
                  onClick={() => setActiveTool(LineType.MOVEMENT)}
                  className={`p-1.5 rounded-md flex items-center gap-2 transition-all ${activeTool === LineType.MOVEMENT ? 'bg-white shadow text-amber-500' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Draw Movement Line"
                >
                  <MoveUpRight size={16} />
                  <span className="text-xs font-medium hidden md:inline">Run</span>
                </button>
                <button
                  onClick={() => setActiveTool(LineType.PASS)}
                  className={`p-1.5 rounded-md flex items-center gap-2 transition-all ${activeTool === LineType.PASS ? 'bg-white shadow text-sky-500' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Draw Pass Line"
                >
                  <ArrowRight size={16} />
                  <span className="text-xs font-medium hidden md:inline">Pass</span>
                </button>
                <button
                  onClick={() => setActiveTool(LineType.DRIBBLE)}
                  className={`p-1.5 rounded-md flex items-center gap-2 transition-all ${activeTool === LineType.DRIBBLE ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Draw Dribble Line"
                >
                  <Waves size={16} />
                  <span className="text-xs font-medium hidden md:inline">Dribble</span>
                </button>
             </div>

             {/* History Controls */}
             <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg shrink-0 mr-4">
               <button 
                onClick={undo} 
                disabled={historyIndex === 0}
                className="p-1.5 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm rounded transition-all"
                title="Undo"
               >
                 <Undo2 size={16} />
               </button>
               <button 
                onClick={redo} 
                disabled={historyIndex === history.length - 1}
                className="p-1.5 text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm rounded transition-all"
                title="Redo"
               >
                 <Redo2 size={16} />
               </button>
               <div className="w-px h-4 bg-gray-300 mx-1"></div>
               <button 
                onClick={resetBoard} 
                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-white hover:shadow-sm rounded transition-all"
                title="Reset Board"
               >
                 <RotateCcw size={16} />
               </button>
             </div>

             {/* Selected Item/Line Editor */}
             {selection && activeTool === 'cursor' && (
               <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg animate-in fade-in slide-in-from-top-2 shrink-0">
                  <Edit3 size={14} className="text-blue-500" />
                  
                  {selection.type === 'item' ? (
                    <input 
                      type="text" 
                      value={getSelectedLabel()}
                      onChange={(e) => updateSelectedLabel(e.target.value)}
                      onBlur={handleLabelBlur}
                      className="bg-transparent border-none text-sm text-blue-900 font-medium focus:ring-0 p-0 w-24"
                      placeholder="Label..."
                      autoFocus
                    />
                  ) : (
                    <span className="text-xs font-medium text-blue-900 px-2">Edit Line</span>
                  )}
                  
                  <button 
                    onClick={handleDeleteSelection}
                    className="ml-2 text-red-400 hover:text-red-600"
                    title="Delete Selected"
                  >
                    <Trash2 size={14} />
                  </button>
               </div>
             )}
          </div>

          <div className="flex-1 relative overflow-auto flex items-center justify-center p-4" id="capture-area">
            <Pitch 
              items={items} 
              setItems={setItems}
              lines={lines}
              setLines={setLines}
              selection={selection}
              setSelection={setSelection}
              activeTool={activeTool}
              pitchType={pitchType}
              onActionComplete={saveToHistory}
            />
          </div>
          
          {/* Quick Tip Bar */}
          <div className="bg-white border-t border-gray-200 px-6 py-2 text-xs text-gray-500 flex justify-between items-center shrink-0">
             <span>
               {activeTool === 'cursor' 
                 ? 'Tip: Drag items or lines to move. Click to select/edit. Drag ends of lines to resize.' 
                 : 'Tip: Drag on pitch to draw lines.'}
             </span>
             <span>{items.length} items, {lines.length} lines</span>
          </div>
        </main>

        {/* AI Assistant Drawer */}
        {showAICoach && (
          <AICoach 
            onClose={() => setShowAICoach(false)} 
            currentTacticName={currentTacticName}
            onApplyTactic={handleApplyAITactic}
          />
        )}
      </div>
    </div>
  );
}

export default App;