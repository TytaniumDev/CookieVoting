import type { Cookie } from '@cookie-voting/shared'

/** Story data: the trees plate from `fixtures/plates`, served by Storybook at /plates. */
export const treesPhoto = { url: '/plates/6-cookies_trees.jpg', width: 2048, height: 1536 }

export const trees: Cookie[] = [
  { id: 't1', box: { x: 0.145, y: 0.205, width: 0.202, height: 0.3065 } },
  { id: 't2', box: { x: 0.394, y: 0.197, width: 0.211, height: 0.323 } },
  { id: 't3', box: { x: 0.665, y: 0.204, width: 0.202, height: 0.3005 } },
  { id: 't4', box: { x: 0.12, y: 0.565, width: 0.22, height: 0.329 } },
  { id: 't5', box: { x: 0.4, y: 0.55, width: 0.239, height: 0.35 } },
  { id: 't6', box: { x: 0.668, y: 0.545, width: 0.237, height: 0.34 } },
]
