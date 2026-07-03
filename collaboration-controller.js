import {
  aggregateUnreadNotifications,
  attachmentKind,
  canShowBrowserNotification,
  chatSendResult,
  effectiveMemberName,
  formatBrowserNotification,
  formatMuteCountdown,
  notificationDocumentTitle,
  sanitizeFileName,
  validateLoginCode,
  validateMessage,
  validateUpload
} from './collaboration.js';

const ROOM_NAMES = Object.freeze({
  general: 'Trò chuyện chung',
  onevoice: 'OneVoice',
  thucchien: 'AI Thực Chiến',
  aichallenge: 'Vietnam AI Innovation',
  buildhub: 'Build@HUB',
  viettel: 'Viettel AI Race'
});

const MESSAGE_SELECT = 'id,room_id,text,kind,created_at,sender:members!messages_sender_id_fkey(id,name,avatar,color,chat_muted_until),attachment:attachments(id,name,mime_type,size_bytes,public_url)';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function avatarMarkup(member = {}, className = 'chat-message-avatar') {
  const name = String(member.name || 'Thành viên').trim();
  const avatar = String(member.avatar || '');
  const safeClass = escapeHtml(className);
  const fallback = name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || '?';
  if (avatar.startsWith('data:image/')) {
    return `<div class="${safeClass}"><img src="${escapeHtml(avatar)}" alt="${escapeHtml(name)}"></div>`;
  }
  return `<div class="${safeClass}">${escapeHtml(avatar || fallback)}</div>`;
}

function genericAttachmentMarkup(attachment, extraClass = '') {
  const size = Math.ceil(Number(attachment.size_bytes || 0) / 1024);
  return `<a class="chat-attachment${extraClass}" href="${escapeHtml(attachment.public_url)}" target="_blank" rel="noopener">📎 <span>${escapeHtml(attachment.name)}</span><small>${size} KB</small></a>`;
}

export function attachmentMarkup(attachment) {
  if (!attachment) return '';
  const kind = attachmentKind(attachment);
  const url = escapeHtml(attachment.public_url);
  const name = escapeHtml(attachment.name || 'Tệp đính kèm');
  const fallback = genericAttachmentMarkup(attachment, ' chat-media-fallback');
  if (kind === 'image') {
    return `<div class="chat-media"><button class="chat-media-trigger" type="button" data-media-kind="image" data-media-url="${url}" data-media-name="${name}" aria-label="Mở ảnh ${name}"><img class="chat-media-image" src="${url}" alt="${name}" loading="lazy"></button>${fallback}</div>`;
  }
  if (kind === 'video') {
    return `<div class="chat-media chat-video-preview"><video src="${url}" preload="metadata" controls playsinline aria-label="Video ${name}"></video><button class="chat-media-expand" type="button" data-media-kind="video" data-media-url="${url}" data-media-name="${name}" aria-label="Mở rộng video ${name}">⛶</button>${fallback}</div>`;
  }
  return genericAttachmentMarkup(attachment);
}

export function chronologicalMessages(rows = []) {
  return [...rows].reverse();
}

function minutesBetween(earlier, later) {
  return (new Date(later).getTime() - new Date(earlier).getTime()) / 60000;
}

function messagesBelongTogether(left, right) {
  if (!left || !right || left.kind === 'system' || right.kind === 'system' || left.sender?.id !== right.sender?.id) return false;
  const gap = minutesBetween(left.created_at, right.created_at);
  return gap >= 0 && gap <= 5;
}

export function decorateMessages(messages = []) {
  return messages.map((message, index) => {
    const previous = messages[index - 1];
    const next = messages[index + 1];
    const joinsPrevious = messagesBelongTogether(previous, message);
    const joinsNext = messagesBelongTogether(message, next);
    let groupPosition = 'single';
    if (!joinsPrevious && joinsNext) groupPosition = 'first';
    else if (joinsPrevious && joinsNext) groupPosition = 'middle';
    else if (joinsPrevious && !joinsNext) groupPosition = 'last';
    const showTimeSeparator = !previous || minutesBetween(previous.created_at, message.created_at) >= 15;
    return { ...message, groupPosition, showTimeSeparator };
  });
}

export function shouldAppendMessage(renderedIds, message) {
  return Boolean(message?.id && !renderedIds.has(message.id));
}

export function isNearBottom(element, threshold = 80) {
  if (!element) return true;
  return element.scrollHeight - element.scrollTop - element.clientHeight <= threshold;
}

export function shouldSendOnEnter(event) {
  return event?.key === 'Enter' && !event.shiftKey && !event.isComposing && !event.repeat;
}

export function mapRemoteSnapshot({ members = [], allocations = [], tasks = [] }) {
  const publicMembers = members.map(({ login_code, ...member }) => member);
  const allocationMap = Object.fromEntries(allocations.map(row => [row.competition_id, row.data]));
  const taskMap = {};
  for (const row of tasks) {
    const item = {
      id: row.id,
      title: row.title,
      desc: row.description,
      assignee: row.assignee_id,
      column: row.column_id
    };
    (taskMap[row.competition_id] ||= []).push(item);
  }
  return { members: publicMembers, allocations: allocationMap, kanbanTasks: taskMap };
}

function formatTime(value) {
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(new Date(value));
}

function formatFullTime(value) {
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
}

export class CollaborationController {
  constructor(portal, client) {
    this.portal = portal;
    this.client = client;
    this.session = this.readSession();
    this.activeRoom = 'general';
    this.channel = null;
    this.reloadTimer = null;
    this.messageLoadToken = 0;
    this.renderedMessageIds = new Set();
    this.renderedMessages = [];
    this.selectedFilePreviewUrl = null;
    this.lightboxReturnFocus = null;
    this.muteTimer = null;
    this.typingTimeout = null;
    this.notifications = [];
    this.browserNotificationsEnabled = localStorage.getItem('pp_browser_notifications') === 'true';
  }

