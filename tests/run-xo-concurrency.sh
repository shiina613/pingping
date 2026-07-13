#!/usr/bin/env bash
set -euo pipefail

status="$(supabase status -o env)"
export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_ANON_KEY="$(sed -n 's/^ANON_KEY="\(.*\)"$/\1/p' <<<"$status")"
test -n "$SUPABASE_ANON_KEY"
exec node --test tests/xo-concurrency.test.js
