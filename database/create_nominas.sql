-- Crear tabla de nóminas para pago de personal
CREATE TABLE IF NOT EXISTS nominas (
  id SERIAL PRIMARY KEY,
  personal_id INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  año INTEGER NOT NULL,
  salario_base DECIMAL(10,2) NOT NULL,
  bonos DECIMAL(10,2) DEFAULT 0.00,
  deducciones DECIMAL(10,2) DEFAULT 0.00,
  total_pagar DECIMAL(10,2) NOT NULL,
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado')),
  fecha_pago DATE,
  metodo_pago VARCHAR(20) CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'online')),
  observaciones TEXT,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  
  -- Evitar duplicados: un empleado solo puede tener una nómina por mes/año
  UNIQUE(personal_id, mes, año)
);

-- Índices para mejorar performance
CREATE INDEX idx_nominas_personal ON nominas(personal_id);
CREATE INDEX idx_nominas_estado ON nominas(estado);
CREATE INDEX idx_nominas_mes_año ON nominas(mes, año);

-- Comentarios
COMMENT ON TABLE nominas IS 'Registro de nóminas y pagos al personal del edificio';
COMMENT ON COLUMN nominas.personal_id IS 'ID del empleado de la tabla personal_edificio';
COMMENT ON COLUMN nominas.mes IS 'Mes del pago (1-12)';
COMMENT ON COLUMN nominas.año IS 'Año del pago';
COMMENT ON COLUMN nominas.salario_base IS 'Salario base del empleado';
COMMENT ON COLUMN nominas.bonos IS 'Bonos adicionales (horas extra, incentivos, etc)';
COMMENT ON COLUMN nominas.deducciones IS 'Deducciones (impuestos, adelantos, etc)';
COMMENT ON COLUMN nominas.total_pagar IS 'Total a pagar = salario_base + bonos - deducciones';
