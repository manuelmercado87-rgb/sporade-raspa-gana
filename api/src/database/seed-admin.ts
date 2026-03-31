/**
 * Script de seed: crea el primer usuario admin.
 * Uso: npx ts-node src/database/seed-admin.ts
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from './entities/admin-user.entity';

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [AdminUser],
  synchronize: false,
});

async function main() {
  await ds.initialize();

  const email = 'admin@dblabstudio.com.co';
  const password = 'Sporade2026!';
  const passwordHash = await bcrypt.hash(password, 10);

  const repo = ds.getRepository(AdminUser);
  const exists = await repo.findOne({ where: { email } });
  if (exists) {
    console.log('Admin ya existe:', email);
  } else {
    await repo.save(repo.create({ email, passwordHash }));
    console.log('Admin creado:', email, '/ pass:', password);
  }

  await ds.destroy();
}

main().catch(console.error);
