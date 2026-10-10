'use client';

import React, { useRef } from 'react';
import { Download } from 'lucide-react';

export type FloorPlanRoom = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  notes?: string;
};

export type FloorPlan = {
  title: string;
  overallLength: number;
  overallWidth: number;
  rooms: FloorPlanRoom[];
  assumptions?: string[];
};

const palette = ['#f7e2a5', '#dcebd7', '#d7e8f3', '#ead8d3', '#e8def2', '#dce6e7'];

function clean(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value.trim() : '';
  return text ? text.slice(0, 80) : fallback;
}

function dimension(value: unknown, fallback: number): number {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(0.5, Math.min(50, number));
}

function normaliseRoom(room: FloorPlanRoom, length: number, width: number, index: number): FloorPlanRoom {
  const roomWidth = Math.min(dimension(room.width, length / 2), length);
  const roomHeight = Math.min(dimension(room.height, width), width);
  const rawX = typeof room.x === 'number' && Number.isFinite(room.x) ? room.x : 0;
  const rawY = typeof room.y === 'number' && Number.isFinite(room.y) ? room.y : 0;
  const x = Math.max(0, Math.min(length - roomWidth, rawX));
  const y = Math.max(0, Math.min(width - roomHeight, rawY));
  return {
    id: clean(room.id, 'room-' + (index + 1)),
    name: clean(room.name, 'Room ' + (index + 1)),
    x,
    y,
    width: roomWidth,
    height: roomHeight,
    notes: typeof room.notes === 'string' ? room.notes.slice(0, 120) : undefined,
  };
}

function formatMetres(value: number): string {
  return Number(value.toFixed(2)) + ' m';
}

function roomKind(name: string): 'bedroom' | 'bathroom' | 'living' | 'other' {
  const value = name.toLowerCase();
  if (/(bed|sleep)/.test(value)) return 'bedroom';
  if (/(bath|toilet|wc|shower)/.test(value)) return 'bathroom';
  if (/(kitchen|lounge|living|dining)/.test(value)) return 'living';
  return 'other';
}

function WindowMark({ side, x, y, width, height }: { side: 'top' | 'right' | 'bottom' | 'left'; x: number; y: number; width: number; height: number }) {
  const span = side === 'top' || side === 'bottom' ? Math.max(28, Math.min(120, width * 0.38)) : Math.max(28, Math.min(90, height * 0.45));
  const centreX = x + width / 2;
  const centreY = y + height / 2;
  if (side === 'top') return <g><rect x={centreX - span / 2} y={y - 5} width={span} height={10} fill="#b9dff0" stroke="#17648b" strokeWidth="2" /><line x1={centreX - span / 2 + 7} y1={y - 5} x2={centreX - span / 2 + 7} y2={y + 5} stroke="#17648b" strokeWidth="1" /><line x1={centreX + span / 2 - 7} y1={y - 5} x2={centreX + span / 2 - 7} y2={y + 5} stroke="#17648b" strokeWidth="1" /></g>;
  if (side === 'bottom') return <g><rect x={centreX - span / 2} y={y + height - 5} width={span} height={10} fill="#b9dff0" stroke="#17648b" strokeWidth="2" /><line x1={centreX - span / 2 + 7} y1={y + height - 5} x2={centreX - span / 2 + 7} y2={y + height + 5} stroke="#17648b" strokeWidth="1" /><line x1={centreX + span / 2 - 7} y1={y + height - 5} x2={centreX + span / 2 - 7} y2={y + height + 5} stroke="#17648b" strokeWidth="1" /></g>;
  if (side === 'left') return <g><rect x={x - 5} y={centreY - span / 2} width={10} height={span} fill="#b9dff0" stroke="#17648b" strokeWidth="2" /><line x1={x - 5} y1={centreY - span / 2 + 7} x2={x + 5} y2={centreY - span / 2 + 7} stroke="#17648b" strokeWidth="1" /><line x1={x - 5} y1={centreY + span / 2 - 7} x2={x + 5} y2={centreY + span / 2 - 7} stroke="#17648b" strokeWidth="1" /></g>;
  return <g><rect x={x + width - 5} y={centreY - span / 2} width={10} height={span} fill="#b9dff0" stroke="#17648b" strokeWidth="2" /><line x1={x + width - 5} y1={centreY - span / 2 + 7} x2={x + width + 5} y2={centreY - span / 2 + 7} stroke="#17648b" strokeWidth="1" /><line x1={x + width - 5} y1={centreY + span / 2 - 7} x2={x + width + 5} y2={centreY + span / 2 - 7} stroke="#17648b" strokeWidth="1" /></g>;
}

