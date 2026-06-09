#!/usr/bin/env bash
# Publish apps/docs as the public Router-Labs/solrouter-docs repo.
#
# The monorepo (Router-Labs/SolRouter) stays the single source of truth. This
# mirrors the apps/docs subtree out to the public repo so external readers and
# contributors have a current point of contact for the docs.
#
# Run from anywhere in the repo, on the branch you want to publish (normally
# main, after docs changes have merged):
#   bash apps/docs/scripts/publish-mirror.sh
#
# It force-pushes the split subtree to solrouter-docs/main, replacing whatever
# is there. It prompts before doing so.
set -euo pipefail

REMOTE_NAME="solrouter-docs"
REMOTE_URL="https://github.com/Router-Labs/solrouter-docs.git"
PREFIX="apps/docs"
TARGET_BRANCH="main"

cd "$(git rev-parse --show-toplevel)"

if ! git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  echo "Adding remote $REMOTE_NAME -> $REMOTE_URL"
  git remote add "$REMOTE_NAME" "$REMOTE_URL"
fi

echo "Splitting '$PREFIX' subtree from $(git rev-parse --abbrev-ref HEAD)…"
SPLIT_SHA="$(git subtree split --prefix="$PREFIX" HEAD)"

echo
echo "This force-pushes the '$PREFIX' subtree to ${REMOTE_NAME}/${TARGET_BRANCH},"
echo "REPLACING the public repo's current content."
echo "  split commit: $SPLIT_SHA"
read -r -p "Continue? [y/N] " ans
[ "${ans:-}" = "y" ] || { echo "Aborted."; exit 1; }

git push "$REMOTE_NAME" "${SPLIT_SHA}:refs/heads/${TARGET_BRANCH}" --force
echo "Published apps/docs to ${REMOTE_URL} (${TARGET_BRANCH})."
