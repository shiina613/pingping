# Sòng X-O Implementation Plan

**Goal:** Thay giải đấu X-O bằng lobby ghép cặp và đặt cược trực tiếp.

- [x] Giữ board nối 5, chuyển sang BO1, rating `+36/-18` và cách chia pool.
- [x] Thay tournament tables bằng match, game, wallet, ledger, rating và bet.
- [x] Thêm RPC mở kèo, nhận/từ chối, cược khán giả và đánh cờ.
- [x] Đổi UI sang Sòng X-O với lobby kèo và lịch sử trận.
- [x] Đồng bộ match/game/wallet/rating/bet qua Realtime.
- [x] Cập nhật unit, schema và frontend contract tests.
- [ ] Chạy migration trên Supabase test trước khi bật `xoArenaEnabled`.
