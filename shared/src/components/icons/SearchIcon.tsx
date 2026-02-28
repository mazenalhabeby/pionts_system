import type { IconProps } from '../../types';
import Icon from './Icon';

export default function SearchIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </Icon>
  );
}
