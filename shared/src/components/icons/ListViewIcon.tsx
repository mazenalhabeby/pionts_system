import type { IconProps } from '../../types';
import Icon from './Icon';

export default function ListViewIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </Icon>
  );
}
