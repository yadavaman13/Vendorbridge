import '../styles/components.scss';

const EmptyState = ({
  title = 'Nothing to show yet',
  description = 'There are no records in this view right now.',
  actionLabel,
  onAction,
  icon,
  className = '',
}) => {
  return (
    <div className={`vb-empty-state ${className}`.trim()}>
      {icon ? <div className="vb-empty-state__icon">{icon}</div> : null}
      <h3 className="vb-empty-state__title">{title}</h3>
      <p className="vb-empty-state__description">{description}</p>
      {actionLabel && onAction ? (
        <button type="button" className="vb-empty-state__action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};

export default EmptyState;