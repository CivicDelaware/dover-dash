#!/bin/sh
# Run this once to install the git pre-push hook:
#   sh scripts/install-hooks.sh

HOOK_PATH=".git/hooks/pre-push"

cat > "$HOOK_PATH" << 'HOOK'
#!/bin/sh
# Dover Dash — pre-push hook
# Validates bill classifications with Claude before every push.
# Skip with: git push --no-verify

echo ""
echo "🔍 Running classification validator before push..."
echo ""

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "⚠️  ANTHROPIC_API_KEY not set — skipping validation."
  exit 0
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "⚠️  Supabase env vars not set — skipping validation."
  exit 0
fi

node scripts/validate-classifications.js
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "🛑 Push blocked. Fix flagged issues, or bypass with: git push --no-verify"
fi

exit $EXIT_CODE
HOOK

chmod +x "$HOOK_PATH"
echo "✅ Hook installed at $HOOK_PATH"
