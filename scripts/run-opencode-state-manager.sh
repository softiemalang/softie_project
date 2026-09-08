#!/usr/bin/env bash
# Production Read-Only Persistent State Reconstruction Manager Runner
# Model: Gemini 3.5 Flash Lite (opencode/gemini-3.5-flash-lite)
# Variant: High (fixed maximum reasoning effort)
# Session: Workstream-scoped persistent session (--new-session to rotate)
# Permissions: Read-only Git and workspace inspection; hard-denial on write/edit/mutating git/subagents/external-paths.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"

WORKDIR="${PROJECT_ROOT}"
STATE_DIR="${PROJECT_ROOT}/.zen-state-manager-state"
mkdir -p "${STATE_DIR}"

MODEL="gemini-3.5-flash-lite"
VARIANT="high"
TIMEOUT=120
NEW_SESSION=false
SHOW_USAGE=false
CUSTOM_PROMPT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --new-session)
      NEW_SESSION=true
      shift
      ;;
    --show-usage)
      SHOW_USAGE=true
      shift
      ;;
    -C|--cd)
      WORKDIR="$2"
      shift 2
      ;;
    -t|--timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: run-opencode-state-manager.sh [OPTIONS] [\"PROMPT\"]"
      echo ""
      echo "Options:"
      echo "  --new-session        Start a fresh workstream session (reset persistent session)"
      echo "  --show-usage         Print usage, reasoning, cache, and cost metrics to stderr"
      echo "  -C, --cd <DIR>       Working directory for the agent (default: project root)"
      echo "  -t, --timeout <SECS> Timeout in seconds (default: 120)"
      echo "  -h, --help           Show this help message"
      exit 0
      ;;
    *)
      if [ -z "${CUSTOM_PROMPT}" ]; then
        CUSTOM_PROMPT="$1"
      else
        echo "ERROR: Unexpected extra argument: $1" >&2
        exit 1
      fi
      shift
      ;;
  esac
done

# Standard State Reconstruction Prompt Contract
DEFAULT_PROMPT='당신은 리포지토리의 read-only persistent state reconstruction manager입니다.
세션 메모리는 권한(authority)이 아니므로, 반드시 먼저 bash 도구(git status, git rev-parse HEAD, git branch --show-current, git log -n 5 --oneline 등) 및 read 도구를 직접 실행하여 현재의 정확한 커밋 해시, 브랜치, 워킹 트리 상태(수정/삭제/신규 untracked 파일 등)를 실시간으로 확인하고, 다음 7개 항목으로 구성된 간결하고 정밀한 STATE_PACKET을 작성해줘:

- Previous known state
- Observed changes
- Current verified state
- Open frontier / unresolved blockers
- Relevant dirty/untracked boundaries
- Recommended handoff / next files to inspect
- Uncertainty / facts requiring parent verification

주의 사항:
1. 반드시 먼저 bash 도구로 git status, git rev-parse HEAD 등을 직접 호출하여 실제 파일 시스템 변경사항을 확인한 후 작성해야 해 (이전 턴의 기억에만 의존하지 말 것).
2. 일반론적인 조언 대신 실제 AGENTS.md와 리포지토리 파일 계약을 최우선 근거로 삼아야 해.
3. 추측으로 채우지 말고 확인되지 않은 사실은 Uncertainty로 명확히 분리해줘.
4. 짧고 실용적인 압축 품질을 유지해줘.
5. 출력은 반드시 ### STATE_PACKET 으로 시작하고, 인사말이나 도구 호출 예고 등 사전 설명 문구는 일체 출력하지 마.'

if [ -n "${CUSTOM_PROMPT}" ]; then
  FINAL_PROMPT="${DEFAULT_PROMPT}

[추가 사용자 지침]
${CUSTOM_PROMPT}"
else
  FINAL_PROMPT="${DEFAULT_PROMPT}"
fi

# Locate OpenCode binary
OC_BIN=""
CANDIDATE_PATHS=(
  "${PROJECT_ROOT}/../malang_lab/experiments/opencode_zen_worker/node_modules/.bin/opencode"
  "/Users/hangyukim/Documents/malang_lab/experiments/opencode_zen_worker/node_modules/.bin/opencode"
)

for p in "${CANDIDATE_PATHS[@]}"; do
  if [ -x "${p}" ]; then
    OC_BIN="${p}"
    break
  fi
done

if [ -z "${OC_BIN}" ]; then
  if command -v opencode >/dev/null 2>&1; then
    OC_BIN="$(command -v opencode)"
  else
    echo "ERROR: opencode executable not found in candidate paths." >&2
    exit 1
  fi
fi

# Keychain credential retrieval
KEYCHAIN_KEY="$(security find-generic-password -s "opencode-zen" -a "${USER}" -w 2>/dev/null || true)"
if [ -z "${KEYCHAIN_KEY}" ]; then
  echo "ERROR: Zen workspace API key not found in macOS Keychain (service: opencode-zen, account: ${USER})." >&2
  exit 1
fi

# Worker state & XDG isolation
mkdir -p \
  "${STATE_DIR}/config/opencode" \
  "${STATE_DIR}/data" \
  "${STATE_DIR}/cache" \
  "${STATE_DIR}/state"

# Idempotent strict read-only configuration
cat > "${STATE_DIR}/config/opencode/opencode.json" << 'OCEOF'
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/gemini-3.5-flash-lite",
  "compaction": {
    "auto": true,
    "prune": false,
    "reserved": 10000
  },
  "permission": {
    "read": "allow",
    "edit": "deny",
    "glob": "allow",
    "grep": "allow",
    "list": "allow",
    "task": "deny",
    "external_directory": "deny",
    "bash": {
      "git status*": "allow",
      "git diff*": "allow",
      "git log*": "allow",
      "git rev-parse*": "allow",
      "git branch*": "allow",
      "git commit*": "deny",
      "git push*": "deny"
    }
  }
}
OCEOF

