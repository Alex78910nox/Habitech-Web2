-- Script para insertar áreas comunes de ejemplo
-- Ejecutar solo si no hay áreas comunes en la base de datos

INSERT INTO areas_comunes (nombre, descripcion, capacidad, estado, pago_por_uso) VALUES
  ('Piscina', 'Piscina techada con sistema de climatización', 30, 'disponible', 0),
  ('Gimnasio', 'Gimnasio equipado con máquinas y pesas', 20, 'disponible', 0),
  ('Salón de Eventos', 'Salón para celebraciones y reuniones', 100, 'disponible', 50),
  ('BBQ/Parrillas', 'Área de parrillas y mesas para asados', 40, 'disponible', 20),
  ('Cancha de Tenis', 'Cancha de tenis reglamentaria', 4, 'disponible', 0),
  ('Sala de Juegos', 'Sala con mesa de billar, ping pong y juegos de mesa', 15, 'disponible', 0),
  ('Coworking', 'Espacio de trabajo compartido con WiFi', 12, 'disponible', 0),
  ('Cine', 'Sala de cine con proyector y sonido envolvente', 25, 'disponible', 10)
ON CONFLICT DO NOTHING;
