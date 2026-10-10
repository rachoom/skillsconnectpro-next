'use client';

import React from 'react';

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

const palette = ['#f4e1a1', '#dce8d4', '#d7e7f2', '#ead8d2', '#e7def2', '#dce5e6'];

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
  const x = Math.max(0, Math.min(length - roomWidth, dimension(room.x, 0)));
  const y = Math.max(0, Math.min(width - roomHeight, dimension(room.y, 0)));
  return {
    id: clean(room.id, `room-${index + 1}`),
    name: clean(room.name, `Room ${index + 1}`),
    x,
    y,
    width: roomWidth,
    height: roomHeight,
    notes: typeof room.notes === 'string' ? room.notes.slice(0, 120) : undefined,
  };
}

function formatMetres(value: number): string {
  return `${Number(value.toFixed(2))} m`;
}

export const FloorPlanPreview: React.FC<{ plan: FloorPlan }> = ({ plan }) => {
  const length = dimension(plan.overallLength, 6);
  const width = dimension(plan.overallWidth, 2.5);
  const rooms = Array.isArray(plan.rooms)
    ? plan.rooms.slice(0, 8).map((room, index) => normaliseRoom(room, length, width, index))
    : [];
  const canvasWidth = 1000;
  const canvasHeight = Math.max(390, Math.round(canvasWidth * (width / length) + 150));
  const left = 105;
  const top = 90;
  const planWidth = 790;
  const planHeight = Math.max(185, Math.round(planWidth * (width / length)));
  const scaleX = planWidth / length;
  const scaleY = planHeight / width;

  return (
    <section data-floor-plan-preview className="mt-6 overflow-hidden rounded-2xl border-2 border-[#c8c7bb] bg-white text-[#111]">
      <div className="flex items-start justify-between gap-4 border-b border-[#deddd4] bg-[#f4f0e4] px-4 py-4 sm:px-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#667064]">Concept floor plan</p>
          <h2 className="mt-1 text-lg font-black sm:text-xl">{clean(plan.title, 'Preliminary floor-plan concept')}</h2>
          <p className="mt-1 text-xs leading-5 text-[#667064]">Dimensioned visual guide for discussion—not an approved construction drawing.</p>
        </div>
        <span className="shrink-0 rounded-full bg-[#f5c518] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-black">Draft</span>
      </div>

      <div className="overflow-x-auto p-3 sm:p-5">
        <svg
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          role="img"
          aria-label={`${plan.title}. Overall size ${formatMetres(length)} by ${formatMetres(width)}.`}
          className="mx-auto block min-w-[620px] max-w-full"
        >
          <defs>
            <filter id="floor-plan-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#000" floodOpacity="0.12" />
            </filter>
          </defs>

          <line x1={left} y1={top - 30} x2={left + planWidth} y2={top - 30} stroke="#222" strokeWidth="2" />
          <path d={`M ${left} ${top - 30} l 12 -6 v 12 z M ${left + planWidth} ${top - 30} l -12 -6 v 12 z`} fill="#222" />
          <text x={left + planWidth / 2} y={top - 45} textAnchor="middle" fontSize="24" fontWeight="800" fill="#111">{formatMetres(length)} overall length</text>

          <line x1={left - 36} y1={top} x2={left - 36} y2={top + planHeight} stroke="#222" strokeWidth="2" />
          <path d={`M ${left - 36} ${top} l -6 12 h 12 z M ${left - 36} ${top + planHeight} l -6 -12 h 12 z`} fill="#222" />
          <text x={left - 64} y={top + planHeight / 2} textAnchor="middle" fontSize="22" fontWeight="800" fill="#111" transform={`rotate(-90 ${left - 64} ${top + planHeight / 2})`}>{formatMetres(width)} overall width</text>

          <rect x={left} y={top} width={planWidth} height={planHeight} fill="#1d1d1d" rx="4" filter="url(#floor-plan-shadow)" />
          <rect x={left + 9} y={top + 9} width={planWidth - 18} height={planHeight - 18} fill="#faf9f4" />

          {rooms.map((room, index) => {
            const x = left + 9 + room.x * scaleX;
            const y = top + 9 + room.y * scaleY;
            const roomWidth = Math.max(30, room.width * scaleX);
            const roomHeight = Math.max(28, room.height * scaleY);
            const labelSize = Math.max(12, Math.min(21, Math.min(roomWidth / Math.max(room.name.length * 0.65, 1), 21)));
            return (
              <g key={room.id}>
                <rect x={x} y={y} width={roomWidth} height={roomHeight} fill={palette[index % palette.length]} stroke="#202020" strokeWidth="4" />
                <text x={x + roomWidth / 2} y={y + roomHeight / 2 - 5} textAnchor="middle" fontSize={labelSize} fontWeight="900" fill="#111">{room.name.toUpperCase()}</text>
                <text x={x + roomWidth / 2} y={y + roomHeight / 2 + labelSize + 5} textAnchor="middle" fontSize={Math.max(11, labelSize - 3)} fontWeight="700" fill="#333">{formatMetres(room.width)} × {formatMetres(room.height)}</text>
              </g>
            );
          })}

          <text x={left + 18} y={top + planHeight + 38} fontSize="15" fontWeight="800" fill="#555">PRELIMINARY CONCEPT • VERIFY SCALE, STRUCTURE, SERVICES AND LOCAL APPROVALS</text>
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
