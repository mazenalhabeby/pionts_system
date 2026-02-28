import type { IconProps } from '../../types';
import Icon from './Icon';

export default function ChevronLeftIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <polyline points="15 18 9 12 15 6" />
    </Icon>
  );
}
