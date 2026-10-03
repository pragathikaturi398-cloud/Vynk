import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface Toast {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const socketInstance = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id);
      setConnected(true);

      if (user) {
        socketInstance.emit('join:user', user.id);
        if (user.hostelWarded) {
          socketInstance.emit('join:hostel', user.hostelWarded.id);
        }
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setConnected(false);
    });

    socketInstance.on('notification:new', (notif: any) => {
      addToast({
        title: 'New Notification',
        message: notif.message,
        type: 'info',
      });
    });

    socketInstance.on('complaint:updated', (complaint: any) => {
      addToast({
        title: `Complaint Updated (${complaint.status})`,
        message: `"${complaint.title}" is now ${complaint.status}`,
        type: 'info',
      });
    });

    socketInstance.on('complaint:escalated', (escalation: any) => {
      addToast({
        title: `🚨 Escalation Level ${escalation.level}`,
        message: escalation.reason,
        type: 'warning',
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected, toasts, removeToast }}>
      {children}
      {/* Toast Overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 flex items-start justify-between gap-3 ${
              toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-600 text-amber-200'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            <div>
              <h4 className="font-semibold text-sm">{toast.title}</h4>
              <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-xs opacity-60 hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