  readSession() {
    try { return JSON.parse(localStorage.getItem('pp_session')) || null; } catch { return null; }
  }

  async init() {
    this.bindAuthUI();
    this.bindChatUI();
    this.bindNotificationUI();
    this.renderAccount();
    await this.restoreSession();
    await this.loadNotifications();
    await this.loadSnapshot();
    await this.loadMessages();
    this.renderMuteState();
    this.subscribe();
  }

  bindAuthUI() {
    const byId = id => document.getElementById(id);
    byId('account-button')?.addEventListener('click', () => this.openLogin());
    byId('settings-login-btn')?.addEventListener('click', () => this.openLogin());
    byId('login-close')?.addEventListener('click', () => this.closeLogin());
    byId('login-modal')?.addEventListener('click', event => {
      if (event.target.id === 'login-modal') this.closeLogin();
    });
    byId('login-form')?.addEventListener('submit', event => {
      event.preventDefault();
      this.login(byId('login-code').value);
    });
    byId('logout-btn')?.addEventListener('click', () => this.logout());
    byId('change-code-btn')?.addEventListener('click', () => this.changeCode());
  }

  bindChatUI() {
    document.querySelectorAll('.chat-room').forEach(button => {
      button.addEventListener('click', () => this.openRoom(button.dataset.room));
    });
    document.getElementById('chat-file-input')?.addEventListener('change', event => this.renderSelectedFile(event.target.files?.[0]));
    document.getElementById('chat-file-preview-remove')?.addEventListener('click', () => this.clearSelectedFile());
    document.getElementById('chat-compose-form')?.addEventListener('submit', event => {
      event.preventDefault();
      this.sendMessage();
    });
    document.getElementById('chat-mention-autocomplete')?.addEventListener('click', event => {
      const item = event.target.closest('.mention-item');
      if (item) this.selectMention(item.dataset.name);
    });
    document.getElementById('chat-message-input')?.addEventListener('keydown', event => {
      if (this.handleMentionKeydown(event)) return;
      if (!shouldSendOnEnter(event)) return;
      event.preventDefault();
      this.sendMessage();
    });
    document.getElementById('chat-message-input')?.addEventListener('input', event => {
      this.autoResizeComposer(event.currentTarget);
      this.broadcastTyping();
      this.handleMentionInput(event.currentTarget);
    });
    document.getElementById('chat-new-message-btn')?.addEventListener('click', () => this.scrollToLatest());
    document.getElementById('chat-message-list')?.addEventListener('click', event => {
      const trigger = event.target.closest?.('[data-media-kind]');
      if (trigger) this.openMediaLightbox(trigger);
    });
    document.getElementById('chat-message-list')?.addEventListener('error', event => {
      const media = event.target.closest?.('.chat-media');
      if (media) media.classList.add('failed');
    }, true);
    document.getElementById('chat-media-lightbox-close')?.addEventListener('click', () => this.closeMediaLightbox());
    document.getElementById('chat-media-lightbox')?.addEventListener('click', event => {
      if (event.target.id === 'chat-media-lightbox') this.closeMediaLightbox();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') this.closeMediaLightbox();
    });
    document.getElementById('chat-message-list')?.addEventListener('scroll', event => {
      if (isNearBottom(event.currentTarget)) this.hideNewMessageButton();
    });
  }

  handleMentionInput(input) {
    const list = document.getElementById('chat-mention-autocomplete');
    if (!list || !this.portal?.members) return;
    
    const val = input.value;
    const cursor = input.selectionStart;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/(^|\s)@([a-zA-ZÀ-ỹ\s]{0,20})$/);
    
    if (match) {
      const query = match[2].toLowerCase();
      const members = this.portal.members.filter(m => effectiveMemberName(m).toLowerCase().includes(query));
      if (members.length > 0) {
        list.hidden = false;
        list.innerHTML = members.map((m, i) => `<div class="mention-item${i===0 ? ' active' : ''}" data-name="${escapeHtml(effectiveMemberName(m))}"><div class="mention-avatar">${avatarMarkup(m)}</div> <span style="font-weight: 500">${escapeHtml(effectiveMemberName(m))}</span></div>`).join('');
        this.mentionActive = true;
        this.mentionMatchLength = match[2].length;
        this.mentionActiveIndex = 0;
        return;
      }
    }
    
