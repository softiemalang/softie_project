#!/usr/bin/env python3
"""
Official PreToolUse Runtime Guard for Antigravity Worker in softie_project.
Enforces:
1. Hard-denial of all subagent creation and management tools.
2. Hard-denial of mutating Git operations (git commit, git push, etc.), allowing only read-only Git.
3. Hard-denial of file/path operations outside active workspacePaths.
4. Permitted operations: workspace-internal read/write/edit, test/build runners, and read-only Git.
"""
import sys
import json
import re
import os
import subprocess

def is_bounded_worker():
    if os.environ.get("ANTIGRAVITY_WORKER_ROLE") == "bounded_worker":
        return True
    try:
        pid = os.getppid()
        for _ in range(10):
            if pid <= 1:
                break
            cmd = subprocess.check_output(["ps", "-p", str(pid), "-o", "command="], stderr=subprocess.DEVNULL).decode().strip()
            if "run-antigravity-worker" in cmd or "/bin/agy " in cmd or cmd.startswith("agy ") or "antigravity-worker" in cmd:
                return True
            ppid_str = subprocess.check_output(["ps", "-p", str(pid), "-o", "ppid="], stderr=subprocess.DEVNULL).decode().strip()
            pid = int(ppid_str)
    except Exception:
        pass
    return False

def main():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            print(json.dumps({"decision": "allow"}))
            return
        data = json.loads(raw)
    except Exception as e:
        print(json.dumps({
            "decision": "deny",
            "reason": f"RUNTIME_GUARD_ERROR: Failed to parse hook input: {e}"
        }))
        return

    tool_call = data.get("toolCall", {})
    tool_name = tool_call.get("name", "")
    tool_args = tool_call.get("args", {})
    workspace_paths = data.get("workspacePaths", [])

    is_worker = is_bounded_worker()

    # Canonicalize workspace paths
    real_workspaces = [os.path.realpath(os.path.abspath(p)) for p in workspace_paths if p]

    # 1. Hard block subagent tools for bounded worker
    if is_worker and tool_name in ["invoke_subagent", "define_subagent", "manage_subagents", "send_message"]:
        print(json.dumps({
            "decision": "deny",
            "reason": f"RUNTIME_GUARD_DENIED: Subagent tool '{tool_name}' is strictly prohibited for this bounded worker."
        }))
        return

    # 2. Command execution inspection
    if tool_name == "run_command":
        cmd = tool_args.get("CommandLine", "")
        # Deny mutating git operations for bounded worker (parent agent owns commit/push)
        if is_worker:
            git_mutating_pattern = r'(?:^|[;&|`$()]\s*|\b(?:sh|bash|zsh)\s+-c\s+[\'"])\s*git\s+(commit|push|merge|rebase|tag|reset|revert|cherry-pick|clean)\b'
            if re.search(git_mutating_pattern, cmd, flags=re.IGNORECASE):
                print(json.dumps({
                    "decision": "deny",
                    "reason": f"RUNTIME_GUARD_DENIED: Mutating Git command is strictly prohibited at runtime. Only read-only Git is allowed; commit/push belongs exclusively to parent agent."
                }))
                return

        # Deny explicit access or redirection to sensitive system paths for all
        forbidden_targets = [r'/etc\b', r'/private/etc\b', r'~/\.ssh\b', r'/\.ssh\b']
        for target in forbidden_targets:
            if re.search(target, cmd):
                print(json.dumps({
                    "decision": "deny",
                    "reason": f"RUNTIME_GUARD_DENIED: Command references restricted system directory ({target})."
                }))
                return

    # 3. Path inspection for file/directory tools
    path_keys = ["AbsolutePath", "TargetFile", "DirectoryPath", "SearchDirectory", "SearchPath"]
    for key in path_keys:
        if key in tool_args:
            raw_path = tool_args[key]
            if not isinstance(raw_path, str) or not raw_path.strip():
                continue
            resolved_path = os.path.realpath(os.path.abspath(os.path.expanduser(raw_path)))

            # Allow paths within registered workspaces or parent workspace root
            # (e.g. /Users/hangyukim/Documents/malang_lab)
            in_workspace = any(
                resolved_path == ws or resolved_path.startswith(ws + os.sep)
                for ws in real_workspaces
            ) or resolved_path.startswith("/Users/hangyukim/Documents/malang_lab")

            # Also allow runtime CLI session directory (brain / artifacts) and registered skill directories
            is_allowed_support_path = (
                "/.gemini/" in resolved_path or
                "/.codex/skills/" in resolved_path or
                "/.codex/codex-router/" in resolved_path
            )

            # Hard deny sensitive system paths
            is_forbidden_system_path = (
                resolved_path == "/etc" or resolved_path.startswith("/etc/") or
                resolved_path == "/private/etc" or resolved_path.startswith("/private/etc/") or
                "/.ssh" in resolved_path
            )

            if is_forbidden_system_path or (is_worker and not in_workspace and not is_allowed_support_path):
                print(json.dumps({
                    "decision": "deny",
                    "reason": f"RUNTIME_GUARD_DENIED: Path '{raw_path}' is outside the active workspace directory."
                }))
                return

    # All checks passed
    print(json.dumps({"decision": "allow"}))

if __name__ == "__main__":
    main()
