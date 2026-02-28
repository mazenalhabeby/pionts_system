import type { IconProps } from '../../types';
import Icon from './Icon';

export default function DashboardIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  );
}
