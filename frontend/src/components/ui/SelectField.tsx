import { SelectHTMLAttributes, ReactNode } from 'react';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}

export function SelectField({ label, id, children, ...rest }: Props) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="field">
      <label htmlFor={selectId}>{label}</label>
      <select id={selectId} {...rest}>{children}</select>
    </div>
  );
}
