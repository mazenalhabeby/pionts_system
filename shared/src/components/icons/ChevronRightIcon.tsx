import type { IconProps } from '../../types';
import Icon from './Icon';

export default function ChevronRightIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <polyline points="9 6 15 12 9 18" />
    </Icon>
  );
}
