'use client';

import React from 'react';
import { VisualReconstruction, WebSnapshot } from '@/types/osint';
import { 
  Eye, 
  ExternalLink, 
  Sliders
} from 'lucide-react';

interface Props {
  reconstructions?: VisualReconstruction[];
  snapshots: WebSnapshot[];
  domain: string;
  onTraceEvidence?: (evidenceIdOrEntity: string) => void;
}

export const VisualArcheology: React.FC<Props> = ({ reconstructions = [], snapshots, domain, onTraceEvidence }) => {
  const [leftIndex, setLeftIndex] = React.useState<number>(0);
  const [rightIndex, setRightIndex] = React.useState<number>(
    reconstructions.length > 1 ? reconstructions.length - 1 : 0
  );
  const [sliderPosition, setSliderPosition] = React.useState<number>(50);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  if (!reconstructions || reconstructions.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center space-y-3 font-mono">
        <Eye className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-300">Visual Snapshots Not Available</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Need Wayback Machine historical captures to reconstruct visual wireframes and UI transformations.
        </p>
      </div>
    );
  }

  const leftItem = reconstructions[leftIndex] || reconstructions[0];
  const rightItem = reconstructions[rightIndex] || reconstructions[reconstructions.length - 1];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };

  const renderWireframeMockup = (item: VisualReconstruction) => {
    const isEarly = item.layoutStyle === 'early-table-based';
    const isWeb2 = item.layoutStyle === 'web2-skeuomorphic';
    const isFlat = item.layoutStyle === 'flat-responsive';

    return (
      <div 
        className={`w-full h-full p-4 sm:p-6 overflow-hidden flex flex-col justify-between select-none ${
          isEarly 
            ? 'bg-[#ffffff] text-[#000000] font-serif' 
            : isWeb2 
            ? 'bg-[#f4f6f9] text-[#2c3e50] font-sans' 
            : isFlat 
            ? 'bg-[#ffffff] text-[#1e293b] font-sans' 
            : 'bg-[#090d16] text-[#f1f5f9] font-mono'
        }`}
      >
        {/* Header bar */}
        <div className={`pb-3 border-b ${
          isEarly ? 'border-[#000000] space-y-1' : isWeb2 ? 'border-[#dcdde1] space-y-2' : isFlat ? 'border-slate-200 space-y-2' : 'border-slate-800 space-y-2'
        }`}>
          <div className="flex items-center justify-between">
            <h1 className={`font-bold truncate ${isEarly ? 'text-lg text-[#000080]' : isWeb2 ? 'text-xl text-[#2980b9]' : 'text-xl text-amber-400'}`}>
              {domain}
            </h1>
            <span className={`text-[10px] px-2 py-0.5 rounded ${
              isEarly ? 'bg-[#c0c0c0] text-[#000000] border border-[#808080]' : isWeb2 ? 'bg-[#3498db] text-white' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {item.year} Capture
            </span>
          </div>
          <p className="text-xs truncate opacity-75">{item.title}</p>
        </div>

        {/* Layout wireframe body */}
        <div className="flex-1 py-4 grid grid-cols-3 gap-3">
          {/* Sidebar / Left Column */}
          <div className={`p-2.5 rounded ${
            isEarly 
              ? 'bg-[#e0e0e0] border border-[#000000] space-y-1.5' 
              : isWeb2 
              ? 'bg-[#ffffff] border border-[#dcdde1] shadow-sm space-y-2' 
              : isFlat 
              ? 'bg-slate-50 border border-slate-200 space-y-2' 
              : 'bg-slate-900/90 border border-slate-800 space-y-2'
          }`}>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">Navigation</span>
            <div className="space-y-1 text-[11px]">
              <div className="h-2 bg-current opacity-20 rounded w-3/4" />
              <div className="h-2 bg-current opacity-20 rounded w-1/2" />
              <div className="h-2 bg-current opacity-20 rounded w-2/3" />
            </div>
          </div>

          {/* Main content hero */}
          <div className={`col-span-2 p-3 rounded flex flex-col justify-between ${
            isEarly 
              ? 'bg-[#ffffff] border border-dashed border-[#808080] space-y-2' 
              : isWeb2 
              ? 'bg-gradient-to-b from-white to-slate-100 border border-slate-300 shadow-md space-y-2' 
              : isFlat 
              ? 'bg-white border border-slate-200 shadow-sm space-y-2' 
              : 'bg-slate-900/60 border border-slate-800 space-y-2'
          }`}>
            <div className="space-y-1.5">
              <div className="h-3.5 bg-current opacity-30 rounded w-4/5" />
              <div className="h-2 bg-current opacity-20 rounded w-full" />
              <div className="h-2 bg-current opacity-20 rounded w-5/6" />
            </div>

            {/* Simulated UI indicators */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {item.keyElements.slice(0, 3).map((elem, eIdx) => (
                <span key={eIdx} className={`text-[9px] px-1.5 py-0.5 rounded border ${
                  isEarly 
                    ? 'bg-[#ffffcc] text-[#000000] border-[#cccc99]' 
                    : isWeb2 
                    ? 'bg-[#ebf5fb] text-[#2980b9] border-[#aed6f1]' 
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {elem}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className={`pt-2 border-t flex items-center justify-between text-[10px] ${
          isEarly ? 'border-[#000000]' : isWeb2 ? 'border-[#dcdde1]' : 'border-slate-800'
        }`}>
          <span className="truncate opacity-75">
            Stack: {item.detectedTechNames.slice(0, 2).join(', ') || 'Static HTML'}
          </span>
          <span className="font-mono opacity-60 shrink-0 ml-2">
            {(item.contentLength / 1024).toFixed(1)} KB
          </span>
        </div>
      </div>
    );
  };

  const renderBrowserFrame = (item: VisualReconstruction) => {
    return (
      <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Browser Top Chrome */}
        <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>

          <div className="flex-1 max-w-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-[11px] font-mono text-slate-300 truncate text-center">
            http://{domain} ({item.year})
          </div>

          <a
            href={item.archiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-1 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30"
          >
            <span>Wayback</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Viewport Content */}
        <div className="flex-1 relative min-h-[300px] sm:min-h-[380px]">
          {renderWireframeMockup(item)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-5 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-mono font-bold bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-md border border-amber-500/30 flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-amber-400" />
                Visual Archeology & Slider Diff
              </span>
              <span className="text-xs text-slate-400 font-mono">Split-Screen UI Evolution</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100 font-mono tracking-tight pt-1">
              Visual Wireframe & Interface Transformation Slider
            </h2>
          </div>

          <span className="text-xs text-slate-300 font-mono bg-slate-950 px-3.5 py-1.5 rounded-full border border-slate-800">
            Comparing <strong className="text-amber-300">{leftItem.year}</strong> vs <strong className="text-emerald-300">{rightItem.year}</strong>
          </span>
        </div>

        {/* Era Selector Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs font-mono">
          {/* Left Era Select */}
          <div className="space-y-2">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">
              Baseline Era (Left Viewport):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {reconstructions.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => setLeftIndex(idx)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    leftIndex === idx
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                  }`}
                >
                  {r.year} ({r.era.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>

          {/* Right Era Select */}
          <div className="space-y-2">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">
              Target Era (Right Viewport):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {reconstructions.map((r, idx) => (
                <button
                  key={idx}
                  onClick={() => setRightIndex(idx)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    rightIndex === idx
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                  }`}
                >
                  {r.year} ({r.era.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Split-Screen Slider Comparison Viewport */}
        <div 
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="relative w-full h-[400px] sm:h-[480px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl cursor-col-resize select-none bg-slate-950"
        >
          {/* Under layer (Right / Target Era) */}
          <div className="absolute inset-0 w-full h-full">
            {renderBrowserFrame(rightItem)}
          </div>

          {/* Top clipped layer (Left / Base Era) */}
          <div 
            className="absolute inset-0 h-full overflow-hidden border-r-2 border-amber-400 shadow-2xl"
            style={{ width: `${sliderPosition}%` }}
          >
            <div className="absolute inset-0 w-full h-full min-w-[700px] sm:min-w-[1100px]">
              {renderBrowserFrame(leftItem)}
            </div>
          </div>

          {/* Slider Drag Handle Divider */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-lg pointer-events-none"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shadow-xl font-bold font-mono text-[10px] border-2 border-slate-950">
              ⟷
            </div>
          </div>
        </div>

        {/* Summary Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-amber-400">{leftItem.era}</span>
              <span className="text-slate-500">{leftItem.timestamp.split('T')[0]}</span>
            </div>
            <p className="text-slate-300 font-sans text-xs">{leftItem.title}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {leftItem.detectedTechNames.map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded text-[10px]">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-emerald-400">{rightItem.era}</span>
              <span className="text-slate-500">{rightItem.timestamp.split('T')[0]}</span>
            </div>
            <p className="text-slate-300 font-sans text-xs">{rightItem.title}</p>
            <div className="flex flex-wrap gap-1 pt-1">
              {rightItem.detectedTechNames.map((t, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded text-[10px]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
