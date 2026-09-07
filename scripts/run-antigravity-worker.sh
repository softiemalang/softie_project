#!/usr/bin/env bash
# Production Antigravity Worker Runner
# Gemini 3.8 Flash / High fixed model, persistent conversation reuse within workstream,
# explicit session rotation, and usage/cache tracking.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"

WORKDIR="${PROJECT_ROOT}"
STATE_DIR="${PROJECT_ROOT}/.antigravity-worker-state"
mkdir -p "${STATE_DIR}"

DEFAULT_MODEL="gemini-3.8-flash-high"
ADVISORY_MODEL="claude-sonnet-4-6"
MODEL="${DEFAULT_MODEL}"
AGENT="antigravity-worker"
TIMEOUT="120s"
NEW_SESSION=false
SHOW_USAGE=false
IS_ADVISORY=false
PROMPT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--model)
      MODEL="$2"
      shift 2
      ;;
    --advisory)
      MODEL="${ADVISORY_MODEL}"
      IS_ADVISORY=true
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
    --new-session)
      NEW_SESSION=true
      shift
      ;;
    --show-usage)
      SHOW_USAGE=true
      shift
      ;;
    -h|--help)
      echo "Usage: run-antigravity-worker.sh [OPTIONS] \"PROMPT\""
      echo ""
      echo "Options:"
      echo "  -m, --model <MODEL>  Target model: gemini-3.8-flash-high (default) or claude-sonnet-4-6 (advisory)"
      echo "  --advisory           Use Claude Sonnet 4.6 Thinking advisory slot (manual-only, default effort)"
      echo "  --new-session        Start a fresh conversation (reset workstream session for active slot)"
      echo "  --show-usage         Print usage and cache statistics to stderr"
      echo "  -C, --cd <DIR>       Working directory for the agent (default: project root)"
      echo "  -t, --timeout <DUR>  Timeout for agy wait (default: 120s)"
      echo "  -h, --help           Show this help message"
      exit 0
      ;;
    *)
      if [ -z "${PROMPT}" ]; then
        PROMPT="$1"
      else
        echo "ERROR: Unexpected extra argument: $1" >&2
        exit 1
      fi
      shift
      ;;
  esac
done

if [ -z "${PROMPT}" ]; then
  echo "ERROR: Prompt cannot be empty." >&2
  exit 1
fi

# Model allowlist validation
case "${MODEL}" in
  "${DEFAULT_MODEL}")
    IS_ADVISORY=false
    ;;
  "${ADVISORY_MODEL}")
    IS_ADVISORY=true
    ;;
  *)
    echo "ERROR: Model '${MODEL}' is not allowlisted." >&2
    echo "Allowed models:" >&2
    echo "  - Default:  ${DEFAULT_MODEL}" >&2
    echo "  - Advisory: ${ADVISORY_MODEL} (--advisory)" >&2
    exit 1
    ;;
esac

# Ensure timeout has unit
if [[ "${TIMEOUT}" =~ ^[0-9]+$ ]]; then
  TIMEOUT="${TIMEOUT}s"
fi

# Workstream session separation: Flash conversation vs Sonnet Advisory conversation
if [ "${IS_ADVISORY}" = true ]; then
  CONVERSATION_FILE="${STATE_DIR}/conversation_advisory_sonnet"
  USAGE_FILE="${STATE_DIR}/last_usage_advisory_sonnet.json"
else
  CONVERSATION_FILE="${STATE_DIR}/conversation"
  USAGE_FILE="${STATE_DIR}/last_usage.json"
fi

if [ "${NEW_SESSION}" = true ]; then
  rm -f "${CONVERSATION_FILE}"
fi

CONV_ARGS=()
if [ -f "${CONVERSATION_FILE}" ]; then
  EXISTING_CONV="$(cat "${CONVERSATION_FILE}")"
  if [ -n "${EXISTING_CONV}" ]; then
    CONV_ARGS=(--conversation "${EXISTING_CONV}")
  fi
