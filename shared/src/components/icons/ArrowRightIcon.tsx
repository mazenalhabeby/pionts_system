import type { IconProps } from '../../types';
import Icon from './Icon';

export default function ArrowRightIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M9 18l6-6-6-6" />
    </Icon>
  );
}
