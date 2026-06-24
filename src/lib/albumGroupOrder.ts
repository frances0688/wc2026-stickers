import type { WorldCupGroup } from "./worldCupGroups";

/** Official Panini album group index order (team codes). */
export const TEAM_ORDER_BY_GROUP: Record<WorldCupGroup, readonly string[]> = {
  A: ["MEX", "RSA", "KOR", "CZE"],
  B: ["CAN", "BIH", "QAT", "SUI"],
  C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["USA", "PAR", "AUS", "TUR"],
  E: ["GER", "CUW", "CIV", "ECU"],
  F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"],
  H: ["ESP", "CPV", "KSA", "URU"],
  I: ["FRA", "SEN", "IRQ", "NOR"],
  J: ["ARG", "ALG", "AUT", "JOR"],
  K: ["POR", "COD", "UZB", "COL"],
  L: ["ENG", "CRO", "GHA", "PAN"],
};

const TEAM_ORDER_INDEX = new Map<string, number>();
for (const [group, teams] of Object.entries(TEAM_ORDER_BY_GROUP) as [WorldCupGroup, readonly string[]][]) {
  teams.forEach((team, index) => {
    TEAM_ORDER_INDEX.set(`${group}:${team}`, index);
  });
}

export function teamOrderInGroup(group: string, teamCode: string): number | undefined {
  return TEAM_ORDER_INDEX.get(`${group}:${teamCode}`);
}

export function countryOrderInGroup(
  group: string,
  country: string,
  countryToTeam: Map<string, string>,
): number | undefined {
  const team = countryToTeam.get(country);
  if (!team) return undefined;
  return teamOrderInGroup(group, team);
}
