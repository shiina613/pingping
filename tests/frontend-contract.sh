#!/usr/bin/env bash
set -euo pipefail

for tab in dashboard competitions planner timeline kanban directory chat settings; do
  grep -q "id=\"tab-$tab\"" index.html
  grep -q "data-tab=\"$tab\"" index.html
done

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

grep -q 'data-theme=' index.html
grep -q "const theme = saved || 'light'" index.html
grep -q 'app.js?v=8' index.html
grep -q "loadData('pp_theme', document.documentElement.dataset.theme" app.js
grep -q 'this.render();' app.js
grep -q -- '--color-accent:' index.css
grep -q 'prefers-color-scheme: dark' index.css
grep -q 'prefers-reduced-motion: reduce' index.css
grep -q 'min-height: 100dvh' index.css
grep -q ':focus-visible' index.css
! grep -q 'fonts.googleapis.com' index.css
! grep -q 'gradient-title' index.html
grep -A8 '@media (max-width: 900px)' index.css | tail -n 8 >/dev/null
