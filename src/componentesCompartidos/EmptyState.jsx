import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import './EmptyState.css';

function renderAction(action, key) {
  if (!action) return null;
  const {
    label, to, onClick, variant = 'primary', icon: ActionIcon, disabled = false,
  } = action;
  const className = `empty-state__btn empty-state__btn--${variant}`;

  if (to && !disabled) {
    return (
      <Link key={key} className={className} to={to}>
        {ActionIcon ? <ActionIcon size={15} aria-hidden="true" focusable="false" /> : null}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button key={key} type="button" className={className} onClick={onClick} disabled={disabled}>
      {ActionIcon ? <ActionIcon size={15} aria-hidden="true" focusable="false" /> : null}
      <span>{label}</span>
    </button>
  );
}

function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  tone = 'neutral',
  size = 'md',
  className = '',
  children,
}) {
  const classes = [
    'empty-state',
    `empty-state--${tone}`,
    `empty-state--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <section className={classes} role="status">
      <Icon className="empty-state__icon" size={size === 'sm' ? 23 : 29} aria-hidden="true" focusable="false" />
      {title ? <h3 className="empty-state__title">{title}</h3> : null}
      {description ? <p className="empty-state__description">{description}</p> : null}
      {children}
      {action || secondaryAction ? (
        <div className="empty-state__actions">
          {renderAction(action, 'primary')}
          {renderAction(secondaryAction, 'secondary')}
        </div>
      ) : null}
    </section>
  );
}

export default memo(EmptyState);
