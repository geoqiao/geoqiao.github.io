#!/usr/bin/env bash
# Build the real site with its pinned compiler and serve only on loopback.
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
compiler_dir="$scratch/compiler"
runtime_dir="$scratch/runtime"
pin=$(sed -n 's/^      ESCAPING_SHA: //p' "$root/.github/workflows/pages.yml")
if [[ ! "$pin" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Cannot read a complete compiler SHA from the production workflow." >&2
  exit 1
fi
mkdir -p "$scratch"
if [[ ! -d "$compiler_dir/.git" ]]; then
  git clone --quiet --filter=blob:none --no-checkout https://github.com/geoqiao/escaping.git "$compiler_dir"
  git -C "$compiler_dir" checkout --quiet --detach "$pin"
fi
if [[ "$(git -C "$compiler_dir" rev-parse HEAD)" != "$pin" ]]; then
  echo "The preview compiler differs from the workflow pin. Preserve the existing preview and prepare a fresh compiler/runtime." >&2
  exit 1
fi
git -C "$compiler_dir" diff --quiet HEAD
if [[ ! -x "$runtime_dir/bin/escpe" ]]; then
  UV_PROJECT_ENVIRONMENT="$runtime_dir" UV_CACHE_DIR="$scratch/uv-cache" \
    bash "$compiler_dir/starter/.github/scripts/install.sh" "$compiler_dir" "$pin" 3.14 > "$scratch/install.log"
  printf '%s\n' "$pin" > "$scratch/runtime-pin"
fi
if [[ ! -f "$scratch/runtime-pin" || "$(cat "$scratch/runtime-pin")" != "$pin" ]]; then
  echo "The preview runtime has no matching installation record. Prepare a fresh runtime using the theme README." >&2
  exit 1
fi

# Token stays in the process environment, never in a config or log file.
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  GITHUB_TOKEN=$(gh auth token)
  export GITHUB_TOKEN
fi
uv run --no-project --python "$runtime_dir/bin/python" python \
  "$root/theme/build.py" --config "$root/config.yaml"
unset GITHUB_TOKEN
uv run --no-project --python "$runtime_dir/bin/python" python \
  "$root/scripts/render_slug_redirects.py" \
  --map "$root/content-migrations/blog-slugs-2026-08.json" \
  --output output --repository-root "$root"
if [[ "${1:-}" == "--build-only" ]]; then exit 0; fi
echo "Geo preview: http://localhost:$port"
exec uv run --no-project --python "$runtime_dir/bin/python" python \
  "$root/scripts/serve_preview.py" --port "$port" --directory "$root/output"
