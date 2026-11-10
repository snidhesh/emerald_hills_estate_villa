#!/usr/bin/env bash
# Convert source JPGs to dual-tier WebP (2400 full-bleed, 1600 gallery) with
# descriptive slugs. Strips EXIF/ICC. Idempotent — skips existing outputs.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/source/Images"
DST="$ROOT/assets/img/sections"
command -v cwebp >/dev/null || { echo "cwebp missing: brew install webp" >&2; exit 1; }
mkdir -p "$DST"

# "<source file>|<slug>"
MAP=(
  "DSC02965-2-HDR|basement-lounge"
  "DSC02967|media-room"
  "DSC02970|marble-bar"
  "DSC03014-2-HDR|golf-view-suite"
  "DSC03026|suite-bath"
  "DSC03028|suite-lounge"
  "DSC03051-2-HDR|bedroom-suite"
  "DSC03056|vanity"
  "DSC03066-2-HDR|principal-lounge"
  "DSC03088-2-HDR|principal-suite"
  "DSC03093|dressing-room"
  "DSC03094|principal-bath"
  "DSC03131-2-HDR|formal-living-staircase"
  "DSC03141-2-HDR|family-living"
  "DSC03152|family-kitchen"
  "DSC03168-2-HDR|entrance-hall"
  "DSC03198-2-HDR|formal-living"
  "DSC03231-2-HDR|spiral-staircase"
  "DSC03242|garden-pool"
  "DSC03245|pool-loungers"
  "DSC03246|outdoor-kitchen"
  "DSC03247|exterior-terrace"
  "DSC03259|garden-path"
  "DSC03262|reflecting-pool"
  "DSC03263|main-entry"
  "DSC03268|entrance-courtyard"
  "DSC03270|garden-suite"
  "DSC03277|office"
  "DSC03282|sauna-spa"
  "DSC03287-2-HDR|rooftop-gym"
  "DSC03305|rooftop-jacuzzi"
  "DSC03311|pool-aerial"
  "DSC03318|golf-course-view"
)

n=0; skipped=0
for entry in "${MAP[@]}"; do
  file="${entry%%|*}"; slug="${entry##*|}"
  src="$SRC/$file.jpg"
  [ -f "$src" ] || { echo "WARN missing $src" >&2; continue; }
  o24="$DST/$slug-2400.webp"; o16="$DST/$slug-1600.webp"
  if [ -f "$o24" ] && [ -f "$o16" ]; then skipped=$((skipped+1)); continue; fi
  echo "[$((n+1))] $file -> $slug"
  cwebp -quiet -q 82 -resize 2400 0 -m 6 -metadata none "$src" -o "$o24"
  cwebp -quiet -q 78 -resize 1600 0 -m 6 -metadata none "$src" -o "$o16"
  n=$((n+1))
done
echo "Converted: $n   Skipped: $skipped   Output: $(du -sh "$DST" | cut -f1)"
