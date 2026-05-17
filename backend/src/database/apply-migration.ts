import dataSource from './data-source';

async function run() {
  await dataSource.initialize();
  const qr = dataSource.createQueryRunner();
  // import the generated migration
  const migration = (await import('./migrations/1779007059108-AddBilliardEntities'));
  const MigClass = migration.AddBilliardEntities1779007059108;
  const mig = new MigClass();
  try {
    await mig.up(qr);
    // mark migration as executed
    await dataSource.query(`INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`, [1779007059108, 'AddBilliardEntities1779007059108']);
    console.log('Migration applied');
  } catch (e) {
    console.error('Migration apply error', e);
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

run().catch(console.error);
