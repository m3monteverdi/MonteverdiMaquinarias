-- Insertar datos iniciales de máquinas provistos por el usuario
INSERT INTO maquinas (id, nombre, modelo, tipo, horometro_actual, estado) VALUES
('CF 02', 'KOMATSU', 'WA200-5', 'CARGADORA', 0, 'operativa'),
('ME 01', 'MINI EXCAVADORA', 'XE35U', 'MINI EXCAVADORA', 0, 'operativa'),
('MA 01', 'HAULOTTE 01', 'HTL4017', 'MANIPULADOR', 0, 'operativa'),
('MA 02', 'HAULOTTE 02', 'HTL4017', 'MANIPULADOR', 0, 'operativa'),
('MA 03', 'HAULOTTE 03', 'HTL4017', 'MANIPULADOR', 0, 'operativa'),
('MA 04', 'SKAY TRACK', '506CHL', 'MANIPULADOR', 0, 'operativa'),
('MA 05', 'MANIPULADOR CAT', 'TL1055C', 'MANIPULADOR', 0, 'operativa'),
('RE 01', 'RETROEXCAVADORA CASE C/MARTILLO', '580N', 'RETROEXCAVADORA', 0, 'operativa'),
('RE 02', 'RETROEXCAVADORA CASE S/MARTILLO', '580N', 'RETROEXCAVADORA', 0, 'operativa'),
('RE 03', 'CAT 416E (MAQUINA GERMAN)', '416E', 'RETROEXCAVADORA', 0, 'operativa'),
('RE 04', 'RETROEXCAVADORA CASE S/MARTILLO (Nueva)', '580N', 'RETROEXCAVADORA', 0, 'operativa'),
('RO 01', 'RETROEXCAVADORA HYUNDAI', 'R220LC-9S', 'RETROEXCAVADORA', 0, 'operativa'),
('CO 01', 'COMPACTADOR DYNAPAC', 'ICC1200C', 'COMPACTADOR', 0, 'operativa'),
('CO 02', 'COMPACTADOR BOMAG', '', 'COMPACTADOR', 0, 'operativa'),
('CO 03', 'COMPACTADOR AMMAN', 'ARR1575', 'COMPACTADOR', 0, 'operativa'),
('GM 03', 'GRUA CRANE', '', 'GRUA MOVIL', 0, 'operativa'),
('TI 01', 'TIJERA AZUL', 'GS', 'TIJERA', 0, 'operativa')
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  modelo = EXCLUDED.modelo,
  tipo = EXCLUDED.tipo;
