import type { IconProps } from '../../types';
import Icon from './Icon';

export default function ChevronDownIcon({ size = 24, strokeWidth = 2.5, ...props }: IconProps) {
  return (
    <Icon size={size} strokeWidth={strokeWidth} {...props}>
      <polyline points="6 9 12 15 18 9" />
    </Icon>
  );
}
