import type { IconProps } from '../../types';
import Icon from './Icon';

export default function ChevronsUpDownIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </Icon>
  );
}
