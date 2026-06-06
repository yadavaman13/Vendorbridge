import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/components.scss';

const Modal = ({
  open,
  title,
  children,
  footer,
  onClose,
  size = 'md',
  closeOnOverlayClick = true,
  className = '',
}) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="vb-modal__overlay"
      role="presentation"
      onMouseDown={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={`vb-modal vb-modal--${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'vb-modal-title' : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="vb-modal__header">
          {title ? (
            <h2 className="vb-modal__title" id="vb-modal-title">
              {title}
            </h2>
          ) : null}

          <button type="button" className="vb-modal__close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="vb-modal__body">{children}</div>

        {footer ? <div className="vb-modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;