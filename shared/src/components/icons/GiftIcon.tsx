import type { IconProps } from '../../types';
import Icon from './Icon';

export default function GiftIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
      <path d="M2 8h20v4H2z" />
      <path d="M12 20V8" />
      <path d="M12 8l-4-4" />
      <path d="M12 8l4-4" />
    </Icon>
  );
}
