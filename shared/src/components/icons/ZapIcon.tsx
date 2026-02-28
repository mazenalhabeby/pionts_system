import type { IconProps } from '../../types';
import Icon from './Icon';

export default function ZapIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </Icon>
  );
}
