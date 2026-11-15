/**
 * Roles a recipe line can play, in fixed stack order from BOTTOM to TOP
 * (brief §3/§4). The base sits at the bottom of the glass, garnishes on top.
 */
export const ROLES = [
  "base",
  "modifier",
  "sweet",
  "sour",
  "bitter",
  "lengthener",
  "aromatic",
] as const;

export type Role = (typeof ROLES)[number];

/** Position of a role in the stack: 0 = bottom. */
export function roleRank(role: Role): number {
  return ROLES.indexOf(role);
}
