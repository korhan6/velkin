# Fotos del sitio

Copia aquí tus fotos con **el nombre exacto** de la tabla y aparecen solas en su lugar
(al reiniciar `pnpm dev` o en el próximo deploy). Formatos: `.jpg`, `.png`, `.webp`, `.avif`.
Las fotos que subas desde el panel admin tienen prioridad sobre estas.

Recomendado: máx. 2400 px de ancho y < 400 KB (Next/Cloudflare generan AVIF/WebP solos).
No borres este archivo ni los `.gitkeep`.

| Archivo | Dónde aparece | Formato |
|---|---|---|
| `hero.jpg` | Fondo del inicio (póster) | 16:9, < 250 KB |
| `hero.mp4` | Video del inicio (opcional, solo escritorio) | 16:9, 10–15 s, sin audio, < 4 MB |
| `services/robotics.jpg` | Servicio Robótica | 4:3 |
| `services/industrial-automation.jpg` | Servicio Automatización | 4:3 |
| `services/pcb-electronics.jpg` | Servicio PCB y electrónica | 4:3 |
| `services/software-ros-ai.jpg` | Servicio Software, ROS 2 e IA | 16:9 |
| `services/prototyping-manufacturing.jpg` | Servicio Prototipado | 16:9 |
| `industries/manufacturing.jpg` | Industria Manufactura | 3:2 |
| `industries/logistics.jpg` | Logística | 3:2 |
| `industries/energy.jpg` | Energía | 3:2 |
| `industries/healthcare.jpg` | Salud | 3:2 |
| `industries/events.jpg` | Eventos | 3:2 |
| `industries/education.jpg` | Educación | 3:2 |
| `industries/government.jpg` | Gobierno | 3:2 |
| `industries/startups.jpg` | Startups | 3:2 |
| `projects/<caso>.jpg` | Foto principal del caso | 16:9 |
| `projects/<caso>-1.jpg` … `-12.jpg` | Galería del caso | 3:2 |
| `team/1.jpg`, `team/2.jpg` | Retratos del equipo, en orden | 4:5 |
| `about/taller.jpg` | Nosotros — vista del taller | 4:3 |
| `about/electronica.jpg` | Nosotros — banco de electrónica | 4:3 |
| `about/motores.jpg` | Nosotros — banco de motores | 4:3 |
| `resources/<articulo>.jpg` | Portada de un artículo | 3:2 |

Casos actuales (`<caso>`): `cobot-palletizing-cell`, `quadruped-inspection`, `amr-controller-board`, `event-telepresence`.
Artículos (`<articulo>`): `sizing-actuators-for-legged-robots`, `ros2-architecture-for-small-fleets`.
