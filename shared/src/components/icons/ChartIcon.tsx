import type { IconProps } from '../../types';
import Icon from './Icon';

export default function ChartIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </Icon>
  );
}
