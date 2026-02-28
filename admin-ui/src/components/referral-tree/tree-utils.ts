import type { ReferralNode } from '@pionts/shared';

export function countDescendants(node: ReferralNode): number {
  const children = node.children || [];
  return children.reduce((sum, c) => sum + 1 + countDescendants(c), 0);
}

/** Count nodes at each depth level (0-indexed: 0=direct, 1=L2, etc.) */
export function countByLevel(node: ReferralNode, maxLevels: number = 3): number[] {
  const counts: number[] = new Array(maxLevels).fill(0);
  function walk(n: ReferralNode, depth: number) {
    const children = n.children || [];
    for (const child of children) {
      const lvl = Math.min(depth, maxLevels - 1);
      counts[lvl]++;
      walk(child, depth + 1);
    }
  }
  walk(node, 0);
  return counts;
}

/** Aggregate level counts across multiple root trees */
export function countAllLevels(trees: ReferralNode[], maxLevels: number = 3): number[] {
  const totals: number[] = new Array(maxLevels).fill(0);
  for (const tree of trees) {
    const c = countByLevel(tree, maxLevels);
    for (let i = 0; i < maxLevels; i++) {
      totals[i] += c[i];
    }
  }
  return totals;
}
