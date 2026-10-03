import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

import authRoutes from './modules/auth/auth.routes';
import hostelRoutes from './modules/hostels/hostel.routes';
import categoryRoutes from './modules/categories/category.routes';
import complaintRoutes from './modules/complaints/complaint.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import auditRoutes from './modules/audit/audit.routes';
import userRoutes from './modules/users/user.routes';
import maintenanceStaffRoutes from './modules/maintenance/maintenance-staff.routes';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  // Security & Utility Middleware
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static uploads directory for proof photos and attachments
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // REST API Modules
  app.use('/auth', authRoutes);
  app.use('/', hostelRoutes);
  app.use('/', categoryRoutes);
  app.use('/complaints', complaintRoutes);
  app.use('/notifications', notificationRoutes);
  app.use('/analytics', analyticsRoutes);
  app.use('/reports', analyticsRoutes); // For /reports/export
  app.use('/insights', analyticsRoutes); // For /insights
  app.use('/audit-logs', auditRoutes);
  app.use('/users', userRoutes);
  app.use('/maintenance-staff', maintenanceStaffRoutes);

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
