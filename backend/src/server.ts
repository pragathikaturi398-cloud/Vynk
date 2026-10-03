import http from 'http';
import { createApp } from './app';
import { ENV } from './config/env';
import { initializeSocket } from './config/socket';
import { SLAWorker } from './jobs/sla.worker';
import { InsightsJob } from './jobs/insights.job';
import { prisma } from './config/prisma';

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Socket.IO
  initializeSocket(server);

  // Start background watchdog workers
  SLAWorker.start(30000); // Check SLAs every 30s
  InsightsJob.start();

  const PORT = ENV.PORT;
  server.listen(PORT, () => {
    console.log(`🚀 [Vynk Backend] Server listening at http://localhost:${PORT}`);
    console.log(`📡 [Socket.IO] Real-time engine ready.`);
  });

  const shutdown = async () => {
    console.log('Stopping server...');
    SLAWorker.stop();
    await prisma.$disconnect();
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Failed to start Vynk Backend:', err);
  process.exit(1);
});
