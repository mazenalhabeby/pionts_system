import type { IconProps } from '../../types';
import Icon from './Icon';

export default function BookIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </Icon>
  );
}
