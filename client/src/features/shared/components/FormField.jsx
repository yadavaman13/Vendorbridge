import { useId } from 'react';
import '../styles/components.scss';

const FormField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  name,
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  options = [],
  rows = 4,
  className = '',
  ...rest
}) => {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const fieldName = name || fieldId;
  const describedById = error ? `${fieldId}-error` : helperText ? `${fieldId}-help` : undefined;
  const isSelect = type === 'select';
  const isTextArea = type === 'textarea';

  return (
    <div className={`vb-form-field ${className}`.trim()}>
      {label ? (
        <label className="vb-form-field__label" htmlFor={fieldId}>
          {label}
          {required ? <span className="vb-form-field__required">*</span> : null}
        </label>
      ) : null}

      {isSelect ? (
        <select
          id={fieldId}
          name={fieldName}
          className={`vb-form-field__control vb-form-field__select${error ? ' is-invalid' : ''}`}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedById}
          required={required}
          {...rest}
        >
          <option value="" disabled>
            {placeholder || `Select ${label || 'an option'}`}
          </option>
          {options.map((option) => {
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;

            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      ) : isTextArea ? (
        <textarea
          id={fieldId}
          name={fieldName}
          className={`vb-form-field__control vb-form-field__textarea${error ? ' is-invalid' : ''}`}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedById}
          placeholder={placeholder}
          rows={rows}
          required={required}
          {...rest}
        />
      ) : (
        <input
          id={fieldId}
          name={fieldName}
          className={`vb-form-field__control vb-form-field__input${error ? ' is-invalid' : ''}`}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedById}
          placeholder={placeholder}
          required={required}
          {...rest}
        />
      )}

      {helperText && !error ? (
        <p className="vb-form-field__help" id={`${fieldId}-help`}>
          {helperText}
        </p>
      ) : null}

      {error ? (
        <p className="vb-form-field__error" id={`${fieldId}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default FormField;