    list.hidden = true;
    this.mentionActive = false;
  }

  handleMentionKeydown(event) {
    if (!this.mentionActive) return false;
    
    const list = document.getElementById('chat-mention-autocomplete');
    const items = list.querySelectorAll('.mention-item');
    if (!items.length) return false;
    
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[this.mentionActiveIndex]?.classList.remove('active');
      this.mentionActiveIndex = (this.mentionActiveIndex + 1) % items.length;
      items[this.mentionActiveIndex]?.classList.add('active');
      items[this.mentionActiveIndex]?.scrollIntoView({ block: 'nearest' });
      return true;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[this.mentionActiveIndex]?.classList.remove('active');
      this.mentionActiveIndex = (this.mentionActiveIndex - 1 + items.length) % items.length;
      items[this.mentionActiveIndex]?.classList.add('active');
      items[this.mentionActiveIndex]?.scrollIntoView({ block: 'nearest' });
      return true;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      const activeItem = items[this.mentionActiveIndex];
      if (activeItem) this.selectMention(activeItem.dataset.name);
      return true;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      list.hidden = true;
      this.mentionActive = false;
      return true;
    }
    return false;
  }

  selectMention(name) {
    const input = document.getElementById('chat-message-input');
    const list = document.getElementById('chat-mention-autocomplete');
    if (!input) return;
    
    const val = input.value;
    const cursor = input.selectionStart;
    const textBefore = val.slice(0, cursor);
    const textAfter = val.slice(cursor);
    
    const newBefore = textBefore.slice(0, -(this.mentionMatchLength + 1)) + '@' + name + ' ';
    input.value = newBefore + textAfter;
    
    input.focus();
    input.selectionStart = input.selectionEnd = newBefore.length;
    
    list.hidden = true;
    this.mentionActive = false;
    this.autoResizeComposer(input);
  }

  bindNotificationUI() {
    const button = document.getElementById('notification-button');
    const panel = document.getElementById('notification-panel');
    button?.addEventListener('click', event => {
      event.stopPropagation();
      const willOpen = panel?.hidden;
      if (panel) panel.hidden = !willOpen;
      button.setAttribute('aria-expanded', String(Boolean(willOpen)));
    });
    panel?.addEventListener('click', event => {
      event.stopPropagation();
      const item = event.target.closest('[data-notification-id]');
      if (item) this.openNotification(item.dataset.notificationId);
    });
    document.getElementById('notification-mark-all')?.addEventListener('click', () => this.markAllNotificationsRead());
    document.getElementById('browser-notification-toggle')?.addEventListener('click', () => this.requestBrowserNotifications());
    document.addEventListener('click', () => {
      if (panel) panel.hidden = true;
      button?.setAttribute('aria-expanded', 'false');
    });
    this.renderNotificationPermission();
  }

  openLogin() {
    document.getElementById('login-modal')?.classList.add('active');
    this.renderAccount();
    setTimeout(() => document.getElementById(this.session ? 'change-code-btn' : 'login-code')?.focus(), 20);
  }

  closeLogin() {
    document.getElementById('login-modal')?.classList.remove('active');
    const error = document.getElementById('login-error');
    if (error) error.textContent = '';
  }

  requireLogin() {
    if (this.session?.member) return true;
    this.openLogin();
    return false;
  }

  async login(rawCode) {
    const errorBox = document.getElementById('login-error');
    const submit = document.getElementById('login-submit');
    try {
      const code = validateLoginCode(rawCode);
      submit.disabled = true;
      submit.textContent = 'Đang đăng nhập...';
      const { data, error } = await this.client.from('members').select('*').eq('login_code', code).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Mã đăng nhập không đúng.');
      const { login_code, ...member } = data;
      this.session = { member, code: login_code };
      localStorage.setItem('pp_session', JSON.stringify(this.session));
      document.getElementById('login-code').value = '';
      this.renderAccount();
      this.closeLogin();
      this.toast(`Xin chào ${member.name}!`, 'success');
      await this.loadNotifications();
    } catch (error) {
      errorBox.textContent = error.message || 'Không thể đăng nhập.';
    } finally {
      submit.disabled = false;
      submit.textContent = 'Đăng nhập';
    }
  }

  async restoreSession() {
    if (!this.session?.member?.id || !this.session?.code) return;
    const { data } = await this.client.from('members').select('*').eq('id', this.session.member.id).eq('login_code', this.session.code).maybeSingle();
    if (!data) return this.logout(false);
    const { login_code, ...member } = data;
    this.session = { member, code: login_code };
    localStorage.setItem('pp_session', JSON.stringify(this.session));
    this.renderAccount();
  }

  async changeCode() {
    if (!this.requireLogin()) return;
    const raw = prompt('Nhập mã đăng nhập mới (tối đa 64 ký tự):', this.session.code);
    if (raw === null) return;
    try {
      const code = validateLoginCode(raw);
      const { data: duplicate } = await this.client.from('members').select('id').eq('login_code', code).neq('id', this.session.member.id).maybeSingle();
      if (duplicate) throw new Error('Mã này đã được thành viên khác sử dụng.');
      const { error } = await this.client.from('members').update({ login_code: code, updated_at: new Date().toISOString() }).eq('id', this.session.member.id);
      if (error) throw error;
      this.session.code = code;
      localStorage.setItem('pp_session', JSON.stringify(this.session));
      this.toast('Đã đổi mã đăng nhập.', 'success');
    } catch (error) { this.toast(error.message, 'error'); }
  }

  logout(showToast = true) {
    clearTimeout(this.muteTimer);
    this.muteTimer = null;
    this.session = null;
    localStorage.removeItem('pp_session');
    this.renderAccount();
    this.notifications = [];
    this.renderNotifications();
    this.closeLogin();
    if (showToast) this.toast('Đã đăng xuất.', 'success');
  }

  renderAccount() {
    const member = this.session?.member;
    const displayName = member ? effectiveMemberName(member) : '';
    const label = document.getElementById('account-label');
    const avatar = document.getElementById('account-avatar');
    const form = document.getElementById('login-form');
    const panel = document.getElementById('account-panel');
    if (label) label.textContent = displayName || 'Đăng nhập';
    if (avatar) avatar.innerHTML = avatarMarkup(member || { name: '?' }, 'account-avatar-media');
    if (form) form.hidden = Boolean(member);
    if (panel) panel.hidden = !member;
    const summary = document.getElementById('account-summary');
    if (summary) summary.innerHTML = member ? `<strong>${escapeHtml(displayName)}</strong><span>${escapeHtml(member.role)}</span>` : '';
  }

  async loadSnapshot() {
    const [membersResult, allocationsResult, tasksResult] = await Promise.all([
      this.client.from('members').select('*').order('name'),
      this.client.from('allocations').select('*').order('competition_id'),
      this.client.from('tasks').select('*').order('id')
    ]);
    const error = membersResult.error || allocationsResult.error || tasksResult.error;
    if (error) return this.setConnection(false, error.message);
    const snapshot = mapRemoteSnapshot({ members: membersResult.data, allocations: allocationsResult.data, tasks: tasksResult.data });
    const currentMember = membersResult.data.find(member => member.id === this.session?.member?.id);
    if (currentMember && this.session) {
      const { login_code, ...member } = currentMember;
      this.session.member = member;
      localStorage.setItem('pp_session', JSON.stringify(this.session));
      this.renderAccount();
      this.renderMuteState();
    }
    snapshot.members = snapshot.members.map(member => ({ ...member, display_name: effectiveMemberName(member) }));
    const membersById = new Map(snapshot.members.map(member => [member.id, member]));
    this.renderedMessages = this.renderedMessages.map(message => ({
      ...message,
      sender: message.sender?.id ? { ...message.sender, ...membersById.get(message.sender.id) } : message.sender
    }));
    this.portal.members = snapshot.members;
    this.portal.allocations = snapshot.allocations;
    this.portal.kanbanTasks = snapshot.kanbanTasks;
    this.portal.render();
    this.applyEffectiveMemberNamesToPortal();
    this.rerenderMessages();
    this.setConnection(true);
  }

  async saveMember(member) {
    if (!this.requireLogin()) throw new Error('Bạn cần đăng nhập.');
    const { error } = await this.client.from('members').update({
      name: member.name, role: member.role, skills: member.skills, avatar: member.avatar || '',
      updated_by: this.session.member.id, updated_at: new Date().toISOString()
    }).eq('id', member.id);
    if (error) throw error;
  }

  async saveAllocations() {
    if (!this.requireLogin()) throw new Error('Bạn cần đăng nhập.');
    const rows = Object.entries(this.portal.allocations).map(([competition_id, data]) => ({
      competition_id, data, updated_by: this.session.member.id, updated_at: new Date().toISOString()
    }));
    const { error } = await this.client.from('allocations').upsert(rows, { onConflict: 'competition_id' });
    if (error) throw error;
  }

  async createTask(competitionId, task) {
    if (!this.requireLogin()) throw new Error('Bạn cần đăng nhập.');
    const { error } = await this.client.from('tasks').insert({
      id: task.id, competition_id: competitionId, title: task.title, description: task.desc || '',
      assignee_id: task.assignee || null, column_id: task.column, updated_by: this.session.member.id
    });
    if (error) throw error;
  }

  async updateTask(taskId, changes) {
    if (!this.requireLogin()) throw new Error('Bạn cần đăng nhập.');
    const payload = { updated_by: this.session.member.id, updated_at: new Date().toISOString() };
    if (changes.column !== undefined) payload.column_id = changes.column;
    const { error } = await this.client.from('tasks').update(payload).eq('id', taskId);
    if (error) throw error;
  }

  async deleteTask(taskId) {
    if (!this.requireLogin()) throw new Error('Bạn cần đăng nhập.');
    const { error } = await this.client.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
  }

  subscribe() {
    this.channel = this.client.channel('pingping-live', {
      config: { presence: { key: this.session?.member?.id || 'anon' } }
    });
    for (const table of ['members', 'allocations', 'tasks']) {
      this.channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => this.scheduleSnapshot());
    }
    this.channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
      if (payload.new.room_id === this.activeRoom) this.appendRealtimeMessage(payload.new);
    });
    this.channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
      this.removeRealtimeMessage(payload.old?.id);
    });
    this.channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
      this.handleNotification(payload.new);
    });
    this.channel.on('presence', { event: 'sync' }, () => {
      this.renderTypingIndicator();
    });
    this.channel.subscribe(status => this.setConnection(status === 'SUBSCRIBED', status));
  }

  broadcastTyping() {
    if (!this.session?.member || !this.channel) return;
    const input = document.getElementById('chat-message-input');
    const isTyping = input?.value.trim().length > 0;
    
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    
    if (isTyping) {
      this.channel.track({ typingRoom: this.activeRoom, name: this.session.member.name, at: Date.now() });
      this.typingTimeout = setTimeout(() => {
        this.channel.track({});
      }, 5000);
    } else {
      this.channel.track({});
    }
  }

  renderTypingIndicator() {
    if (!this.channel) return;
    const state = this.channel.presenceState();
    const typingUsers = [];
    
    for (const [key, presences] of Object.entries(state)) {
      if (key === this.session?.member?.id) continue;
      const p = presences[0];
      if (p && p.typingRoom === this.activeRoom && p.name) {
        typingUsers.push(p.name);
      }
    }
    
    const indicator = document.getElementById('chat-typing-indicator');
    if (!indicator) return;
    
    if (typingUsers.length === 0) {
      indicator.hidden = true;
      indicator.innerHTML = '';
      return;
    }
    
    indicator.hidden = false;
    let text = '';
    if (typingUsers.length === 1) {
      text = `<b>${escapeHtml(typingUsers[0])}</b> đang gõ`;
    } else if (typingUsers.length === 2) {
      text = `<b>${escapeHtml(typingUsers[0])}</b> và <b>${escapeHtml(typingUsers[1])}</b> đang gõ`;
    } else {
      text = `${typingUsers.length} người đang gõ`;
    }
    
    indicator.innerHTML = `<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span> ${text}`;
  }

  scheduleSnapshot() {
    clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(() => this.loadSnapshot(), 120);
  }

  async openRoom(roomId) {
    if (!ROOM_NAMES[roomId]) return;
    this.activeRoom = roomId;
    this.renderTypingIndicator();
    document.querySelectorAll('.chat-room').forEach(button => button.classList.toggle('active', button.dataset.room === roomId));
    document.getElementById('chat-room-title').textContent = ROOM_NAMES[roomId];
    const roomAvatar = document.getElementById('chat-room-avatar');
    if (roomAvatar) roomAvatar.textContent = roomId === 'general' ? 'PP' : ROOM_NAMES[roomId].split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
    this.hideNewMessageButton();
    await this.loadMessages();
    await this.markRoomNotificationsRead(roomId);
  }

  async loadMessages() {
    const list = document.getElementById('chat-message-list');
    if (!list) return;
    const roomId = this.activeRoom;
    const loadToken = ++this.messageLoadToken;
    this.renderedMessageIds = new Set();
    this.renderedMessages = [];
    this.hideNewMessageButton();
    list.innerHTML = '<div class="chat-loading-skeleton" aria-label="Đang tải tin nhắn"><span></span><span></span><span></span></div>';
    const { data, error } = await this.client.from('messages')
      .select(MESSAGE_SELECT)
      .eq('room_id', roomId).order('created_at', { ascending: false }).limit(36);
    if (loadToken !== this.messageLoadToken || roomId !== this.activeRoom) return;
    if (error) {
      list.innerHTML = `<div class="chat-empty error">${escapeHtml(error.message)}</div>`;
      return;
    }
    if (!data.length) {
      list.innerHTML = '<div class="chat-empty">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.</div>';
      return;
    }
    const messages = decorateMessages(chronologicalMessages(data));
    this.renderedMessageIds = new Set(messages.map(message => message.id));
    this.renderedMessages = messages;
    list.innerHTML = messages.map(message => this.messageMarkup(message)).join('');
    this.scrollToLatest();
  }

  async fetchMessage(messageId, roomId = this.activeRoom) {
    const { data, error } = await this.client.from('messages')
      .select(MESSAGE_SELECT).eq('id', messageId).eq('room_id', roomId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async appendRealtimeMessage(realtimeRow) {
    const roomId = realtimeRow?.room_id;
    if (!realtimeRow?.id || roomId !== this.activeRoom || this.renderedMessageIds.has(realtimeRow.id)) return;
    try {
      let message;
      if (!realtimeRow.attachment_id && this.portal?.members) {
        message = {
          id: realtimeRow.id,
          room_id: realtimeRow.room_id,
          text: realtimeRow.text,
          kind: realtimeRow.kind,
          created_at: realtimeRow.created_at,
          sender: this.portal.members.find(m => m.id === realtimeRow.sender_id) || null,
          attachment: null
        };
      } else {
        message = await this.fetchMessage(realtimeRow.id, roomId);
      }
      if (roomId === this.activeRoom) this.appendMessage(message);
    } catch (error) {
      this.setConnection(false, error.message);
    }
  }

  appendMessage(message, { forceScroll = false } = {}) {
    const list = document.getElementById('chat-message-list');
    if (!list || !message || message.room_id !== this.activeRoom) return false;
    if (!shouldAppendMessage(this.renderedMessageIds, message)) {
      if (forceScroll) this.scrollToLatest();
      return false;
    }
    const stayAtLatest = forceScroll || isNearBottom(list);
    list.querySelector('.chat-empty')?.remove();
    list.querySelector('.chat-loading-skeleton')?.remove();
    const decorated = decorateMessages([...this.renderedMessages, message]);
    const previous = decorated.at(-2);
    const next = decorated.at(-1);
    if (previous) {
      const previousElement = [...list.querySelectorAll('[data-message-id]')]
        .find(element => element.dataset.messageId === String(previous.id));
      if (previousElement) previousElement.outerHTML = this.messageMarkup(previous);
    }
    list.insertAdjacentHTML('beforeend', this.messageMarkup(next));
    this.renderedMessages = decorated;
    this.renderedMessageIds.add(message.id);
    if (stayAtLatest) this.scrollToLatest();
    else this.showNewMessageButton();
    return true;
  }

  removeRealtimeMessage(messageId) {
    if (!messageId || !this.renderedMessageIds.has(messageId)) return false;
    this.renderedMessageIds.delete(messageId);
    this.renderedMessages = this.renderedMessages.filter(message => message.id !== messageId);
    document.querySelector(`[data-message-id="${CSS.escape(String(messageId))}"]`)?.remove();
    return true;
  }

  scrollToLatest() {
    const list = document.getElementById('chat-message-list');
    if (list) list.scrollTop = list.scrollHeight;
    this.hideNewMessageButton();
  }

  showNewMessageButton() {
    const button = document.getElementById('chat-new-message-btn');
    if (button) button.hidden = false;
  }

  hideNewMessageButton() {
    const button = document.getElementById('chat-new-message-btn');
    if (button) button.hidden = true;
  }

  autoResizeComposer(input = document.getElementById('chat-message-input')) {
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    input.style.overflowY = input.scrollHeight > 120 ? 'auto' : 'hidden';
  }

  messageMarkup(message) {
    const fullTime = formatFullTime(message.created_at);
    const separator = message.showTimeSeparator ? `<div class="chat-time-separator"><time datetime="${escapeHtml(message.created_at)}">${escapeHtml(formatTime(message.created_at))}</time></div>` : '';
    if (message.kind === 'system') {
      return `<div class="chat-message-item" data-message-id="${escapeHtml(message.id)}">${separator}<p class="chat-system-message" title="${escapeHtml(fullTime)}">${escapeHtml(message.text)}</p></div>`;
    }
    const isMine = message.sender?.id === this.session?.member?.id;
    const mine = isMine ? ' mine' : '';
    const groupPosition = message.groupPosition || 'single';
    const showIdentity = !isMine && ['single', 'first'].includes(groupPosition);
    const showAvatar = !isMine && ['single', 'last'].includes(groupPosition);
    const senderName = showIdentity ? `<strong class="chat-sender-name">${escapeHtml(effectiveMemberName(message.sender || {}))}</strong>` : '';
    const avatar = isMine ? '' : `<div class="chat-avatar-slot${showAvatar ? '' : ' empty'}">${showAvatar ? avatarMarkup(message.sender) : ''}</div>`;
    
    let htmlText = message.text ? escapeHtml(message.text).replaceAll('\n', '<br>') : '';
    if (htmlText && this.portal?.members) {
      const names = this.portal.members.map(m => effectiveMemberName(m)).sort((a, b) => b.length - a.length);
      for (const name of names) {
         const escapedName = escapeHtml(name);
         const regex = new RegExp(`(^|\\s|>)@${escapedName}(?=\\s|$|[.,!?<])`, 'g');
         htmlText = htmlText.replace(regex, `$1<strong class="chat-mention">@${escapedName}</strong>`);
      }
    }
    
    const attachment = attachmentMarkup(message.attachment);
    return `<div class="chat-message-item" data-message-id="${escapeHtml(message.id)}">${separator}<article class="chat-message${mine} chat-group-${groupPosition}" title="${escapeHtml(fullTime)}">${avatar}<div class="chat-message-content">${senderName}<div class="chat-bubble">${htmlText ? `<p>${htmlText}</p>` : ''}${attachment}</div></div></article></div>`;
  }

  renderSelectedFile(file) {
    const status = document.getElementById('chat-upload-status');
    if (!status) return;
    this.clearSelectedFile(false);
    if (!file) { status.textContent = ''; return; }
    try {
      validateUpload(file);
      status.textContent = `Đã chọn: ${file.name} (${Math.ceil(file.size / 1024)} KB)`;
      status.classList.remove('error');
      const kind = attachmentKind(file);
      if (kind !== 'file') {
        const preview = document.getElementById('chat-file-preview');
        const content = preview?.querySelector('.chat-file-preview-content');
        this.selectedFilePreviewUrl = URL.createObjectURL(file);
        const media = document.createElement(kind === 'image' ? 'img' : 'video');
        media.src = this.selectedFilePreviewUrl;
        media.alt = kind === 'image' ? file.name : '';
        media.muted = kind === 'video';
        media.playsInline = kind === 'video';
        if (content) content.replaceChildren(media);
        if (preview) preview.hidden = false;
      }
    } catch (error) {
      this.clearSelectedFile();
      status.textContent = error.message;
      status.classList.add('error');
    }
  }

  clearSelectedFile(resetInput = true) {
    if (this.selectedFilePreviewUrl) URL.revokeObjectURL(this.selectedFilePreviewUrl);
    this.selectedFilePreviewUrl = null;
    const doc = globalThis.document;
    const preview = doc?.getElementById('chat-file-preview');
    const content = preview?.querySelector('.chat-file-preview-content');
    if (content) content.replaceChildren();
    if (preview) preview.hidden = true;
    if (resetInput) {
      const input = doc?.getElementById('chat-file-input');
      if (input) input.value = '';
      const status = doc?.getElementById('chat-upload-status');
      if (status) status.textContent = '';
    }
  }

  openMediaLightbox(trigger) {
    const overlay = document.getElementById('chat-media-lightbox');
    const content = document.getElementById('chat-media-lightbox-content');
    const closeButton = document.getElementById('chat-media-lightbox-close');
    if (!overlay || !content || !trigger?.dataset.mediaUrl) return;
    const kind = trigger.dataset.mediaKind;
    const media = document.createElement(kind === 'video' ? 'video' : 'img');
    media.src = trigger.dataset.mediaUrl;
    if (kind === 'video') {
      media.controls = true;
      media.playsInline = true;
      media.preload = 'metadata';
    } else {
      media.alt = trigger.dataset.mediaName || 'Ảnh đính kèm';
    }
    content.replaceChildren(media);
    this.lightboxReturnFocus = trigger;
    overlay.hidden = false;
    document.body.classList.add('media-lightbox-open');
    closeButton?.focus();
  }

  closeMediaLightbox() {
    const overlay = globalThis.document?.getElementById('chat-media-lightbox');
    if (!overlay || overlay.hidden) return;
    const content = globalThis.document.getElementById('chat-media-lightbox-content');
    const video = content?.querySelector('video');
    video?.pause();
    content?.replaceChildren();
    overlay.hidden = true;
    globalThis.document.body.classList.remove('media-lightbox-open');
    this.lightboxReturnFocus?.focus();
    this.lightboxReturnFocus = null;
  }

  async sendMessage() {
    if (!this.requireLogin()) return;
    const input = document.getElementById('chat-message-input');
    const fileInput = document.getElementById('chat-file-input');
    const status = document.getElementById('chat-upload-status');
    const file = fileInput.files?.[0] || null;
    
    if (!input.value.trim() && !file) return;
    
    let tempId = null;
    let targetRoom = this.activeRoom;

    try {
      const checkedFile = file ? validateUpload(file) : null;
      validateMessage(input.value, checkedFile);
      
      const rawText = input.value;
      tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
      const tempMessage = {
        id: tempId,
        room_id: targetRoom,
        text: rawText,
        kind: 'user',
        created_at: new Date().toISOString(),
        sender: this.session.member,
        attachment: checkedFile ? {
          id: tempId,
          name: checkedFile.name,
          mime_type: checkedFile.type || 'application/octet-stream',
          size_bytes: checkedFile.size,
          public_url: URL.createObjectURL(checkedFile)
        } : null
      };

      input.value = '';
      this.autoResizeComposer(input);
      this.clearSelectedFile();
      this.broadcastTyping();
      const list = document.getElementById('chat-mention-autocomplete');
      if (list) list.hidden = true;
      this.mentionActive = false;
      status.textContent = '';
      status.classList.remove('error');

      this.appendMessage(tempMessage, { forceScroll: true });
      const tempEl = document.querySelector(`[data-message-id="${CSS.escape(tempId)}"]`);
      if (tempEl) tempEl.style.opacity = '0.6';

      let attachmentId = null;
      if (checkedFile) attachmentId = await this.uploadAttachment(checkedFile);
      const message = validateMessage(rawText, attachmentId ? { id: attachmentId } : null);
      
      const { data, error } = await this.client.rpc('send_chat_message', {
        p_member_id: this.session.member.id,
        p_login_code: this.session.code,
        p_room_id: targetRoom,
        p_text: message.text,
        p_attachment_id: attachmentId
      }).single();
      
      if (error) throw error;
      const result = chatSendResult(data);
      
      if (result.mutedUntil) {
        this.session.member.chat_muted_until = result.mutedUntil;
        localStorage.setItem('pp_session', JSON.stringify(this.session));
        this.renderAccount();
        this.renderMuteState();
      }
      
      this.renderedMessageIds.delete(tempId);
      this.renderedMessages = this.renderedMessages.filter(m => m.id !== tempId);
      if (tempEl) tempEl.remove();

      if (result.messageId) {
        if (!this.renderedMessageIds.has(result.messageId)) {
          let insertedMessage;
          if (!attachmentId && this.portal?.members) {
            insertedMessage = {
              id: result.messageId,
              room_id: targetRoom,
              text: message.text,
              kind: tempMessage.kind,
              created_at: tempMessage.created_at,
              sender: this.session.member,
              attachment: null
            };
          } else {
            insertedMessage = await this.fetchMessage(result.messageId, targetRoom);
          }
          if (targetRoom === this.activeRoom) {
            this.appendMessage(insertedMessage, { forceScroll: true });
          }
        }
      }
      if (!result.accepted) {
        status.textContent = result.message;
        status.classList.add('error');
      }
    } catch (error) {
      status.textContent = error.message || 'Không thể gửi tin nhắn.';
      status.classList.add('error');
      if (tempId) {
        this.renderedMessageIds.delete(tempId);
        this.renderedMessages = this.renderedMessages.filter(m => m.id !== tempId);
        const tempEl = document.querySelector(`[data-message-id="${CSS.escape(tempId)}"]`);
        if (tempEl) tempEl.remove();
        this.rerenderMessages();
      }
    } finally {
      this.renderMuteState();
    }
  }

  renderMuteState() {
    clearTimeout(this.muteTimer);
    this.muteTimer = null;
    const mutedUntil = this.session?.member?.chat_muted_until;
    const remaining = mutedUntil ? new Date(mutedUntil).getTime() - Date.now() : 0;
    const muted = remaining > 0;
    for (const id of ['chat-message-input', 'chat-file-input', 'chat-send-btn']) {
      const control = document.getElementById(id);
      if (control) control.disabled = muted;
    }
    const fileButton = document.querySelector('.chat-file-button');
    fileButton?.classList.toggle('disabled', muted);
    fileButton?.setAttribute('aria-disabled', String(muted));
    document.getElementById('chat-compose-form')?.classList.toggle('muted', muted);
    const status = document.getElementById('chat-mute-status');
    if (status) {
      status.hidden = !muted;
      status.textContent = muted ? `Đã bị khóa mõm · còn ${formatMuteCountdown(mutedUntil)}` : '';
    }
    if (muted) {
      this.muteTimer = setTimeout(() => {
        this.renderAccount();
        this.portal.render();
        this.applyEffectiveMemberNamesToPortal();
        this.rerenderMessages();
        this.renderMuteState();
      }, Math.min(1000, remaining));
    }
  }

  rerenderMessages() {
    const list = document.getElementById('chat-message-list');
    if (!list || !this.renderedMessages.length) return;
    const decorated = decorateMessages(this.renderedMessages);
    this.renderedMessages = decorated;
    list.innerHTML = decorated.map(message => this.messageMarkup(message)).join('');
  }

  applyEffectiveMemberNamesToPortal() {
    for (const member of this.portal.members || []) {
      const name = effectiveMemberName(member);
      document.querySelectorAll(`[data-member-id="${CSS.escape(String(member.id))}"] .m-name`).forEach(element => {
        element.textContent = name;
      });
    }
  }

  async uploadAttachment(file) {
    const path = `${this.session.member.id}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await this.client.storage.from('chat-files').upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;
    const { data: urlData } = this.client.storage.from('chat-files').getPublicUrl(path);
    const { data, error } = await this.client.from('attachments').insert({
      sender_id: this.session.member.id, name: file.name, mime_type: file.type || 'application/octet-stream', size_bytes: file.size,
      storage_path: path, public_url: urlData.publicUrl
    }).select('id').single();
    if (error) throw error;
    return data.id;
  }

  async loadNotifications() {
    if (!this.session?.member?.id) {
      this.notifications = [];
      this.renderNotifications();
      return;
    }
    const { data, error } = await this.client.from('notifications').select('*')
      .eq('recipient_id', this.session.member.id).order('created_at', { ascending: false }).limit(50);
    if (error) {
      const list = document.getElementById('notification-list');
      if (list) list.innerHTML = `<p class="notification-empty error">${escapeHtml(error.message)}</p>`;
      return;
    }
    this.notifications = data || [];
    this.renderNotifications();
  }

  handleNotification(notification) {
    if (!notification || notification.recipient_id !== this.session?.member?.id) return;
    if (this.notifications.some(item => item.id === notification.id)) return;
    this.notifications.unshift(notification);
    this.notifications = this.notifications.slice(0, 50);
    this.renderNotifications();
    this.showBrowserNotification(notification);
  }

  renderNotifications() {
    const summary = aggregateUnreadNotifications(this.notifications);
    document.title = notificationDocumentTitle(summary.total);
    this.setBadge(document.getElementById('notification-badge'), summary.total);
    this.setBadge(document.getElementById('chat-tab-badge'), summary.chat);
    document.querySelectorAll('.chat-room').forEach(room => {
      this.setBadge(room.querySelector('.room-unread-badge'), summary.rooms[room.dataset.room] || 0);
    });
    const list = document.getElementById('notification-list');
    if (!list) return;
    if (!this.session?.member) {
      list.innerHTML = '<p class="notification-empty">Đăng nhập để xem thông báo.</p>';
      return;
    }
    if (!this.notifications.length) {
      list.innerHTML = '<p class="notification-empty">Chưa có thông báo mới.</p>';
      return;
    }
    list.innerHTML = this.notifications.map(notification => {
      const unread = notification.read_at ? '' : ' unread';
      return `<button class="notification-item${unread}" type="button" data-notification-id="${escapeHtml(notification.id)}"><span class="notification-kind">${this.notificationIcon(notification.kind)}</span><span><strong>${escapeHtml(notification.title)}</strong><small>${escapeHtml(notification.body || '')}</small><time>${escapeHtml(formatTime(notification.created_at))}</time></span></button>`;
    }).join('');
  }

  notificationIcon(kind) {
    return ({ message: '●', task: '✓', allocation: '↔', profile: '○' })[kind] || '●';
  }

  setBadge(element, count) {
    if (!element) return;
    element.textContent = count > 99 ? '99+' : String(count);
    element.hidden = count <= 0;
  }

  async markNotificationRead(notificationId) {
    const notification = this.notifications.find(item => item.id === notificationId);
    if (!notification || notification.read_at) return notification;
    const readAt = new Date().toISOString();
    const { error } = await this.client.from('notifications').update({ read_at: readAt })
      .eq('id', notificationId).eq('recipient_id', this.session.member.id);
    if (error) throw error;
    notification.read_at = readAt;
    this.renderNotifications();
    return notification;
  }

  async markAllNotificationsRead() {
    if (!this.session?.member) return this.openLogin();
    const unreadIds = this.notifications.filter(item => !item.read_at).map(item => item.id);
    if (!unreadIds.length) return;
    const readAt = new Date().toISOString();
    const { error } = await this.client.from('notifications').update({ read_at: readAt })
      .eq('recipient_id', this.session.member.id).in('id', unreadIds);
    if (error) return this.toast(error.message, 'error');
    this.notifications.forEach(item => { if (!item.read_at) item.read_at = readAt; });
    this.renderNotifications();
  }

  async markRoomNotificationsRead(roomId) {
    if (!this.session?.member) return;
    const unread = this.notifications.filter(item => item.kind === 'message' && item.room_id === roomId && !item.read_at);
    if (!unread.length) return;
    const readAt = new Date().toISOString();
    const ids = unread.map(item => item.id);
    const { error } = await this.client.from('notifications').update({ read_at: readAt })
      .eq('recipient_id', this.session.member.id).in('id', ids);
    if (error) return;
    unread.forEach(item => { item.read_at = readAt; });
    this.renderNotifications();
  }

  async openNotification(notificationId) {
    try {
      const notification = await this.markNotificationRead(notificationId);
      if (!notification) return;
      document.getElementById('notification-panel').hidden = true;
      document.getElementById('notification-button')?.setAttribute('aria-expanded', 'false');
      this.portal.switchTab(notification.target_tab);
      if (notification.target_tab === 'chat' && notification.room_id) await this.openRoom(notification.room_id);
    } catch (error) {
      this.toast(error.message || 'Không thể mở thông báo.', 'error');
    }
  }

  async requestBrowserNotifications() {
    if (!('Notification' in window)) {
      this.browserNotificationsEnabled = false;
      this.renderNotificationPermission('Trình duyệt không hỗ trợ.');
      return;
    }
    if (Notification.permission === 'granted' && this.browserNotificationsEnabled) {
      this.browserNotificationsEnabled = false;
    } else {
      const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
      this.browserNotificationsEnabled = permission === 'granted';
    }
    localStorage.setItem('pp_browser_notifications', String(this.browserNotificationsEnabled));
    this.renderNotificationPermission();
  }

  renderNotificationPermission(message = '') {
    const button = document.getElementById('browser-notification-toggle');
    const status = document.getElementById('browser-notification-status');
    const supported = 'Notification' in window;
    const permission = supported ? Notification.permission : 'unsupported';
    if (button) button.textContent = this.browserNotificationsEnabled && permission === 'granted' ? 'Tắt thông báo' : 'Bật thông báo';
    if (status) status.textContent = message || (permission === 'denied' ? 'Đã bị trình duyệt chặn' : this.browserNotificationsEnabled ? 'Đang bật' : 'Chưa bật');
  }

  showBrowserNotification(notification) {
    const permission = 'Notification' in window ? Notification.permission : 'unsupported';
    if (!canShowBrowserNotification({
      enabled: this.browserNotificationsEnabled,
      permission,
      hidden: document.hidden,
      actorId: notification.actor_id,
      memberId: this.session?.member?.id
    })) return;
    const copy = formatBrowserNotification(notification);
    const systemNotification = new Notification(copy.title, { body: copy.body, tag: notification.id });
    systemNotification.onclick = () => {
      window.focus();
      this.openNotification(notification.id);
      systemNotification.close();
    };
  }

  setConnection(online, detail = '') {
    for (const id of ['realtime-status', 'supabase-status-badge']) {
      const badge = document.getElementById(id);
      if (!badge) continue;
      badge.textContent = online ? 'Đang trực tuyến' : 'Mất kết nối';
      badge.className = `connection-indicator ${online ? 'online' : 'offline'}`;
      badge.title = detail || '';
    }
    const roomStatus = document.getElementById('chat-room-status');
    if (roomStatus) {
      roomStatus.textContent = `7 thành viên · ${online ? 'Đang hoạt động' : 'Mất kết nối'}`;
      roomStatus.classList.toggle('offline', !online);
    }
  }

  toast(message, type = 'success') {
    let root = document.getElementById('portal-toast');
    if (!root) {
      root = document.createElement('div');
      root.id = 'portal-toast';
      document.body.append(root);
    }
    root.textContent = message;
    root.className = `portal-toast ${type} active`;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => root.classList.remove('active'), 2600);
  }
}
