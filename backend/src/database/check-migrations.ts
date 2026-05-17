import dataSource from './data-source';

async function main() {
  try {
    await dataSource.initialize();
    const res = await dataSource.query('SELECT id, timestamp, name FROM migrations ORDER BY id');
    console.log('migrations table:', res);
  } catch (e) {
    console.error('error checking migrations', e);
  } finally {
    await dataSource.destroy().catch(() => {});
  }
}

main();
