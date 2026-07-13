# X-O Test Simulation Design

## Goal

Let Tung complete the X-O release gate without manually logging in as every member.

## Design

Add one host-only RPC, `xo_simulate_test_tournament`, callable only by Tung with a valid login code while `release_mode = 'test'`. The RPC completes the current active test tournament, or creates a fresh test tournament if none is active, using deterministic winners and the existing server-side match completion and settlement path.

The RPC must reject live mode and live-scope tournaments. It must not update live wallets or live ratings, because existing settlement logic already limits rating writes to `scope = 'live'` and test wallets are separate.

## UI

Show a compact host action button labeled `Hoàn tất test` next to `Tạo giải`, `Hủy giải`, and `Mở live`. The button calls the new RPC and refreshes the snapshot.

## Testing

Add frontend API/UI tests for the new command and a pgTAP test proving Tung can complete a test tournament and then switch release mode to live.