function DoorMark({ side, x, y, width, height }: { side: 'bottom' | 'right'; x: number; y: number; width: number; height: number }) {
  if (side === 'right') {
    const doorY = y + height - Math.min(32, height * 0.3);
    const doorSize = Math.min(48, Math.max(28, height * 0.34));
    return <g stroke="#fff" strokeWidth="8" fill="none"><line x1={x + width - 3} y1={doorY} x2={x + width + 2} y2={doorY + doorSize} /><path d={'M ' + (x + width - 3) + ' ' + doorY + ' A ' + doorSize + ' ' + doorSize + ' 0 0 1 ' + (x + width - doorSize) + ' ' + (doorY + doorSize)} stroke="#252525" strokeWidth="2" /></g>;
  }
  const doorX = x + width / 2 - Math.min(48, Math.max(28, width * 0.18)) / 2;
  const doorSize = Math.min(48, Math.max(28, width * 0.18));
  return <g stroke="#fff" strokeWidth="8" fill="none"><line x1={doorX} y1={y + height + 3} x2={doorX + doorSize} y2={y + height - doorSize} /><path d={'M ' + doorX + ' ' + (y + height + 3) + ' A ' + doorSize + ' ' + doorSize + ' 0 0 1 ' + (doorX + doorSize) + ' ' + (y + height - doorSize)} stroke="#252525" strokeWidth="2" /></g>;
}

function RoomFurniture({ kind, x, y, width, height }: { kind: ReturnType<typeof roomKind>; x: number; y: number; width: number; height: number }) {
  const ink = '#715b3a';
  if (kind === 'bedroom') {
    const bedW = Math.min(width * 0.56, 150);
    const bedH = Math.min(height * 0.62, 116);
    const bedX = x + width * 0.12;
    const bedY = y + height * 0.2;
    return <g opacity="0.82"><rect x={bedX} y={bedY} width={bedW} height={bedH} rx="6" fill="#f7f7f4" stroke={ink} strokeWidth="3" /><line x1={bedX} y1={bedY + 23} x2={bedX + bedW} y2={bedY + 23} stroke={ink} strokeWidth="2" /><rect x={bedX + 10} y={bedY + 6} width={bedW * 0.27} height="13" rx="5" fill="#d6d2c8" /><rect x={bedX + bedW - 10 - bedW * 0.27} y={bedY + 6} width={bedW * 0.27} height="13" rx="5" fill="#d6d2c8" /><rect x={x + width - 48} y={y + height * 0.12} width="28" height={Math.min(105, height * 0.66)} rx="3" fill="#c7a66a" stroke={ink} strokeWidth="2" /></g>;
  }
  if (kind === 'bathroom') {
    return <g opacity="0.82"><ellipse cx={x + width * 0.52} cy={y + height * 0.63} rx={Math.min(22, width * 0.2)} ry={Math.min(30, height * 0.22)} fill="#fff" stroke="#477789" strokeWidth="3" /><rect x={x + width * 0.18} y={y + height * 0.15} width={Math.min(42, width * 0.34)} height={Math.min(30, height * 0.2)} rx="5" fill="#fff" stroke="#477789" strokeWidth="3" /><circle cx={x + width * 0.35} cy={y + height * 0.27} r="6" fill="#b9dff0" stroke="#477789" strokeWidth="2" /><path d={'M ' + (x + width * 0.15) + ' ' + (y + height * 0.9) + ' h ' + (width * 0.7)} stroke="#477789" strokeDasharray="4 4" strokeWidth="2" /></g>;
  }
  if (kind === 'living') {
    const counterH = Math.min(34, height * 0.18);
    return <g opacity="0.82"><rect x={x + width * 0.08} y={y + height * 0.08} width={width * 0.84} height={counterH} rx="4" fill="#d1b27a" stroke={ink} strokeWidth="2" /><circle cx={x + width * 0.24} cy={y + height * 0.08 + counterH / 2} r="10" fill="#b9dff0" stroke="#477789" strokeWidth="2" /><rect x={x + width * 0.72} y={y + height * 0.08 + 4} width="18" height="18" rx="3" fill="#333" /><rect x={x + width * 0.27} y={y + height * 0.55} width={Math.min(110, width * 0.34)} height={Math.min(42, height * 0.22)} rx="11" fill="#a9b39e" stroke={ink} strokeWidth="2" /><circle cx={x + width * 0.62} cy={y + height * 0.66} r={Math.min(30, width * 0.12)} fill="#c49b5a" stroke={ink} strokeWidth="2" /><rect x={x + width * 0.12} y={y + height * 0.44} width={Math.min(48, width * 0.15)} height={Math.min(80, height * 0.28)} rx="5" fill="#d1b27a" stroke={ink} strokeWidth="2" /></g>;
  }
  return null;
}

