import { useId } from 'react'

export function NativePickerField({
  className = '',
  label,
  type,
  value,
  placeholder,
  onChange,
  onInput,
  formatter,
  hideLabel = false,
}) {
  const labelId = useId()
  const displayValue = formatter(value) || placeholder

  return (
    <label className={`scheduler-primary-field ${className}`.trim()}>
      <span id={labelId} className={`scheduler-parent-label${hideLabel ? ' visually-hidden' : ''}`}>
        {label}
      </span>
      <div className="scheduler-native-picker-shell">
        <div className={`scheduler-native-picker-display ${value ? '' : 'is-empty'}`} aria-hidden="true">
          {displayValue}
        </div>
        <input
          className="scheduler-native-picker-input"
          aria-labelledby={labelId}
          type={type}
          value={value}
          onInput={onInput}
          onChange={onChange}
        />
      </div>
    </label>
  )
}
