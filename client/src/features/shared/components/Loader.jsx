import '../styles/components.scss';

const Loader = ({ label = 'Loading', fullScreen = false, className = '' }) => {
  return (
    <div className={`vb-loader${fullScreen ? ' vb-loader--full' : ''} ${className}`.trim()} role="status" aria-live="polite">
      <div className="vb-spinner" aria-hidden="true" />
      <span className="vb-loader__text">{label}</span>
    </div>
  );
};

export default Loader;