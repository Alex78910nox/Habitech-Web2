import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const prisma = new PrismaClient();

async function crearTablaNominas() {
  try {
    console.log('📋 Creando tabla nominas...');
    
    // Crear tabla
    await prisma.$executeRawUnsafe(`
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
        UNIQUE(personal_id, mes, año)
      )
    `);
    
    console.log('✅ Tabla nominas creada!');
    
    // Crear índices
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_nominas_personal ON nominas(personal_id)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_nominas_estado ON nominas(estado)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_nominas_mes_año ON nominas(mes, año)`);
    
    console.log('✅ Índices creados!');
    console.log('🎉 Todo listo para usar el sistema de nóminas!');
    
  } catch (error) {
    if (error.code === 'P2010' && error.meta?.message?.includes('already exists')) {
      console.log('ℹ️ La tabla nominas ya existe');
    } else {
      console.error('❌ Error al crear tabla:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

crearTablaNominas();
