import type maplibregl from "maplibre-gl";

export interface LotEditController {
  attach: () => void;
  detach: () => void;
  onVertexDragStart: () => void;
  onVertexDragEnd: () => void;
}

export function createLotEditController(
  map: maplibregl.Map,
  callbacks: {
    onEscape: () => void;
    onDeleteLastVertex: () => void;
  }
): LotEditController {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      callbacks.onEscape();
    } else if (e.key === "Backspace" || e.key === "Delete") {
      // Only prevent default if focus is not in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      callbacks.onDeleteLastVertex();
    }
  }

  function attach() {
    window.addEventListener("keydown", handleKeyDown);
  }

  function detach() {
    window.removeEventListener("keydown", handleKeyDown);
    map.dragPan.enable();
  }

  function onVertexDragStart() {
    map.dragPan.disable();
  }

  function onVertexDragEnd() {
    map.dragPan.enable();
  }

  return { attach, detach, onVertexDragStart, onVertexDragEnd };
}
