import type { IconProps } from '../../types';
import Icon from './Icon';

export default function CodeIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </Icon>
  );
}
