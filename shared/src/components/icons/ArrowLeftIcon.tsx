import type { IconProps } from '../../types';
import Icon from './Icon';

export default function ArrowLeftIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </Icon>
  );
}
