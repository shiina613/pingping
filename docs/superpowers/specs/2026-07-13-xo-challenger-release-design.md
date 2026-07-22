# Sòng X-O Design

**Date:** 2026-07-13  
**Status:** Test rollout

## Goal

Sòng X-O là khu ghép đấu nối 5 nội bộ. Không có mùa giải, vòng bảng, hạt giống hay playoff. Một thành viên chọn đối thủ và mức cược; đối thủ nhận hoặc từ chối kèo.

## Luồng kèo

1. Người thách đấu chọn một thành viên đang rảnh và đặt cược ít nhất 1 điểm.
2. Điểm của người thách đấu được ký quỹ ngay.
3. Đối thủ nhận kèo bằng cách ký quỹ cùng số điểm, hoặc từ chối để hoàn tiền.
4. Người mở kèo có thể hủy khi kèo chưa được nhận.
5. Hai người đấu BO1 nối 5 trên board 9x9 tự mở rộng, tối đa 36x36.
6. Người thắng trận nhận toàn bộ tiền kèo, `+36` rating; người thua nhận `-18` rating.

Mỗi người chỉ tham gia một kèo `pending` hoặc `active` tại một thời điểm.

## Cược khán giả

Khán giả được chọn một trong hai người và đặt một pool bet trước nước đi đầu tiên. Hai người đang đấu không được cược pool trận của mình. Pool thắng nhận lại stake và chia pool thua theo tỷ lệ stake; nếu một phía không có cược thì hoàn toàn bộ.

## Dữ liệu và realtime

- `xo_matches`: lời thách đấu, mức cược và kết quả BO1.
- `xo_games`: lượt đánh, nước đi và bounds của từng ván.
- `xo_bets`: pool cược khán giả.
- `citizen_wallets`, `citizen_point_ledger`: số dư và lịch sử điểm.
- `xo_ratings`: rating, thắng và thua.

Mọi thao tác dùng RPC; thay đổi match, game, rating, wallet và bet được phát qua Supabase Realtime.

## UI

Tab mang tên **Sòng X-O** gồm form mở kèo, bàn đấu đang chọn, ví điểm, pool cược, kèo đang mở, lịch sử gần đây và BXH rating. Đối thủ nhận/từ chối ngay trong danh sách kèo.

## Kiểm thử tối thiểu

- Board nối 5 và mở rộng đúng giới hạn.
- Mọi kèo là BO1.
- Rating giữ nguyên `+36/-18`.
- RPC tạo/nhận/từ chối kèo và ký quỹ tồn tại.
- Pool payout bảo toàn tổng điểm.
