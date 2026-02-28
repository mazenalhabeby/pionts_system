import type { IconProps } from '../../types';
import Icon from './Icon';

export default function StarIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Icon>
  );
}
