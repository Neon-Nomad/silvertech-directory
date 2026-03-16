#!/usr/bin/env bash
# Generate branded PDF tour guides from Markdown source files.
# Requires: pandoc (https://pandoc.org/installing.html)
#
# Usage:
#   bash scripts/generate_tour_pdfs.sh
#
# Output: public/downloads/tour-guide-{care-type}.pdf

set -euo pipefail

GUIDES_DIR="content/tour-guides"
OUTPUT_DIR="public/downloads"

mkdir -p "$OUTPUT_DIR"

CARE_TYPES=(
  "assisted-living"
  "memory-care"
  "nursing-homes"
  "independent-living"
  "residential-care"
  "adult-day-services"
  "ccrc"
)

if ! command -v pandoc &> /dev/null; then
  echo "❌  pandoc not found. Install from https://pandoc.org/installing.html"
  exit 1
fi

for care_type in "${CARE_TYPES[@]}"; do
  SRC="$GUIDES_DIR/$care_type.md"
  OUT="$OUTPUT_DIR/tour-guide-$care_type.pdf"

  if [ ! -f "$SRC" ]; then
    echo "⚠️   Skipping $care_type — source not found at $SRC"
    continue
  fi

  pandoc "$SRC" \
    --pdf-engine=xelatex \
    --variable=geometry:margin=1in \
    --variable=fontsize=11pt \
    --variable=linestretch=1.4 \
    --variable=colorlinks=true \
    --variable=linkcolor="[HTML]{ca8a04}" \
    --variable=urlcolor="[HTML]{ca8a04}" \
    --variable=header-includes="\usepackage{xcolor}" \
    --metadata=title:"SilverTech Directory — Tour Guide" \
    -o "$OUT"

  echo "✅  $OUT"
done

echo ""
echo "Done. Commit public/downloads/*.pdf to deploy."
