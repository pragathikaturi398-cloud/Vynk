import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';
import { Complaint } from '../types';

interface Toast {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface SocketContextType {
  socket: {
    on: (event: string, callback: (...args: any[]) => void) => void;
    off: (event: string, callback?: (...args: any[]) => void) => void;
    emit: (event: string, ...args: any[]) => void;
  } | null;
  connected: boolean;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const listenersRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map());
  const lastStatusMapRef = useRef<Map<string, string>>(new Map());

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

  // Dispatch events to registered listeners
  const emitLocalEvent = (event: string, ...args: any[]) => {
    const handlers = listenersRef.current.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(...args);
        } catch (e) {
          console.warn(`Error in listener for ${event}:`, e);
        }
      });
    }
  };

  // Serverless-friendly live polling synchronization
  useEffect(() => {
    if (!user) return;

    let isSubscribed = true;

    const pollStatusUpdates = async () => {
      try {
        const res: any = await api.get('/complaints');
        if (res?.success && Array.isArray(res.data) && isSubscribed) {
          const complaints: Complaint[] = res.data;

          complaints.forEach((c) => {
            const prevStatus = lastStatusMapRef.current.get(c.id);
            if (prevStatus && prevStatus !== c.status) {
              // Status changed!
              addToast({
                title: `Status Updated: ${c.status}`,
                message: `"${c.title}" progressed to ${c.status}`,
                type: c.status === 'RESOLVED' ? 'success' : 'info',
              });
              emitLocalEvent('complaint:updated', c);
            }
            lastStatusMapRef.current.set(c.id, c.status);
          });
        }
      } catch (err) {
        // quiet fallback
      }
    };

    // Initial poll
    pollStatusUpdates();

    // Periodic polling interval (6s)
    const interval = setInterval(pollStatusUpdates, 6000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [user]);

  // Mock socket object compatible with Socket.IO event interface
  const socket = useRef({
    on: (event: string, callback: (...args: any[]) => void) => {
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set());
      }
      listenersRef.current.get(event)!.add(callback);
    },
    off: (event: string, callback?: (...args: any[]) => void) => {
      if (!callback) {
        listenersRef.current.delete(event);
      } else {
        listenersRef.current.get(event)?.delete(callback);
      }
    },
    emit: (event: string, ...args: any[]) => {
      emitLocalEvent(event, ...args);
    },
  }).current;

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
