import type { IconProps } from '../../types';
import Icon from './Icon';

export default function CollapseIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <polyline points="17 11 12 6 7 11" />
      <polyline points="17 18 12 13 7 18" />
    </Icon>
  );
}
