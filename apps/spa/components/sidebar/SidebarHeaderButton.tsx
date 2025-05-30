import clsx from 'clsx';
import React from 'react';
import { type ReactNode } from 'react';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  isLoading?: boolean;
  active?: boolean;
  size?: 'small' | 'medium';
  ref?: React.Ref<HTMLButtonElement>;
}

export const SidebarHeaderButton = ({
  icon,
  children,
  className,
  onClick,
  active = false,
  isLoading = false,
  size = 'medium',
  ref,
  ...props
}: Props) => {
  return (
    <button
      ref={ref}
      onClick={isLoading ? undefined : onClick}
      aria-pressed={active}
      className={clsx(
        'inline-flex items-center gap-1 rounded-sm px-1.5 py-1.5',
        active
          ? 'bg-switch-pressed-bg text-switch-pressed-text shadow-inner'
          : 'hover:bg-button-light-hover-bg active:bg-surface-200',
        isLoading ? 'animate-pulse cursor-wait' : 'cursor-pointer',
        size === 'medium' ? 'text-sm' : '',
        size === 'small' ? 'text-xs' : '',
        className,
      )}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};