fi

# Run agy non-interactively with json output format
AGY_EXIT=0
RAW_OUTPUT="$(cd "${WORKDIR}" && ANTIGRAVITY_WORKER_ROLE="bounded_worker" agy \
  --model "${MODEL}" \
  --agent "${AGENT}" \
  --add-dir "${WORKDIR}" \
  --dangerously-skip-permissions \
  --output-format json \
  --print-timeout "${TIMEOUT}" \
  ${CONV_ARGS[@]+"${CONV_ARGS[@]}"} \
  -p "${PROMPT}" \
  2>&1 </dev/null)" || AGY_EXIT=$?

if [ "${AGY_EXIT}" -ne 0 ]; then
  echo "ERROR: agy exited with code ${AGY_EXIT}." >&2
  printf '%s\n' "${RAW_OUTPUT}" >&2
  exit "${AGY_EXIT}"
fi

# Parse JSON output safely with python
PARSED_JSON="$(printf '%s\n' "${RAW_OUTPUT}" | python3 -c '
import sys, json

text = sys.stdin.read().strip()
lines = [line.strip() for line in text.splitlines() if line.strip()]
data = None
for line in reversed(lines):
    try:
        data = json.loads(line)
        if isinstance(data, dict) and "conversation_id" in data:
            break
    except Exception:
        continue

if not data:
    try:
        data = json.loads(text)
    except Exception as e:
        sys.stderr.write(f"Failed to parse JSON output: {e}\nRaw: {text[:500]}\n")
        sys.exit(1)

conv_id = data.get("conversation_id", "")
status = data.get("status", "")
response = data.get("response", "")
usage = data.get("usage", {})
num_turns = data.get("num_turns", 1)

print(json.dumps({
    "conversation_id": conv_id,
    "status": status,
    "response": response,
    "usage": usage,
    "num_turns": num_turns
}))
')"

# Extract fields
NEW_CONV_ID="$(printf '%s' "${PARSED_JSON}" | python3 -c 'import sys, json; d=json.load(sys.stdin); print(d.get("conversation_id",""))')"
RESPONSE_TEXT="$(printf '%s' "${PARSED_JSON}" | python3 -c 'import sys, json; d=json.load(sys.stdin); print(d.get("response",""))')"
USAGE_JSON="$(printf '%s' "${PARSED_JSON}" | python3 -c 'import sys, json; d=json.load(sys.stdin); print(json.dumps(d.get("usage",{})))')"

# Persist conversation ID
if [ -n "${NEW_CONV_ID}" ]; then
  printf '%s\n' "${NEW_CONV_ID}" > "${CONVERSATION_FILE}"
fi

# Persist last usage
printf '%s\n' "${USAGE_JSON}" > "${USAGE_FILE}"

if [ "${SHOW_USAGE}" = true ]; then
  python3 -c "
import sys, json
u = json.loads('''${USAGE_JSON}''')
print('=== USAGE & CACHE METRICS ===', file=sys.stderr)
print(f'Model:             ${MODEL}', file=sys.stderr)
print(f'Conversation ID:   ${NEW_CONV_ID}', file=sys.stderr)
print(f'Input tokens:      {u.get(\"input_tokens\", 0):,}', file=sys.stderr)
print(f'Output tokens:     {u.get(\"output_tokens\", 0):,}', file=sys.stderr)
print(f'Thinking tokens:   {u.get(\"thinking_tokens\", 0):,}', file=sys.stderr)
print(f'Cache read tokens: {u.get(\"cache_read_tokens\", 0):,}', file=sys.stderr)
print(f'Total tokens:      {u.get(\"total_tokens\", 0):,}', file=sys.stderr)
print('=============================', file=sys.stderr)
"
fi

# Output clean response
printf '%s\n' "${RESPONSE_TEXT}"
