import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  MAX_FILE_SIZE,
  aggregateUnreadNotifications,
  attachmentKind,
  buildCalendar,
  canShowBrowserNotification,
  chatSendResult,
  effectiveMemberName,
  formatBrowserNotification,
  formatMuteCountdown,
  getTeamSizeWarning,
  notificationDocumentTitle,
  sanitizeFileName,
  validateLoginCode,
  validateMessage,
  validateUpload
} from '../collaboration.js';
import {
  CollaborationController,
  attachmentMarkup,
  avatarMarkup,
  chronologicalMessages,
  decorateMessages,
  escapeHtml,
  isNearBottom,
  mapRemoteSnapshot,
  shouldAppendMessage,
  shouldSendOnEnter
} from '../collaboration-controller.js';

test('muted members have a temporary effective name and countdown', () => {
  const now = new Date('2026-07-01T00:00:00Z');
  const future = '2026-07-01T00:04:59Z';
  const past = '2026-06-30T23:59:59Z';
  assert.equal(effectiveMemberName({ name: 'Tùng', chat_muted_until: future }, now), 'Súc vật Tùng');
  assert.equal(effectiveMemberName({ name: 'Tùng', chat_muted_until: past }, now), 'Tùng');
  assert.equal(formatMuteCountdown(future, now), '04:59');
  assert.equal(formatMuteCountdown(past, now), '00:00');
});

test('notification document title mirrors exact unread totals', () => {
  assert.equal(notificationDocumentTitle(3), '(3) PingPing');
  assert.equal(notificationDocumentTitle(0), 'PingPing');
  assert.equal(notificationDocumentTitle(-2), 'PingPing');
});

test('chat RPC results normalize sent and muted outcomes', () => {
  const future = '2026-07-01T00:05:00Z';
  assert.deepEqual(chatSendResult({ status: 'sent', message_id: 'message-1' }), {
    accepted: true,
    messageId: 'message-1',
    mutedUntil: null,
    message: ''
  });
  assert.deepEqual(chatSendResult({ status: 'muted', muted_until: future }), {
    accepted: false,
    messageId: null,
    mutedUntil: future,
    message: 'Đã bị khóa mõm.'
  });
  assert.equal(chatSendResult({ status: 'rate_limited', muted_until: future }).message, 'Bạn đã bị khóa mõm 5 phút.');
  assert.throws(() => chatSendResult({ status: 'unknown' }), /không hợp lệ/i);
});

test('login codes are trimmed but otherwise remain raw', () => {
  assert.equal(validateLoginCode('  PP-TUNG-2026  '), 'PP-TUNG-2026');
  assert.throws(() => validateLoginCode('   '), /mã đăng nhập/i);
});

test('messages require text or a file and cap text at 4000 characters', () => {
  assert.deepEqual(validateMessage('  xin chào  ', null), { text: 'xin chào', attachment: null });
  assert.deepEqual(validateMessage('', { id: 'file-1' }), { text: '', attachment: { id: 'file-1' } });
  assert.throws(() => validateMessage(' ', null), /trống/i);
  assert.throws(() => validateMessage('x'.repeat(4001), null), /4\.000/);
});

test('uploads allow common team files up to 25 MB', () => {
  assert.equal(MAX_FILE_SIZE, 25 * 1024 * 1024);
  assert.equal(validateUpload({ name: 'pitch deck.pdf', size: MAX_FILE_SIZE }).name, 'pitch deck.pdf');
  assert.equal(validateUpload({ name: 'demo.mp4', size: 1024 }).name, 'demo.mp4');
  assert.equal(validateUpload({ name: 'demo.webm', size: 1024 }).name, 'demo.webm');
  assert.equal(validateUpload({ name: 'demo.mov', size: 1024 }).name, 'demo.mov');
  assert.throws(() => validateUpload({ name: 'run.exe', size: 10 }), /định dạng/i);
  assert.throws(() => validateUpload({ name: 'large.zip', size: MAX_FILE_SIZE + 1 }), /25 MB/i);
});

