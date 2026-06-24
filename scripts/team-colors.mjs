/** Two-color gradients for placeholder sticker art (national flag colors). */
export const TEAM_COLORS = {
  // Group A
  MEX: ["#006847", "#CE1126"],
  RSA: ["#007A4D", "#FFB81C"],
  KOR: ["#0047A0", "#CD2E3A"],
  CZE: ["#11457E", "#D7141A"],
  // Group B
  CAN: ["#FF0000", "#FFFFFF"],
  BIH: ["#002395", "#FECB00"],
  QAT: ["#8A1538", "#FFFFFF"],
  SUI: ["#FF0000", "#FFFFFF"],
  // Group C
  BRA: ["#009C3B", "#FFDF00"],
  MAR: ["#C1272D", "#006233"],
  HAI: ["#00209F", "#D21034"],
  SCO: ["#005EB8", "#FFFFFF"],
  // Group D
  USA: ["#3C3B6E", "#B22234"],
  PAR: ["#D52B1E", "#0038A8"],
  AUS: ["#00008B", "#FFCD00"],
  TUR: ["#E30A17", "#FFFFFF"],
  // Group E
  GER: ["#000000", "#DD0000"],
  CUW: ["#002B7F", "#F9E814"],
  CIV: ["#F77F00", "#009E60"],
  ECU: ["#FCD116", "#003087"],
  // Group F
  NED: ["#FF6600", "#21468B"],
  JPN: ["#FFFFFF", "#BC002D"],
  SWE: ["#006AA7", "#FECC00"],
  TUN: ["#E70013", "#FFFFFF"],
  // Group G
  BEL: ["#000000", "#FDDA24"],
  EGY: ["#CE1126", "#000000"],
  IRN: ["#239F40", "#FFFFFF"],
  NZL: ["#000000", "#C0C0C0"],
  // Group H
  ESP: ["#AA151B", "#F1BF00"],
  CPV: ["#003893", "#FFFFFF"],
  KSA: ["#006C35", "#FFFFFF"],
  URU: ["#0038A8", "#FFFFFF"],
  // Group I
  FRA: ["#002395", "#ED2939"],
  SEN: ["#00853F", "#FDEF42"],
  IRQ: ["#CE1126", "#000000"],
  NOR: ["#BA0C2F", "#00205B"],
  // Group J
  ARG: ["#74ACDF", "#FFFFFF"],
  ALG: ["#006233", "#FFFFFF"],
  AUT: ["#ED2939", "#FFFFFF"],
  JOR: ["#007A3D", "#000000"],
  // Group K
  POR: ["#006600", "#FF0000"],
  COD: ["#007FFF", "#F7D618"],
  UZB: ["#1EB53A", "#0099B5"],
  COL: ["#FCD116", "#003087"],
  // Group L
  ENG: ["#FFFFFF", "#CE1124"],
  CRO: ["#FF0000", "#FFFFFF"],
  GHA: ["#006B3F", "#FCD116"],
  PAN: ["#DA121A", "#005293"],

  // Special / promos
  FWC: ["#326295", "#F1BF00"],
  PANINI: ["#E8233A", "#1B3FA0"],
  CC: ["#F40009", "#FFFFFF"],

  default: ["#1B3FA0", "#E8233A"],
};

export function colorsFor(teamCode) {
  return TEAM_COLORS[teamCode] ?? TEAM_COLORS.default;
}
