import type { IconProps } from '../../types';
import Icon from './Icon';

export default function ExternalLinkIcon({ size = 24, ...props }: IconProps) {
  return (
    <Icon size={size} {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </Icon>
  );
}