test('attachment kind prefers MIME type and falls back to file extension', () => {
  assert.equal(attachmentKind({ name: 'photo.bin', mime_type: 'image/png' }), 'image');
  assert.equal(attachmentKind({ name: 'clip.bin', mime_type: 'video/mp4' }), 'video');
  assert.equal(attachmentKind({ name: 'photo.webp', mime_type: '' }), 'image');
  assert.equal(attachmentKind({ name: 'clip.MOV', mime_type: 'application/octet-stream' }), 'video');
  assert.equal(attachmentKind({ name: 'brief.pdf', mime_type: 'application/pdf' }), 'file');
});

test('upload validation preserves the original File payload', () => {
  const file = new File(['pdf-content'], 'brief.pdf', { type: 'application/pdf' });
  assert.equal(validateUpload(file), file);
});

test('storage paths cannot contain unsafe file name characters', () => {
  assert.equal(sanitizeFileName('../../kế hoạch 1.pdf'), 'ke_hoach_1.pdf');
});

test('remote rows map to the portal member, allocation and task shapes', () => {
  const snapshot = mapRemoteSnapshot({
    members: [{ id: 'tung', name: 'Tùng', login_code: 'secret' }],
    allocations: [{ competition_id: 'onevoice', data: { members: ['tung'] } }],
    tasks: [{ id: 'task-1', competition_id: 'onevoice', title: 'Demo', description: 'Desc', assignee_id: 'tung', column_id: 'todo' }]
  });
  assert.equal(snapshot.members[0].login_code, undefined);
  assert.deepEqual(snapshot.allocations.onevoice, { members: ['tung'] });
  assert.deepEqual(snapshot.kanbanTasks.onevoice[0], { id: 'task-1', title: 'Demo', desc: 'Desc', assignee: 'tung', column: 'todo' });
});

test('chat text is escaped before rendering', () => {
  assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
});

test('message self-join uses a PostgREST computed relationship', () => {
  const source = readFileSync(new URL('../collaboration-controller.js', import.meta.url), 'utf8');
  assert.match(source, /reply_to\(id,text,kind/);
  assert.doesNotMatch(source, /reply_to:messages!/);
});

test('chat avatars render image data as a contained image', () => {
  const markup = avatarMarkup({ name: 'Tùng', avatar: 'data:image/png;base64,abc' }, 'chat-message-avatar');
  assert.match(markup, /<img src="data:image\/png;base64,abc"/);
  assert.match(markup, /class="chat-message-avatar"/);
  assert.doesNotMatch(markup, />data:image\/png/);
});

test('chat avatars escape emoji text and fall back to initials', () => {
  assert.match(avatarMarkup({ name: 'Tùng', avatar: '<b>🙂</b>' }), /&lt;b&gt;🙂&lt;\/b&gt;/);
  assert.match(avatarMarkup({ name: 'Tùng Anh', avatar: '' }), />TA<\/div>$/);
});

test('newest-first query results become chronological without mutating input', () => {
  const rows = [{ id: 'new' }, { id: 'old' }];
  assert.deepEqual(chronologicalMessages(rows).map(row => row.id), ['old', 'new']);
  assert.deepEqual(rows.map(row => row.id), ['new', 'old']);
});

test('consecutive messages from one sender are decorated as a visual group', () => {
  const messages = [
    { id: '1', sender: { id: 'a' }, created_at: '2026-06-30T01:00:00Z' },
    { id: '2', sender: { id: 'a' }, created_at: '2026-06-30T01:02:00Z' },
    { id: '3', sender: { id: 'a' }, created_at: '2026-06-30T01:04:00Z' }
  ];
  assert.deepEqual(decorateMessages(messages).map(item => item.groupPosition), ['first', 'middle', 'last']);
});

test('sender changes and gaps over five minutes split message groups', () => {
  const messages = [
    { id: '1', sender: { id: 'a' }, created_at: '2026-06-30T01:00:00Z' },
    { id: '2', sender: { id: 'b' }, created_at: '2026-06-30T01:01:00Z' },
    { id: '3', sender: { id: 'b' }, created_at: '2026-06-30T01:07:00Z' }
  ];
  assert.deepEqual(decorateMessages(messages).map(item => item.groupPosition), ['single', 'single', 'single']);
});

test('time separators appear at the start and after fifteen-minute gaps', () => {
  const messages = [
    { id: '1', sender: { id: 'a' }, created_at: '2026-06-30T01:00:00Z' },
    { id: '2', sender: { id: 'b' }, created_at: '2026-06-30T01:14:59Z' },
    { id: '3', sender: { id: 'b' }, created_at: '2026-06-30T01:30:00Z' }
  ];
  assert.deepEqual(decorateMessages(messages).map(item => item.showTimeSeparator), [true, false, true]);
});

test('message markup exposes group position and hides repeated identity', () => {
  const controller = Object.create(CollaborationController.prototype);
  controller.session = { member: { id: 'me' } };
  const first = controller.messageMarkup({
    id: '1', room_id: 'general', text: 'Xin chào', created_at: '2026-06-30T01:00:00Z',
    sender: { id: 'other', name: 'Tùng', avatar: '🙂' }, groupPosition: 'first', showTimeSeparator: true
  });
  const middle = controller.messageMarkup({
    id: '2', room_id: 'general', text: 'Tin tiếp', created_at: '2026-06-30T01:01:00Z',
    sender: { id: 'other', name: 'Tùng', avatar: '🙂' }, groupPosition: 'middle', showTimeSeparator: false
  });
  assert.match(first, /chat-group-first/);
  assert.match(first, /chat-sender-name[^>]*>Tùng/);
  assert.match(first, /chat-time-separator/);
  assert.match(middle, /chat-group-middle/);
  assert.doesNotMatch(middle, /chat-sender-name/);
  assert.match(middle, /chat-avatar-slot empty/);
  assert.match(first, /title="[^"]*30\/06\/2026/);
});

