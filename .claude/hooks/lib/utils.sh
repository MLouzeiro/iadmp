#!/bin/bash
# Shared utility functions for agent hooks.
# Source this file at the top of every hook script.
# Nota: usa node (em vez de python3) para parsear JSON — disponível em qualquer projeto Node/Next.js.

get_tool_name() {
  echo "${CLAUDE_TOOL_NAME:-unknown}"
}

get_tool_input() {
  echo "${CLAUDE_TOOL_INPUT:-}"
}

_get_json_field() {
  local field="$1"
  echo "${CLAUDE_TOOL_INPUT:-}" | node -e '
    let d = "";
    process.stdin.on("data", c => (d += c));
    process.stdin.on("end", () => {
      try {
        const j = JSON.parse(d);
        process.stdout.write(String(j["'"$field"'"] ?? ""));
      } catch (e) {
        process.stdout.write("");
      }
    });
  ' 2>/dev/null || echo ""
}

get_file_path() {
  _get_json_field "filePath"
}

get_bash_command() {
  _get_json_field "command"
}

block() {
  local msg="$1"
  echo "[BLOCKED] $msg" >&2
  exit 2
}

allow() {
  exit 0
}

is_write_tool() {
  local tool
  tool=$(get_tool_name)
  [[ "$tool" == "Write" || "$tool" == "Edit" ]]
}

is_bash_tool() {
  [[ "$(get_tool_name)" == "Bash" ]]
}

file_matches_any() {
  local filepath="$1"
  shift
  for pattern in "$@"; do
    if [[ "$filepath" == $pattern ]]; then
      return 0
    fi
  done
  return 1
}

command_contains_any() {
  local cmd="$1"
  shift
  for pattern in "$@"; do
    if echo "$cmd" | grep -qiE "$pattern"; then
      return 0
    fi
  done
  return 1
}

run_tests_for_module() {
  local module="$1"
  echo "[HOOK] Running tests for module: $module" >&2
  if npm test -- --testPathPattern="$module" 2>&1; then
    echo "[HOOK] Tests passed for module: $module" >&2
    return 0
  else
    echo "[HOOK] TESTS FAILED for module: $module" >&2
    return 1
  fi
}

run_all_tests() {
  echo "[HOOK] Running all tests..." >&2
  if npm test 2>&1; then
    echo "[HOOK] All tests passed" >&2
    return 0
  else
    echo "[HOOK] TESTS FAILED" >&2
    return 1
  fi
}
