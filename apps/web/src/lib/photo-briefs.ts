/**
 * Shot list: what photo belongs in each slot while real assets are missing.
 * Shown inside placeholders (team-facing) and collected in docs/ART_DIRECTION.md.
 * Grade every photo with the same LUT: 5600 K, saturation −10 %, no teal/orange look.
 */
export const SERVICE_PHOTOS: Record<string, string> = {
  robotics: 'FOTO S1 — Robot (cobot o cuadrúpedo) en estudio, fondo gris continuo, luz lateral suave, 4:3',
  'industrial-automation': 'FOTO S2 — Celda robótica en planta real, plano medio, operario al fondo desenfocado, 4:3',
  'pcb-electronics': 'FOTO S3 — Macro de PCB a 45°, poca profundidad de campo, cobre y serigrafía nítidos, 4:3',
  'software-ros-ai': 'FOTO S4 — Ingeniero frente a monitores con RViz/simulación y robot real al lado, 4:3',
  'prototyping-manufacturing': 'FOTO S5 — Taller: CNC o impresoras 3D trabajando, plano amplio, luz industrial, 4:3',
};

export const INDUSTRY_PHOTO = (title: string) => `FOTO — ${title}: sistema Velkin operando en su entorno real, 3:2`;
export const PROJECT_PHOTO = (title: string) => `FOTO — ${title}: plano principal del sistema entregado, 16:9`;
export const TEAM_PHOTO = (name: string) => `FOTO — Retrato de ${name}, fondo gris neutro, luz suave, 4:5`;
