import React from 'react';
import { Clock, CheckCircle2, AlertCircle, PlayCircle, Cpu } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const getBadgeConfig = (st) => {
    switch (st?.toUpperCase()) {
      case 'COMPLETED':
        return {
          label: 'Completed',
          icon: <CheckCircle2 size={13} />,
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: 'rgba(16, 185, 129, 0.3)',
        };
      case 'READY_FOR_COLAB':
        return {
          label: 'Ready for Colab',
          icon: <Cpu size={13} />,
          bg: 'rgba(59, 130, 246, 0.15)',
          color: '#60a5fa',
          border: 'rgba(59, 130, 246, 0.3)',
        };
      case 'PROCESSING':
        return {
          label: 'Processing',
          icon: <PlayCircle size={13} className="spin" />,
          bg: 'rgba(139, 92, 246, 0.15)',
          color: '#a78bfa',
          border: 'rgba(139, 92, 246, 0.3)',
        };
      case 'FAILED':
        return {
          label: 'Failed',
          icon: <AlertCircle size={13} />,
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: 'rgba(239, 68, 68, 0.3)',
        };
      default:
        return {
          label: st || 'Pending',
          icon: <Clock size={13} />,
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: 'rgba(245, 158, 11, 0.3)',
        };
    }
  };

  const config = getBadgeConfig(status);

  return (
    <span
      className="badge"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

export default StatusBadge;
