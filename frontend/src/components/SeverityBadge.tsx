import React from 'react';
import { Severity } from '../types';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

export const SeverityBadge: React.FC<{ severity: Severity }> = ({ severity }) => {
  const configs: Record<Severity, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    CRITICAL: {
      bg: 'bg-red-500/15 border-red-500/40',
      text: 'text-red-400 font-bold',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />,
      label: 'Critical',
    },
    HIGH: {
      bg: 'bg-orange-500/15 border-orange-500/40',
      text: 'text-orange-400 font-semibold',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
      label: 'High',
    },
    MEDIUM: {
      bg: 'bg-yellow-500/15 border-yellow-500/40',
      text: 'text-yellow-400',
      icon: <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />,
      label: 'Medium',
    },
    LOW: {
      bg: 'bg-slate-500/15 border-slate-500/40',
      text: 'text-slate-400',
      icon: <Info className="w-3.5 h-3.5 text-slate-400" />,
      label: 'Low',
    },
  };

  const config = configs[severity] || configs.MEDIUM;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${config.bg} ${config.text}`}>
      {config.icon}
      {config.label}
    </span>
  );
};
