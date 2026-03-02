export { DEFAULT_PLACEMENT, MAP_CONFIG, STORAGE_CONFIG, COST_GUARD } from "./config";
export { loadPlacementState, savePlacementState, updatePlacement, setPolygon, computeCentroid } from "./state";
export { loadPerfProfile, savePerfProfile, isMobileLowEnd, fpsCap, shouldLazyRender, computeLOD } from "./perf";
export type { PlacementTransform, Coords, GeocodeResult, ElevationResult, LotPolygon, OnsitePlacementState } from "./types";
export type { PerfProfile } from "./perf";
