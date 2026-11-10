export const ROLE_LEVELS: Record<string, number> = {
  SUPER_ADMIN: 100,
  ADMIN_IGREJA: 90,
  ADMIN: 90,
  PASTOR: 85,
  LIDER: 60,
  LIDER_MINISTERIO: 60,
  COORDENADOR: 60,
  SECRETARIA: 50,
  FINANCEIRO: 50,
  EDITOR_SITE: 50,
  MUSICO: 20,
  MEMBER: 10,
};

export function roleLevel(role: string | null | undefined): number {
  return role ? ROLE_LEVELS[role] ?? 0 : 0;
}

export function isKnownRole(role: string | null | undefined): boolean {
  return !!role && role in ROLE_LEVELS;
}

export function canAssignRoleByLevel(
  requesterRole: string | null | undefined,
  targetRole: string | null | undefined
): boolean {
  if (!isKnownRole(requesterRole) || !isKnownRole(targetRole)) return false;
  return roleLevel(requesterRole) > roleLevel(targetRole);
}
