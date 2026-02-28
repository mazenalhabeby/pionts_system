import type { IconProps } from '../../types';
import Icon from './Icon';

export default function UserIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Icon>
  );
}
