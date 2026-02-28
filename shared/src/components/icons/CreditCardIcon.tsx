import type { IconProps } from '../../types';
import Icon from './Icon';

export default function CreditCardIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </Icon>
  );
}
