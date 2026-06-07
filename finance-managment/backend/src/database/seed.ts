import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
config();

/**
 * Seed script — solo crea el usuario administrador.
 * Los assets se agregan via Yahoo Finance cuando se buscan.
 * Run with: npx ts-node src/database/seed.ts
 */
async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'finance_portfolio',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  await ds.initialize();
  const queryRunner = ds.createQueryRunner();

  try {
    // Crear usuario administrador
    const passwordHash = await bcrypt.hash('Admin1234', 12);
    
    // Verificar si ya existe
    const existing = await queryRunner.query(
      `SELECT id FROM users WHERE email = 'admin@finance.com'`
    );

    if (existing.length === 0) {
      await queryRunner.query(`
        INSERT INTO users (id, email, "passwordHash", name, role, "isActive")
        VALUES (gen_random_uuid(), 'admin@finance.com', '${passwordHash}', 'Admin', 'admin', true)
      `);
      console.log('✅ Admin user created: admin@finance.com / Admin1234');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('\n📋 Credenciales:');
    console.log('   Email: admin@finance.com');
    console.log('   Password: Admin1234');
    console.log('\n✅ Seed completed');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await queryRunner.release();
    await ds.destroy();
  }
}

seed();
