import type { IconProps } from '../../types';
import Icon from './Icon';

export default function MoreHorizontalIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props} fill="currentColor" stroke="none">
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
      <circle cx="5" cy="12" r="1.5" />
    </Icon>
  );
}