test('system messages render as escaped centered moderation text', () => {
  const controller = Object.create(CollaborationController.prototype);
  controller.session = null;
  const html = controller.messageMarkup({
    id: 'system-1',
    room_id: 'general',
    kind: 'system',
    text: 'Thằng SV <Tùng> đã bị khóa mõm 5 phút',
    created_at: '2026-07-01T00:00:00Z',
    showTimeSeparator: false
  });
  assert.match(html, /chat-system-message/);
  assert.match(html, /Thằng SV &lt;Tùng&gt; đã bị khóa mõm 5 phút/);
  assert.doesNotMatch(html, /chat-message-avatar/);
});

test('attachment markup renders images and videos as inline media', () => {
  const image = attachmentMarkup({ name: 'ảnh đẹp.png', mime_type: 'image/png', size_bytes: 2048, public_url: 'https://cdn.test/image.png' });
  const video = attachmentMarkup({ name: 'demo.mp4', mime_type: 'video/mp4', size_bytes: 4096, public_url: 'https://cdn.test/video.mp4' });
  assert.match(image, /chat-media-trigger/);
  assert.match(image, /chat-media-image/);
  assert.match(image, /loading="lazy"/);
  assert.match(video, /chat-video-preview/);
  assert.match(video, /preload="metadata"/);
  assert.match(video, /controls/);
});

test('attachment markup keeps generic downloads and escapes attachment data', () => {
  const generic = attachmentMarkup({ name: 'brief.pdf', mime_type: 'application/pdf', size_bytes: 1024, public_url: 'https://cdn.test/brief.pdf' });
  const unsafe = attachmentMarkup({ name: '\"><script>x</script>.png', mime_type: 'image/png', size_bytes: 1, public_url: 'https://cdn.test/x.png?x="bad' });
  assert.match(generic, /chat-attachment/);
  assert.match(generic, /brief\.pdf/);
  assert.doesNotMatch(unsafe, /<script>/);
  assert.match(unsafe, /&quot;bad/);
});

test('rendered message IDs prevent duplicate appends', () => {
  const ids = new Set(['message-1']);
  assert.equal(shouldAppendMessage(ids, { id: 'message-1' }), false);
  assert.equal(shouldAppendMessage(ids, { id: 'message-2' }), true);
  assert.equal(shouldAppendMessage(ids, null), false);
});

test('near-bottom detection uses the remaining scroll distance', () => {
  assert.equal(isNearBottom({ scrollHeight: 1000, scrollTop: 700, clientHeight: 250 }, 60), true);
  assert.equal(isNearBottom({ scrollHeight: 1000, scrollTop: 300, clientHeight: 250 }, 60), false);
});