export const FloorPlanPreview: React.FC<{ plan: FloorPlan }> = ({ plan }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const length = dimension(plan.overallLength, 6);
  const width = dimension(plan.overallWidth, 2.5);
  const rooms = Array.isArray(plan.rooms)
    ? plan.rooms.slice(0, 8).map((room, index) => normaliseRoom(room, length, width, index))
    : [];
  const canvasWidth = 1000;
  const left = 128;
  const top = 108;
  const planWidth = 744;
  const planHeight = Math.max(190, Math.round(planWidth * (width / length)));
  const canvasHeight = Math.max(475, planHeight + 145);
  const scaleX = (planWidth - 18) / length;
  const scaleY = (planHeight - 18) / width;

  const downloadSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    const source = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'skills-connect-concept-floor-plan.svg';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section data-floor-plan-preview className="mt-6 overflow-hidden rounded-2xl border-2 border-[#c8c7bb] bg-white text-[#111]">
      <div className="flex flex-col gap-3 border-b border-[#deddd4] bg-[#f4f0e4] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#667064]">Concept floor plan</p>
          <h2 className="mt-1 text-lg font-black sm:text-xl">{clean(plan.title, 'Preliminary floor-plan concept')}</h2>
          <p className="mt-1 text-xs leading-5 text-[#667064]">Intelligent visual redraw for discussion — not an approved construction drawing.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={downloadSvg} className="inline-flex min-h-10 items-center gap-2 rounded-xl border-2 border-[#8a7b42] bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-[#4a3b00] shadow-sm"><Download size={15} /> Download SVG</button>
          <span className="rounded-full bg-[#f5c518] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black">Draft</span>
        </div>
      </div>

      <div className="overflow-x-auto bg-[#f8f8f5] p-3 sm:p-5">
        <svg
          ref={svgRef}
          viewBox={'0 0 ' + canvasWidth + ' ' + canvasHeight}
          role="img"
          aria-label={clean(plan.title, 'Preliminary floor plan') + '. Overall size ' + formatMetres(length) + ' by ' + formatMetres(width) + '.'}
          className="mx-auto block min-w-[620px] max-w-full"
        >
          <rect x="0" y="0" width={canvasWidth} height={canvasHeight} fill="#ffffff" />
          <defs>
            <filter id="floor-plan-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000" floodOpacity="0.12" />
            </filter>
          </defs>

          <line x1={left} y1={top - 34} x2={left + planWidth} y2={top - 34} stroke="#202020" strokeWidth="2" />
          <path d={'M ' + left + ' ' + (top - 34) + ' l 12 -6 v 12 z M ' + (left + planWidth) + ' ' + (top - 34) + ' l -12 -6 v 12 z'} fill="#202020" />
          <text x={left + planWidth / 2} y={top - 48} textAnchor="middle" fontSize="23" fontWeight="800" fill="#111">{formatMetres(length)} overall length</text>

          <line x1={left - 42} y1={top} x2={left - 42} y2={top + planHeight} stroke="#202020" strokeWidth="2" />
          <path d={'M ' + (left - 42) + ' ' + top + ' l -6 12 h 12 z M ' + (left - 42) + ' ' + (top + planHeight) + ' l -6 -12 h 12 z'} fill="#202020" />
          <text x={left - 72} y={top + planHeight / 2} textAnchor="middle" fontSize="21" fontWeight="800" fill="#111" transform={'rotate(-90 ' + (left - 72) + ' ' + (top + planHeight / 2) + ')'}>{formatMetres(width)} overall width</text>

          <rect x={left} y={top} width={planWidth} height={planHeight} fill="#202020" rx="4" filter="url(#floor-plan-shadow)" />
          <rect x={left + 9} y={top + 9} width={planWidth - 18} height={planHeight - 18} fill="#faf9f4" />

          {rooms.map((room, index) => {
            const x = left + 9 + room.x * scaleX;
            const y = top + 9 + room.y * scaleY;
            const roomWidth = Math.max(30, room.width * scaleX);
            const roomHeight = Math.max(28, room.height * scaleY);
            const labelSize = Math.max(12, Math.min(21, Math.min(roomWidth / Math.max(room.name.length * 0.65, 1), 21)));
            const kind = roomKind(room.name);
            const outerLeft = room.x <= 0.02;
            const outerRight = room.x + room.width >= length - 0.02;
            const outerTop = room.y <= 0.02;
            const outerBottom = room.y + room.height >= width - 0.02;
            return (
              <g key={room.id}>
                <rect x={x} y={y} width={roomWidth} height={roomHeight} fill={palette[index % palette.length]} stroke="#202020" strokeWidth="4" />
                {outerTop && <WindowMark side="top" x={x} y={y} width={roomWidth} height={roomHeight} />}
                {outerBottom && <WindowMark side="bottom" x={x} y={y} width={roomWidth} height={roomHeight} />}
                {outerLeft && <WindowMark side="left" x={x} y={y} width={roomWidth} height={roomHeight} />}
                {outerRight && <WindowMark side="right" x={x} y={y} width={roomWidth} height={roomHeight} />}
                {kind === 'bedroom' && <DoorMark side="right" x={x} y={y} width={roomWidth} height={roomHeight} />}
                {kind !== 'bedroom' && kind !== 'other' && <DoorMark side="bottom" x={x} y={y} width={roomWidth} height={roomHeight} />}
                <RoomFurniture kind={kind} x={x} y={y} width={roomWidth} height={roomHeight} />
                <rect x={x + roomWidth * 0.05} y={y + roomHeight * 0.78} width={roomWidth * 0.9} height={Math.max(18, roomHeight * 0.17)} fill="#ffffff" opacity="0.64" rx="3" />
                <text x={x + roomWidth / 2} y={y + roomHeight * 0.84} textAnchor="middle" fontSize={labelSize} fontWeight="900" fill="#111">{room.name.toUpperCase()}</text>
                <text x={x + roomWidth / 2} y={y + roomHeight * 0.93} textAnchor="middle" fontSize={Math.max(10, labelSize - 4)} fontWeight="700" fill="#333">{formatMetres(room.width)} × {formatMetres(room.height)}</text>
              </g>
            );
          })}

          <text x={left + 12} y={top + planHeight + 34} fontSize="14" fontWeight="800" fill="#404040">PRELIMINARY CONCEPT • VERIFY SCALE, STRUCTURE, SERVICES AND LOCAL APPROVALS</text>
          <g transform={'translate(' + (left + 12) + ' ' + (top + planHeight + 56) + ')'} fontSize="13" fill="#404040">
            <rect x="0" y="-12" width="16" height="8" fill="#b9dff0" stroke="#17648b" />
            <text x="24" y="-4">window</text>
            <line x1="98" y1="-8" x2="116" y2="-8" stroke="#252525" strokeWidth="3" />
            <path d="M 98 -8 A 18 18 0 0 1 116 -26" fill="none" stroke="#252525" strokeWidth="1.5" />
            <text x="124" y="-4">schematic door swing</text>
            <text x="300" y="-4">Furniture symbols are indicative only.</text>
          </g>
        </svg>
      </div>

      {plan.assumptions && plan.assumptions.length > 0 && (
        <div className="grid gap-2 border-t border-[#deddd4] bg-[#fff8da] px-4 py-4 text-xs leading-5 text-[#4a3b00] sm:grid-cols-2 sm:px-5">
          {plan.assumptions.slice(0, 4).map((assumption) => <p key={assumption}>• {assumption}</p>)}
        </div>
      )}
    </section>
  );
};
