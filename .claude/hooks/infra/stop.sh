#!/bin/bash
# Stop hook for Infra agent
# Validates Prisma schema (blocking) before finishing.
# O typecheck é apenas informativo: o projeto tem typescript.ignoreBuildErrors=true
# e erros pré-existentes de tipo fora do escopo do harness.
source ".claude/hooks/lib/utils.sh"

echo "[HOOK] Validating Prisma schema..." >&2
if ! npx prisma validate 2>&1; then
  echo "[HOOK] Prisma schema invalid - fix before finishing." >&2
  exit 2
fi

echo "[HOOK] TypeScript check (informativo, não bloqueia)..." >&2
if ! npx tsc --noEmit 2>&1; then
  echo "[HOOK] Warning: há erros de tipo pré-existentes (fora do escopo desta task)." >&2
fi

allow
