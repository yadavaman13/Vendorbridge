import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import '../styles/components.scss';

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
};

const Toast = ({
  open,
  variant = 'info',
  title,
  message,
  onClose,
  duration,
  className = '',
}) => {
  useEffect(() => {
    if (!open || !duration || !onClose) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) {
    return null;
  }

  const Icon = iconMap[variant] || iconMap.info;

  return (
    <div className={`vb-toast vb-toast--${variant} ${className}`.trim()} role={variant === 'error' ? 'alert' : 'status'} aria-live="polite">
      <Icon className="vb-toast__icon" size={18} aria-hidden="true" />
      <div className="vb-toast__content">
        {title ? <strong className="vb-toast__title">{title}</strong> : null}
        {message ? <p className="vb-toast__message">{message}</p> : null}
      </div>
      {onClose ? (
        <button type="button" className="vb-toast__close" onClick={onClose} aria-label="Dismiss notification">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
};

export default Toast;