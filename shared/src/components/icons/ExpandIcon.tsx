import type { IconProps } from '../../types';
import Icon from './Icon';

export default function ExpandIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <polyline points="7 13 12 18 17 13" />
      <polyline points="7 6 12 11 17 6" />
    </Icon>
  );
}
