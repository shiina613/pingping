export const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_FILE = /\.(png|jpe?g|gif|webp|mp4|webm|mov|pdf|docx?|xlsx?|pptx?|zip)$/i;
const IMAGE_FILE = /\.(png|jpe?g|gif|webp)$/i;
const VIDEO_FILE = /\.(mp4|webm|mov)$/i;

export function attachmentKind(attachment = {}) {
  const mimeType = String(attachment.mime_type || attachment.type || '').toLowerCase();
  const name = String(attachment.name || '');
  if (mimeType.startsWith('image/') || IMAGE_FILE.test(name)) return 'image';
  if (mimeType.startsWith('video/') || VIDEO_FILE.test(name)) return 'video';
  return 'file';
}

export function validateLoginCode(value) {
  const code = String(value || '').trim();
  if (!code) throw new Error('Vui lòng nhập mã đăng nhập.');
  if (code.length > 64) throw new Error('Mã đăng nhập tối đa 64 ký tự.');
  return code;
}

export function validateMessage(value, attachment) {
  const text = String(value || '').trim();
  const cleanAttachment = attachment || null;
  if (!text && !cleanAttachment) throw new Error('Tin nhắn không được để trống.');
  if (text.length > 4000) throw new Error('Tin nhắn tối đa 4.000 ký tự.');
  return { text, attachment: cleanAttachment };
}

export function validateUpload(file) {
  const name = String(file?.name || '');
  const size = Number(file?.size || 0);
  if (!ALLOWED_FILE.test(name)) throw new Error('Định dạng file không được hỗ trợ.');
  if (size <= 0 || size > MAX_FILE_SIZE) throw new Error('File phải nhỏ hơn hoặc bằng 25 MB.');
  return file;
}

export function sanitizeFileName(value) {
  return String(value || '')
    .split(/[\\/]/).pop()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function aggregateUnreadNotifications(notifications = []) {
  const summary = { total: 0, chat: 0, updates: 0, rooms: {} };
  for (const notification of notifications) {
    if (notification.read_at) continue;
    summary.total += 1;
    if (notification.kind === 'message') {
      summary.chat += 1;
      if (notification.room_id) summary.rooms[notification.room_id] = (summary.rooms[notification.room_id] || 0) + 1;
    } else {
      summary.updates += 1;
    }
  }
  return summary;
}

export function formatBrowserNotification(notification = {}) {
  const title = String(notification.title || 'Có cập nhật mới').slice(0, 80);
  const rawBody = String(notification.body || 'Mở PingPing để xem chi tiết.');
  const body = rawBody.length > 100 ? `${rawBody.slice(0, 97)}...` : rawBody;
  return { title: `PingPing · ${title}`, body };
}

export function canShowBrowserNotification({ enabled, permission, hidden, actorId, memberId }) {
  return Boolean(enabled && permission === 'granted' && hidden && actorId !== memberId);
}

export function effectiveMemberName(member = {}, now = new Date()) {
  const name = String(member.name || 'Thành viên').trim() || 'Thành viên';
  const mutedUntil = new Date(member.chat_muted_until || 0).getTime();
  return Number.isFinite(mutedUntil) && mutedUntil > new Date(now).getTime() ? `Súc vật ${name}` : name;
}

export function formatMuteCountdown(mutedUntil, now = new Date()) {
  const remainingSeconds = Math.max(0, Math.floor((new Date(mutedUntil).getTime() - new Date(now).getTime()) / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function notificationDocumentTitle(unreadCount) {
  const count = Math.max(0, Math.trunc(Number(unreadCount) || 0));
  return count > 0 ? `(${count}) PingPing` : 'PingPing';
}

export function chatSendResult(row = {}) {
  if (row.status === 'sent') {
    return { accepted: true, messageId: row.message_id || null, mutedUntil: null, message: '' };
  }
  if (row.status === 'muted') {
    return { accepted: false, messageId: null, mutedUntil: row.muted_until || null, message: 'Đã bị khóa mõm.' };
  }
  if (row.status === 'rate_limited') {
    return { accepted: false, messageId: row.message_id || null, mutedUntil: row.muted_until || null, message: 'Bạn đã bị khóa mõm 5 phút.' };
  }
  throw new Error('Kết quả gửi tin không hợp lệ.');
}

export function getTeamSizeWarning(competition, count, teamLabel = '') {
  const { min, max } = competition.teamLimit;
  const prefix = teamLabel ? `Nhóm ${teamLabel} ` : 'Đội hình ';
  if (count < min) return `${prefix}đang thiếu ${min - count} thành viên.`;
  if (max < 99 && count > max) return `${prefix}vượt quá ${count - max} thành viên.`;
  return '';
}

function icsDate(value) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function icsText(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

export function buildCalendar(competitions) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PingPing Team//Portal 2026//VI', 'CALSCALE:GREGORIAN'];
  for (const competition of competitions) {
    for (const event of competition.timeline) {
      const start = icsDate(event.date);
      lines.push('BEGIN:VEVENT', `UID:${start}-${competition.name.replace(/\W/g, '')}@pingping`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${start}`, `SUMMARY:${icsText(`${competition.name} - ${event.label}`)}`, 'END:VEVENT');
    }
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
