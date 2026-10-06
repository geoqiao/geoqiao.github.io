#!/usr/bin/env bash
# Export the real Issues with the workflow's escaping version, build the site and serve it on loopback.
set -euo pipefail
if [[ $# -gt 1 || ! "${1:-8765}" =~ ^(--build-only|[0-9]{1,5})$ ]]; then
  echo "Usage: $0 [port (1–65535) | --build-only]" >&2
  exit 2
fi
if [[ "${1:-}" != "--build-only" ]]; then
  port=$((10#${1:-8765}))
  if (( port < 1 || port > 65535 )); then
    echo "Preview port must be between 1 and 65535." >&2
    exit 2
  fi
fi
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
package=$(sed -n 's/.*uvx .*\(escaping-site@[0-9.]*\) export.*/\1/p' "$root/.github/workflows/content.yml")
if [[ ! "$package" =~ ^escaping-site@[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Cannot read the escaping version from the production workflow." >&2
  exit 1
fi
# ESCAPING_SOURCE=/path/to/escaping exports with an unreleased local checkout instead.
# It runs from the checkout's own environment: uvx would reuse an earlier build.
escaping=(uvx --python 3.14 "$package")
if [[ -n "${ESCAPING_SOURCE:-}" ]]; then
  escaping=(uv run --project "$(cd "$ESCAPING_SOURCE" && pwd -P)" escaping-site)
fi

# Token stays in the process environment, never in a config or log file.
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  GITHUB_TOKEN=$(gh auth token)
  export GITHUB_TOKEN
fi
status=0
"${escaping[@]}" export --config "$root/config.yaml" || status=$?
# 2: exported, but some Issues were skipped; the export output says which.
if (( status != 0 && status != 2 )); then exit "$status"; fi
# The preview reads its own export; content/ belongs to the workflow.
(cd "$root" && pnpm install --frozen-lockfile && CONTENT_DIR=build/content pnpm build)
unset GITHUB_TOKEN
if [[ "${1:-}" == "--build-only" ]]; then exit 0; fi
echo "Geo preview: http://localhost:$port"
exec uv run --no-project --python 3.14 python \
  "$root/scripts/serve_preview.py" --port "$port" --directory "$root/dist"
