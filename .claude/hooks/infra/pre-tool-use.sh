#!/bin/bash
# PreToolUse for Infra agent
# Blocks: application code, only allows config/infra files (prisma, configs, env, scripts)
source ".claude/hooks/lib/utils.sh"

if is_write_tool; then
  fp=$(get_file_path)
  if file_matches_any "$fp" \
    "src/app/*" \
    "src/components/*" \
    "src/data/*"
  then
    block "Infra agent cannot modify application code: $fp"
  fi
fi

if is_bash_tool; then
  cmd=$(get_bash_command)
  if command_contains_any "$cmd" \
    "git push"
  then
    block "Infra agent: git push blocked - use only config/setup commands"
  fi
fi

allow