# Workstream persistent session management
SESSION_FILE="${STATE_DIR}/session"
USAGE_FILE="${STATE_DIR}/last_usage.json"

if [ "${NEW_SESSION}" = true ]; then
  rm -f "${SESSION_FILE}"
fi

SESSION_ARGS=()
if [ -f "${SESSION_FILE}" ]; then
  EXISTING_SESSION="$(cat "${SESSION_FILE}")"
  if [ -n "${EXISTING_SESSION}" ]; then
    SESSION_ARGS=(--session "${EXISTING_SESSION}")
  fi
fi

# Run OpenCode non-interactively with streaming JSON
OC_EXIT=0
RAW_OUTPUT="$(XDG_DATA_HOME="${STATE_DIR}/data" \
  XDG_CACHE_HOME="${STATE_DIR}/cache" \
  XDG_CONFIG_HOME="${STATE_DIR}/config" \
  XDG_STATE_HOME="${STATE_DIR}/state" \
  OPENCODE_API_KEY="${KEYCHAIN_KEY}" \
  perl -e 'alarm shift; exec @ARGV' "${TIMEOUT}" \
  "${OC_BIN}" run \
  --dir "${WORKDIR}" \
  --model "opencode/${MODEL}" \
  --variant "${VARIANT}" \
  --format json \
  ${SESSION_ARGS[@]+"${SESSION_ARGS[@]}"} \
  "${FINAL_PROMPT}" \
  2>&1 </dev/null)" || OC_EXIT=$?

if [ "${OC_EXIT}" -ne 0 ]; then
  echo "ERROR: OpenCode exited with code ${OC_EXIT}." >&2
  printf '%s\n' "${RAW_OUTPUT}" >&2
  exit "${OC_EXIT}"
fi

# Parse output text and metrics
PARSED_RESULT="$(printf '%s\n' "${RAW_OUTPUT}" | python3 -c '
import sys, json

session_id = ""
texts = []
input_tokens = 0
output_tokens = 0
reasoning_tokens = 0
cache_read_tokens = 0
total_tokens = 0
total_cost = 0.0

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    try:
        e = json.loads(line)
        if not session_id and e.get("sessionID"):
            session_id = e.get("sessionID")
        if e.get("type") == "text":
            part = e.get("part", {})
            t = part.get("text", "")
            if t:
                texts.append(t)
        elif e.get("type") == "step_finish":
            part = e.get("part", {})
            toks = part.get("tokens", {})
            input_tokens += toks.get("input", 0)
            output_tokens += toks.get("output", 0)
            reasoning_tokens += toks.get("reasoning", 0)
            cache = toks.get("cache", {})
            cache_read_tokens += cache.get("read", 0)
            total_tokens += toks.get("total", 0)
            total_cost += float(part.get("cost", 0.0))
    except Exception:
        pass

resp = "".join(texts).strip()
for marker in ["### STATE_PACKET", "# STATE_PACKET"]:
    if marker in resp:
        resp = resp[resp.index(marker):]
        break

print(json.dumps({
    "session_id": session_id,
    "response": resp,
    "usage": {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "reasoning_tokens": reasoning_tokens,
        "cache_read_tokens": cache_read_tokens,
        "total_tokens": total_tokens,
        "cost": total_cost
    }
}))
')"

SESSION_ID="$(printf '%s' "${PARSED_RESULT}" | python3 -c 'import sys, json; print(json.load(sys.stdin).get("session_id",""))')"
RESPONSE_TEXT="$(printf '%s' "${PARSED_RESULT}" | python3 -c 'import sys, json; print(json.load(sys.stdin).get("response",""))')"
USAGE_JSON="$(printf '%s' "${PARSED_RESULT}" | python3 -c 'import sys, json; print(json.dumps(json.load(sys.stdin).get("usage",{})))')"

# Persist session and last usage
if [ -n "${SESSION_ID}" ]; then
  printf '%s\n' "${SESSION_ID}" > "${SESSION_FILE}"
fi
printf '%s\n' "${USAGE_JSON}" > "${USAGE_FILE}"

if [ "${SHOW_USAGE}" = true ]; then
  python3 -c "
import sys, json
u = json.loads('''${USAGE_JSON}''')
print('=== OPENCODE STATE MANAGER USAGE & METRICS ===', file=sys.stderr)
print('Model:            ${MODEL}', file=sys.stderr)
print('Variant:          ${VARIANT}', file=sys.stderr)
print('Session ID:       ${SESSION_ID}', file=sys.stderr)
print(f'Input tokens:     {u.get(\"input_tokens\", 0):,}', file=sys.stderr)
print(f'Output tokens:    {u.get(\"output_tokens\", 0):,}', file=sys.stderr)
print(f'Reasoning tokens: {u.get(\"reasoning_tokens\", 0):,}', file=sys.stderr)
print(f'Cache read:       {u.get(\"cache_read_tokens\", 0):,}', file=sys.stderr)
print(f'Total tokens:     {u.get(\"total_tokens\", 0):,}', file=sys.stderr)
print(f'Actual cost:      \${u.get(\"cost\", 0.0):.6f}', file=sys.stderr)
print('=========================================', file=sys.stderr)
"
fi

# Emit clean response to stdout
printf '%s\n' "${RESPONSE_TEXT}"
