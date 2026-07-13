# X-O Challenger release runbook

Người vận hành: Tùng. Mọi lần triển khai phải bắt đầu ở `release_mode = 'test'`; việc deploy không đồng nghĩa với cho phép mở live.

## Checklist phát hành

1. Local gate: `npm run test:release`
2. Security gate: `npx supabase db advisors --local`
3. Deploy migration while `release_mode` remains `test`
4. Tùng adds test participants and completes one full test tournament
5. Verify test ledger conservation and unchanged live wallets/ratings
6. Tùng switches `release_mode` to `live`
7. Verify all seven members can open X-O Challenger
8. Rollback: switch mode to `test`; do not reverse completed payouts manually

## Trước khi mở live

- Lưu kết quả của release gate và xác nhận advisor không báo lỗi thuộc bảng/hàm `xo_*` hoặc `citizen_*`.
- Ghi lại số dư ví live và rating trước test. Giải test chỉ được ghi vào scope `test`.
- Trong giải test, kiểm tra đủ 15 trận vòng bảng, lucky member, playoff BO5, khóa cược sau nước đầu tiên và settlement chỉ xuất hiện một lần.
- Kiểm tra tổng ledger test được bảo toàn: tiền trừ vào escrow bằng tiền payout/refund; không sửa ledger hoặc wallet trực tiếp.
- Chỉ Tùng thực hiện nút **Mở live**, sau khi toàn bộ checklist trên đạt.

## Xác minh sau khi mở live

- Đăng nhập lần lượt đủ bảy thành viên và xác nhận tab X-O Challenger hiển thị.
- Kiểm tra một snapshot mới tải được sau khi ngắt/kết nối lại mạng.
- Xác nhận chưa có giải live ngoài ý muốn và số dư/rating live vẫn bằng bản ghi trước test.

## Rollback

Tùng chuyển `release_mode` về `test` để ẩn arena khỏi các tài khoản thường. Không rollback migration khi đang có giải hoặc ledger, và không đảo payout đã hoàn tất bằng thao tác thủ công. Nếu có giải đang hoạt động, dùng luồng **Hủy giải** để hệ thống tự hoàn cược hợp lệ, rồi lưu bằng chứng snapshot/ledger phục vụ điều tra.
