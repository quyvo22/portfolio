"use client";

import { useCallback } from "react";

export type CubeFace = "top" | "bottom" | "front" | "back" | "left" | "right";

export interface ViewCubeProps {
  bearing: number;
  pitch: number;
  onFaceClick: (face: CubeFace) => void;
  onFaceDblClick: (face: CubeFace) => void;
  onHomeClick: () => void;
  onOrbitLeft: () => void;
  onOrbitRight: () => void;
  showAlignEdge?: boolean;
  onAlignEdge?: () => void;
}

const CUBE_SIZE = 48; // px — compact
const HALF = CUBE_SIZE / 2;

export function ViewCube({
  bearing,
  pitch,
  onFaceClick,
  onFaceDblClick,
  onHomeClick,
  onOrbitLeft,
  onOrbitRight,
  showAlignEdge,
  onAlignEdge,
}: ViewCubeProps) {
  const rotX = Math.min(Math.max(pitch, 0), 85);
  const rotY = -bearing;

  const handleClick = useCallback(
    (face: CubeFace) => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.detail === 2) {
        onFaceDblClick(face);
      } else {
        onFaceClick(face);
      }
    },
    [onFaceClick, onFaceDblClick],
  );

  const faceBase =
    "absolute flex items-center justify-center text-[9px] font-bold select-none cursor-pointer transition-colors border border-white/20";

  return (
    <div className="flex flex-col items-center gap-1.5 p-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl">
      {/* Cube */}
      <div style={{ width: CUBE_SIZE, height: CUBE_SIZE, perspective: 300 }}>
        <div
          style={{
            width: CUBE_SIZE,
            height: CUBE_SIZE,
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transition: "transform 0.15s ease-out",
          }}
        >
          <div
            className={`${faceBase} bg-blue-600/70 hover:bg-blue-500/90 text-white`}
            style={{ width: CUBE_SIZE, height: CUBE_SIZE, transform: `translateZ(${HALF}px)` }}
            onClick={handleClick("front")}
          >
            N
          </div>
          <div
            className={`${faceBase} bg-slate-600/70 hover:bg-slate-500/90 text-white`}
            style={{ width: CUBE_SIZE, height: CUBE_SIZE, transform: `rotateY(180deg) translateZ(${HALF}px)` }}
            onClick={handleClick("back")}
          >
            S
          </div>
          <div
            className={`${faceBase} bg-slate-600/70 hover:bg-slate-500/90 text-white`}
            style={{ width: CUBE_SIZE, height: CUBE_SIZE, transform: `rotateY(90deg) translateZ(${HALF}px)` }}
            onClick={handleClick("right")}
          >
            E
          </div>
          <div
            className={`${faceBase} bg-slate-600/70 hover:bg-slate-500/90 text-white`}
            style={{ width: CUBE_SIZE, height: CUBE_SIZE, transform: `rotateY(-90deg) translateZ(${HALF}px)` }}
            onClick={handleClick("left")}
          >
            W
          </div>
          <div
            className={`${faceBase} bg-green-600/70 hover:bg-green-500/90 text-white`}
            style={{ width: CUBE_SIZE, height: CUBE_SIZE, transform: `rotateX(90deg) translateZ(${HALF}px)` }}
            onClick={handleClick("top")}
          >
            TOP
          </div>
          <div
            className={`${faceBase} bg-slate-700/70 hover:bg-slate-600/90 text-white`}
            style={{ width: CUBE_SIZE, height: CUBE_SIZE, transform: `rotateX(-90deg) translateZ(${HALF}px)` }}
            onClick={handleClick("bottom")}
          >
            BTM
          </div>
        </div>
      </div>

      {/* Orbit row: Q [Home] E */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOrbitLeft}
          className="w-6 h-6 flex items-center justify-center text-[9px] font-bold bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded transition-colors"
          title="Orbit left (Q)"
        >
          Q
        </button>
        <button
          onClick={onHomeClick}
          className="px-1.5 h-6 flex items-center justify-center text-[9px] font-medium bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded transition-colors"
          title="Reset view"
        >
          &#8962;
        </button>
        <button
          onClick={onOrbitRight}
          className="w-6 h-6 flex items-center justify-center text-[9px] font-bold bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded transition-colors"
          title="Orbit right (E)"
        >
          E
        </button>
      </div>

      {/* Align to edge (conditional) */}
      {showAlignEdge && onAlignEdge && (
        <button
          onClick={onAlignEdge}
          className="w-full px-1.5 h-5 text-[8px] font-medium bg-white/10 hover:bg-white/20 text-white/60 hover:text-white rounded transition-colors truncate"
          title="Align camera to longest parcel edge"
        >
          Align edge
        </button>
      )}
    </div>
  );
}
