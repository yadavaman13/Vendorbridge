import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import '../styles/components.scss';

const iconMap = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
};

const Alert = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const Icon = iconMap[variant] || iconMap.info;

  return (
    <div className={`vb-alert vb-alert--${variant} ${className}`.trim()} role={variant === 'error' ? 'alert' : 'status'}>
      <Icon className="vb-alert__icon" size={18} aria-hidden="true" />
      <div className="vb-alert__content">
        {title ? <strong className="vb-alert__title">{title}</strong> : null}
        {children ? <div className="vb-alert__message">{children}</div> : null}
      </div>
      {onClose ? (
        <button type="button" className="vb-alert__close" onClick={onClose} aria-label="Dismiss alert">
          ×
        </button>
      ) : null}
    </div>
  );
};

export default Alert;