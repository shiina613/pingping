#!/usr/bin/env bash
set -euo pipefail

for tab in dashboard competitions planner timeline kanban directory chat settings; do
  grep -q "id=\"tab-$tab\"" index.html
  grep -q "data-tab=\"$tab\"" index.html
done
grep -q 'id="tab-xo"' index.html
! grep -q 'data-tab="xo"' index.html

for id in login-modal login-code login-submit account-button logout-btn change-code-btn tab-chat chat-room-list chat-message-list chat-new-message-btn chat-compose-form chat-message-input chat-file-input chat-send-btn; do
  grep -q "id=\"$id\"" index.html
done
for id in chat-file-preview chat-file-preview-remove; do
  grep -q "id=\"$id\"" index.html
done
for id in chat-media-lightbox chat-media-lightbox-close chat-media-lightbox-content; do
  grep -q "id=\"$id\"" index.html
done
grep -q 'id="chat-mute-status"' index.html
grep -q 'aria-live="polite"' index.html
grep -q 'role="dialog"' index.html
grep -q '.mp4,.webm,.mov' index.html

grep -q 'data-tab="chat"' index.html
grep -q 'pp_session' collaboration-controller.js
grep -q 'postgres_changes' collaboration-controller.js
grep -q 'chat-files' collaboration-controller.js
grep -q 'PINGPING_CONFIG' config.js
grep -Fq "import './config.js';" app.js
! grep -q '<script src="config.js' index.html
grep -q 'code.md' .vercelignore
grep -q '^note\.md$' .vercelignore
grep -q '^supabase$' .vercelignore
grep -q 'grid-template-columns: minmax(0, 1fr)' index.css
grep -q '.chat-sidebar { min-width: 0; overflow: hidden;' index.css
grep -q '.chat-new-message-btn\[hidden\]' index.css
grep -q '.chat-message-avatar img' index.css
grep -q 'object-fit: cover' index.css
grep -q "chat-message-list')?.addEventListener('scroll'" collaboration-controller.js
grep -q 'id="chat-room-avatar"' index.html
grep -q 'id="chat-room-status"' index.html
grep -q 'aria-label="Gửi tin nhắn"' index.html
grep -q 'body.chat-active' index.css
grep -q '.chat-loading-skeleton' index.css
grep -q '.chat-compose-pill' index.css
grep -q '.chat-group-first' index.css
grep -q '.chat-file-preview' index.css
grep -q '.chat-media-trigger' index.css
grep -q '.chat-media-image' index.css
grep -q '.chat-video-preview' index.css
grep -q '.chat-media-lightbox' index.css
grep -q '.chat-system-message' index.css
grep -q '.chat-mute-status' index.css
grep -Fq '.chat-compose-form.muted' index.css
grep -Fq "classList.toggle('muted', muted)" collaboration-controller.js
grep -q 'max-height: 120px' index.css
grep -q 'prefers-reduced-motion: reduce' index.css
grep -q 'autoResizeComposer' collaboration-controller.js
for id in notification-button notification-badge notification-panel notification-list notification-mark-all browser-notification-toggle browser-notification-status chat-tab-badge; do
  grep -q "id=\"$id\"" index.html
done
grep -q 'class="room-unread-badge"' index.html
grep -q '.notification-panel\[hidden\]' index.css
grep -q '.notification-badge' index.css
grep -q 'loadNotifications' collaboration-controller.js
grep -q 'markAllNotificationsRead' collaboration-controller.js
grep -q 'requestBrowserNotifications' collaboration-controller.js
grep -q "rpc('send_chat_message'" collaboration-controller.js
grep -q 'notificationDocumentTitle(summary.total)' collaboration-controller.js
for id in xo-arena-root xo-board xo-spectator-status xo-threat-flash xo-challenge-form xo-opponent xo-wager xo-open-matches xo-recent-matches xo-leaderboard citizen-points-leaderboard xo-wallet citizen-checkin-button citizen-checkin-status checkin-penalty-modal checkin-penalty-title checkin-penalty-close xo-bets xo-bet-form about-update-button about-update-modal about-update-close; do
  grep -q "id=\"$id\"" index.html
done
grep -q 'xoArenaEnabled' config.js
grep -q 'xoArenaTesterIds' config.js
grep -q 'isXoArenaVisible' app.js
grep -q 'renderXoArena' app.js
grep -q "this.currentTab === 'xo') await this.loadXoCasino()" app.js
grep -q 'const \[grantResult, matchesResult, ratingsResult, walletsResult, checkinResult\] = await Promise.all' app.js
! grep -q "const grantResult = await this.collaboration.client.rpc('xo_grant_monthly_citizen_points'" app.js
grep -q 'About new update' index.html
grep -q 'Bản thử nghiệm, chưa release chính thức' index.html
grep -q '.xo-arena' index.css
grep -q 'Sòng X-O' index.html
grep -q 'BXH điểm công dân' index.html
grep -q 'class="glass-card citizen-checkin-card"' index.html
grep -q 'Mày đã bị trừ 360 điểm' index.html
grep -q 'Đây là trang nội bộ nên không quá để tâm đến vấn đề security' app.js
grep -q 'Xem & cược' app.js
! grep -q 'xo-create-tournament\|xo-standings\|xo-bracket' index.html
grep -q '.xo-cell.last' index.css
grep -q 'Mày sắp chết rồi' app.js
grep -q 'Mày chết rồi' app.js
grep -q 'notifyXoThreat' app.js
grep -q 'animation: xoThreatFlash 3.6s' index.css
grep -q '.about-update-button' index.css
grep -q '.about-update-modal' index.css
! grep -q 'Vietnam AI Innovation' index.html
! grep -q "id: 'aichallenge'" src/constants.js
! grep -q 'aichallenge\.team' app.js
! grep -q 'Build@HUB' index.html
! grep -q "id: 'buildhub'" src/constants.js
! grep -q 'buildhub\.team' app.js
grep -q "2026-08-04T23:59:00+07:00" src/constants.js
grep -q 'Vòng 2 - Sơ khảo (15–18/08)' src/constants.js
grep -q 'Vòng 3 - Chung kết (09–10/09)' src/constants.js

grep -q 'data-theme=' index.html
grep -q "const theme = saved || 'light'" index.html
grep -q 'app.js?v=9' index.html
grep -q 'index.css?v=9' index.html
grep -q "loadData('pp_theme', document.documentElement.dataset.theme" app.js
grep -q 'this.render();' app.js
grep -q 'id="competition-countdowns"' index.html
grep -q 'getCompetitionCountdowns' app.js
for legacy_countdown_id in countdown-comp-name cd-days cd-hours cd-minutes cd-seconds; do
  ! grep -q "id=\"$legacy_countdown_id\"" index.html
done
grep -q -- '--color-accent:' index.css
grep -q 'prefers-color-scheme: dark' index.css
grep -q 'prefers-reduced-motion: reduce' index.css
grep -q 'min-height: 100dvh' index.css
grep -q ':focus-visible' index.css
! grep -q 'fonts.googleapis.com' index.css
! grep -q 'gradient-title' index.html
grep -A8 '@media (max-width: 900px)' index.css | tail -n 8 >/dev/null

test "$(grep -o 'class="tab-label"' index.html | wc -l)" -eq 9
grep -q 'aria-label="Bảng điều khiển" title="Bảng điều khiển"' index.html
grep -q 'container-type: inline-size' index.css
grep -q '@container (max-width:' index.css
grep -q '\.tab-label' index.css
grep -q 'flex: 1 1 0' index.css
