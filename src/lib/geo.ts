const GRID = 0.002; // ≈200 m per grid step

export function fuzzCoords(lat: number, lng: number) {
  return {
    lat: Math.round(lat / GRID) * GRID,
    lng: Math.round(lng / GRID) * GRID,
  };
}
