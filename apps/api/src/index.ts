import { buildApp } from './app.js';
import { config } from './config.js';
import { migrate } from './migrate.js';
import { seedCatalog, seedIfEmpty } from './seed.js';

const app = await buildApp();
await migrate();
if (config.demoMode) await seedIfEmpty();
else await seedCatalog();
await app.listen({ port: config.port, host: '0.0.0.0' });
