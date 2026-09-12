import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

export function Button({ variant = 'primary', block, className = '', ...rest }: Props) {
  const variantClass = `btn-${variant}`;
  return <button className={`btn ${variantClass} ${block ? 'btn-block' : ''} ${className}`} {...rest} />;
}
