import type { IconProps } from '../../types';
import Icon from './Icon';

export default function CheckIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </Icon>
  );
}