test('Enter sends chat while Shift+Enter and IME composition keep editing', () => {
  assert.equal(shouldSendOnEnter({ key: 'Enter', shiftKey: false, isComposing: false }), true);
  assert.equal(shouldSendOnEnter({ key: 'Enter', shiftKey: true, isComposing: false }), false);
  assert.equal(shouldSendOnEnter({ key: 'Enter', shiftKey: false, isComposing: true }), false);
  assert.equal(shouldSendOnEnter({ key: 'a', shiftKey: false, isComposing: false }), false);
});

test('chat controller loads all 36 retained messages and appends realtime inserts', () => {
  const source = readFileSync(new URL('../collaboration-controller.js', import.meta.url), 'utf8');
  assert.match(source, /order\('created_at', \{ ascending: false \}\)\.limit\(36\)/);
  assert.match(source, /this\.renderedMessageIds = new Set\(\)/);
  assert.match(source, /this\.appendRealtimeMessage\(payload\.new\)/);
  assert.match(source, /async fetchMessage\(messageId/);
});

test('sending a message uses the atomic RPC and fetches accepted rows', () => {
  const source = readFileSync(new URL('../collaboration-controller.js', import.meta.url), 'utf8');
  const sendSource = source.slice(source.indexOf('async sendMessage()'), source.indexOf('async uploadAttachment'));
  assert.match(sendSource, /\.rpc\('send_chat_message'/);
  assert.match(sendSource, /p_login_code: this\.session\.code/);
  assert.match(sendSource, /chatSendResult\(data\)/);
  assert.match(sendSource, /this\.fetchMessage\(result\.messageId/);
  assert.doesNotMatch(sendSource, /loadMessages\(/);
});

test('optimistic plain-text sends preserve the submitted text', () => {
  const source = readFileSync(new URL('../collaboration-controller.js', import.meta.url), 'utf8');
  const sendSource = source.slice(source.indexOf('async sendMessage()'), source.indexOf('async uploadAttachment'));
  assert.match(sendSource, /text: rawText/);
  assert.doesNotMatch(sendSource, /text: message\.text/);
});

test('chat controller handles mute state, retention deletes, and tab titles', () => {
  const source = readFileSync(new URL('../collaboration-controller.js', import.meta.url), 'utf8');
  assert.match(source, /const MESSAGE_SELECT = '[^']*sender_id/);
  assert.doesNotMatch(source, /sender:members/);
  assert.match(source, /event: 'DELETE'[\s\S]*removeRealtimeMessage/);
  assert.match(source, /document\.title = notificationDocumentTitle\(summary\.total\)/);
  assert.match(source, /formatMuteCountdown/);
  assert.match(source, /renderMuteState/);
});

test('chat presence stays online separately from typing state', () => {
  const source = readFileSync(new URL('../collaboration-controller.js', import.meta.url), 'utf8');
  assert.match(source, /trackPresence\(typingRoom = null\)/);
  assert.match(source, /online: true/);
  assert.match(source, /typingAt\s*=\s*Date\.now\(\)/);
  assert.doesNotMatch(source, /channel\.track\(\{\}\)/);
});

test('chat composer accepts pasted image files', () => {
  const source = readFileSync(new URL('../collaboration-controller.js', import.meta.url), 'utf8');
  assert.match(source, /addEventListener\('paste', event => this\.handlePasteAttachment\(event\)\)/);
  assert.match(source, /new DataTransfer\(\)/);
  assert.match(source, /clipboardData\?\.files/);
});

test('login state changes refresh portal feature flags', () => {
  const source = readFileSync(new URL('../collaboration-controller.js', import.meta.url), 'utf8');
  const loginSource = source.slice(source.indexOf('async login(rawCode)'), source.indexOf('async restoreSession()'));
  const restoreSource = source.slice(source.indexOf('async restoreSession()'), source.indexOf('async changeCode()'));
  const logoutStart = source.indexOf('logout(showToast = true)');
  const logoutSource = source.slice(logoutStart, source.indexOf('\n  renderAccount()', logoutStart));
  assert.match(loginSource, /this\.portal\.render\(\)/);
  assert.match(loginSource, /this\.portal\.currentTab === 'xo'[\s\S]*this\.portal\.loadXoCasino\(\)/);
  assert.match(restoreSource, /this\.portal\.render\(\)/);
  assert.match(logoutSource, /this\.portal\.render\(\)/);
});

test('clearing a selected file revokes its temporary object URL', () => {
  const controller = Object.create(CollaborationController.prototype);
  controller.selectedFilePreviewUrl = 'blob:preview-1';
  const originalRevoke = URL.revokeObjectURL;
  let revoked = '';
  URL.revokeObjectURL = value => { revoked = value; };
  try {
    controller.clearSelectedFile(false);
  } finally {
    URL.revokeObjectURL = originalRevoke;
  }
  assert.equal(revoked, 'blob:preview-1');
  assert.equal(controller.selectedFilePreviewUrl, null);
});

test('composer source cleans media preview after replacement and successful send', () => {
  const source = readFileSync(new URL('../collaboration-controller.js', import.meta.url), 'utf8');
  const renderSource = source.slice(source.indexOf('renderSelectedFile(file)'), source.indexOf('async sendMessage()'));
  const sendSource = source.slice(source.indexOf('async sendMessage()'), source.indexOf('async uploadAttachment'));
  assert.match(renderSource, /this\.clearSelectedFile/);
  assert.match(renderSource, /URL\.createObjectURL/);
  assert.match(sendSource, /this\.clearSelectedFile/);
});

test('chat controller wires accessible lightbox lifecycle', () => {
  const source = readFileSync(new URL('../collaboration-controller.js', import.meta.url), 'utf8');
  assert.match(source, /openMediaLightbox\(trigger\)/);
  assert.match(source, /closeMediaLightbox\(\)/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /this\.lightboxReturnFocus\?\.focus/);
  assert.match(source, /video\?\.pause/);
  assert.match(source, /content\.replaceChildren/);
});

test('team size warnings explain underfilled and overfilled teams', () => {
  assert.match(getTeamSizeWarning({ teamLimit: { min: 3, max: 4 } }, 2, 'A'), /Nhóm A.*thiếu 1/i);
  assert.match(getTeamSizeWarning({ teamLimit: { min: 1, max: 3 } }, 4), /vượt quá 1/i);
  assert.equal(getTeamSizeWarning({ teamLimit: { min: 1, max: 3 } }, 2), '');
});

test('calendar export produces a valid ICS envelope', () => {
  const ics = buildCalendar([{ name: 'Demo', timeline: [{ label: 'Chung kết', date: '2026-09-01T09:00:00+07:00' }] }]);
  assert.match(ics, /^BEGIN:VCALENDAR/);
  assert.match(ics, /SUMMARY:Demo - Chung kết/);
  assert.match(ics, /END:VCALENDAR$/);
});

test('unread notifications aggregate totals and per-room message badges', () => {
  const summary = aggregateUnreadNotifications([
    { id: '1', kind: 'message', room_id: 'general', read_at: null },
    { id: '2', kind: 'message', room_id: 'general', read_at: null },
    { id: '3', kind: 'task', read_at: null },
    { id: '4', kind: 'message', room_id: 'onevoice', read_at: '2026-06-30T01:00:00Z' }
  ]);
  assert.deepEqual(summary, { total: 3, chat: 2, updates: 1, rooms: { general: 2 } });
});

test('browser notification copy is bounded and system notifications are gated', () => {
  const copy = formatBrowserNotification({ title: 'Tin nhắn mới', body: 'x'.repeat(140) });
  assert.equal(copy.title, 'PingPing · Tin nhắn mới');
  assert.equal(copy.body.length <= 100, true);
  assert.equal(canShowBrowserNotification({ enabled: true, permission: 'granted', hidden: true, actorId: 'other', memberId: 'me' }), true);
  assert.equal(canShowBrowserNotification({ enabled: true, permission: 'granted', hidden: false, actorId: 'other', memberId: 'me' }), false);
  assert.equal(canShowBrowserNotification({ enabled: true, permission: 'granted', hidden: true, actorId: 'me', memberId: 'me' }), false);
});
