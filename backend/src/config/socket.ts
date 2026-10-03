import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ENV } from './env';

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // Allow development origins
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join user room for targeted notifications
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined user room user:${userId}`);
    });

    // Join hostel room for warden broadcasts
    socket.on('join:hostel', (hostelId: string) => {
      socket.join(`hostel:${hostelId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined hostel room hostel:${hostelId}`);
    });

    // Join team room for maintenance notifications
    socket.on('join:team', (teamId: string) => {
      socket.join(`team:${teamId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined team room team:${teamId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return io;
}

/**
 * Broadcast helpers matching architecture.md event contracts
 */
export const socketEvents = {
  complaintCreated(complaint: any) {
    if (!io) return;
    io.emit('complaint:created', complaint);
  },

  complaintUpdated(complaint: any) {
    if (!io) return;
    io.emit('complaint:updated', complaint);
    if (complaint.student_id) {
      io.to(`user:${complaint.student_id}`).emit('complaint:updated', complaint);
    }
  },

  complaintAssigned(complaint: any) {
    if (!io) return;
    io.emit('complaint:assigned', complaint);
    if (complaint.assigned_to) {
      io.to(`user:${complaint.assigned_to}`).emit('complaint:assigned', complaint);
    }
    if (complaint.assigned_team_id) {
      io.to(`team:${complaint.assigned_team_id}`).emit('complaint:assigned', complaint);
    }
  },

  complaintEscalated(escalation: any) {
    if (!io) return;
    io.emit('complaint:escalated', escalation);
  },

  notificationNew(userId: string, notification: any) {
    if (!io) return;
    io.to(`user:${userId}`).emit('notification:new', notification);
    io.emit('notification:new', notification); // Also broadcast to active global listeners
  },
};
