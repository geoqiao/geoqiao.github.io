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
scratch="$root/.scratch/geo"
ref=$(sed -n 's/^ *uses: geoqiao\/escaping\/export@\([^ #]*\).*/\1/p' "$root/.github/workflows/pages.yml")
if [[ ! "$ref" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "Cannot read the escaping version from the production workflow." >&2
  exit 1
fi
# ESCAPING_SOURCE=/path/to/escaping exports with an unreleased local checkout instead.
exporter_dir=${ESCAPING_SOURCE:-"$scratch/escaping-$ref"}
if [[ -z "${ESCAPING_SOURCE:-}" && ! -d "$exporter_dir/.git" ]]; then
  git init --quiet "$exporter_dir"
  git -C "$exporter_dir" fetch --quiet --depth 1 https://github.com/geoqiao/escaping.git "$ref"
  git -C "$exporter_dir" checkout --quiet --detach FETCH_HEAD
fi

# Token stays in the process environment, never in a config or log file.
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  GITHUB_TOKEN=$(gh auth token)
  export GITHUB_TOKEN
fi
# The same locked install the escaping Action uses, kept outside the checkout.
status=0
UV_PROJECT_ENVIRONMENT="$scratch/runtime-$ref" uv run --project "$exporter_dir" --locked \
  --python 3.14 --no-default-groups --group build --no-build-isolation-package escpe \
  escpe export --config "$root/config.yaml" || status=$?
# 2: exported, but some Issues were skipped; the export output says which.
if (( status != 0 && status != 2 )); then exit "$status"; fi
(cd "$root" && pnpm install --frozen-lockfile && pnpm build)
unset GITHUB_TOKEN
if [[ "${1:-}" == "--build-only" ]]; then exit 0; fi
echo "Geo preview: http://localhost:$port"
exec uv run --no-project --python 3.14 python \
  "$root/scripts/serve_preview.py" --port "$port" --directory "$root/dist"
