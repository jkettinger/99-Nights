export type Point = [number, number]

// Central town — the settlement at the river crossing where roads converge
export const TOWN: Point = [61, 67]

// South road: gamepiece start position up to town
export const startToTown: Point[] = [
  [52, 83],
  [53, 82],
  [54, 81],
  [55, 81],
  [56, 80],
  [57, 78],
  [58, 77],
  [59, 76],
  [60, 74],
  [60, 71],
  [61, 69],
  [61, 68],
  TOWN,
]

// Spokes: hand-traced waypoints from town to each destination

export const spokes: Record<string, Point[]> = {

  // North — up to The Keep
  'the-keep': [
    [60, 66], [61, 59], [59, 56], [54, 54], [50, 50],
  ],

  // Northeast — east from town, then curving north to the standing stones
  'the-arena': [
    [64, 66], [68, 64], [69, 59], [71, 57], [71, 54],
    [71, 51], [71, 49], [71, 48], [70, 47], [69, 44],
    [70, 39], [73, 36], [75, 33], [78, 30], [78, 28], [75, 24],
  ],

  // West — winding road through forest to the clearing
  'work': [
    [60, 66], [57, 67], [54, 68], [51, 66], [46, 67],
    [41, 73], [30, 66], [34, 51], [29, 43], [20, 34],
  ],

  // Southwest — road curving down toward the coast
  'the-library': [
    [60, 67], [57, 67], [54, 67], [51, 66], [47, 67],
    [43, 70], [41, 72], [39, 73], [39, 77], [35, 79],
    [32, 82], [30, 75],
  ],

  // Southeast — road sweeping right to the tower
  'the-tavern': [
    [63, 67], [65, 67], [66, 66], [67, 64], [69, 63],
    [71, 64], [74, 67], [76, 68], [80, 69],
  ],
}

/**
 * Get a waypoint path from the gamepiece start position to a destination.
 * All paths route through the central town hub along mapped roads.
 * Unknown slugs get a path through town, then direct to coordinates.
 */
export function getPathToDestination(
  toSlug: string,
  destX: number,
  destY: number,
): Point[] {
  const spoke = spokes[toSlug]
  if (spoke) {
    return [...startToTown, ...spoke]
  }
  // Unknown destination — route through town, then direct
  return [...startToTown, [destX, destY]]
}
