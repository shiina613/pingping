import './config.js';
import { DEFAULT_MEMBERS, COMPETITIONS, INITIAL_ALLOCATIONS, DEFAULT_KANBAN_TASKS } from './src/constants.js';
import { CollaborationController, escapeHtml } from './collaboration-controller.js';
import { buildCalendar, getTeamSizeWarning } from './collaboration.js';
import { getCompetitionCountdowns, getCountdownParts } from './src/countdown.js';
import { boardSize, createEmptyBoard, getFourThreat } from './src/xo.js';

class TeamPortal {
  constructor() {
    this.members = this.loadData('pp_members', DEFAULT_MEMBERS);
    this.allocations = this.loadData('pp_allocations', INITIAL_ALLOCATIONS);
    this.kanbanTasks = this.loadData('pp_kanban_tasks', DEFAULT_KANBAN_TASKS);
    this.theme = this.loadData('pp_theme', document.documentElement.dataset.theme || 'light');

    this.activeKanbanComp = 'onevoice';
    this.xoState = createEmptyBoard();
    this.xoMatches = [];
    this.xoRatings = [];
    this.xoWallets = [];
    this.xoCheckin = null;
    this.xoBets = [];
    this.xoActiveGame = null;
    this.xoSelectedMatchId = null;
    this.xoWalletBalance = null;
    this.xoChannel = null;
    this.xoReloadTimer = null;
    this.xoThreatNoticeKey = null;
    this.xoThreatTimer = null;
    this.countdownTimer = null;
    this.activeDragElement = null;
    this.tempAvatar = ''; // Temp cache for modal photo updates

    this.initDOM();
    this.initEvents();
    
    const hashTab = window.location.hash.replace('#', '') || 'dashboard';
    this.switchTab(hashTab, false);
    
    window.addEventListener('hashchange', () => {
      const tab = window.location.hash.replace('#', '') || 'dashboard';
      this.switchTab(tab, false);
    });

    this.applyTheme();
    this.render();
    this.startCollaboration();
    this.setupMeteorEngine();
  }

  setupMeteorEngine() {
    let canvas = document.getElementById('meteor-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'meteor-canvas';
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:0;';
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const meteors = [];

    const spawnMeteor = () => {
      if (document.hidden) return;

      const angleDeg = 36 + Math.random() * 8; // 36deg to 44deg sweep
      const angleRad = (angleDeg * Math.PI) / 180;
      const speed = 14 + Math.random() * 9;
      const length = 140 + Math.random() * 160;

      // Start from upper right sky region
      const startX = Math.random() * (width * 0.95) + width * 0.15;
      const startY = Math.random() * (height * 0.4) - 60;

      meteors.push({
        x: startX,
        y: startY,
        dx: -Math.cos(angleRad) * speed,
        dy: Math.sin(angleRad) * speed,
        length: length,
        life: 0,
        maxLife: 42 + Math.floor(Math.random() * 25),
        width: 1.6 + Math.random() * 1.4,
        color: Math.random() > 0.35 ? '#fbbf24' : '#fb7185',
      });
    };

    // 1. Regular single shooting stars every 2.5s to 5.5s
    const scheduleSingleMeteors = () => {
      const delay = 2500 + Math.random() * 3000;
      setTimeout(() => {
        spawnMeteor();
        scheduleSingleMeteors();
      }, delay);
    };
    scheduleSingleMeteors();

    // 2. Random light meteor shower every 15s to 28s
    const triggerShower = () => {
      const count = 7 + Math.floor(Math.random() * 8); // 7 to 14 meteors
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          spawnMeteor();
        }, i * (120 + Math.random() * 160));
      }
    };

    const scheduleShowers = () => {
      const delay = 15000 + Math.random() * 13000;
      setTimeout(() => {
        triggerShower();
        scheduleShowers();
      }, delay);
    };

    // Initial shower after 2.5 seconds
    setTimeout(() => {
      triggerShower();
      scheduleShowers();
    }, 2500);

    // 60FPS Silky Canvas Render Loop
    const animLoop = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.dx;
        m.y += m.dy;
        m.life++;

        const progress = m.life / m.maxLife;
        let alpha = 1;
        if (progress < 0.15) {
          alpha = progress / 0.15;
        } else if (progress > 0.7) {
          alpha = (1 - progress) / 0.3;
        }

        const normX = m.dx / Math.hypot(m.dx, m.dy);
        const normY = m.dy / Math.hypot(m.dx, m.dy);

        const tailX = m.x - normX * m.length * (1 - progress * 0.2);
        const tailY = m.y - normY * m.length * (1 - progress * 0.2);

        // Luminous streak gradient
        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.65, m.color);
        grad.addColorStop(1, '#ffffff');

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = m.width;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glowing nucleus head
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.width * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();

        if (m.life >= m.maxLife || m.x < -150 || m.y > height + 150) {
          meteors.splice(i, 1);
        }
      }

      requestAnimationFrame(animLoop);
    };

    animLoop();
  }

  loadData(key, fallback) {
    const raw = localStorage.getItem(key);
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('Error loading localStorage key: ' + key, e);
      return fallback;
    }
  }

  saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  initDOM() {
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabPanels = document.querySelectorAll('.tab-panel');

    this.statActiveComp = document.getElementById('stat-active-comp');
    this.statActiveTeams = document.getElementById('stat-active-teams');
    this.statNearestDays = document.getElementById('stat-nearest-days');

    this.countdownContainer = document.getElementById('competition-countdowns');

    this.modal = document.getElementById('edit-member-modal');
    this.modalTitle = document.getElementById('modal-title-text');
    this.modalInputId = document.getElementById('edit-member-id');
    this.modalInputName = document.getElementById('edit-member-name');
    this.modalInputRole = document.getElementById('edit-member-role');
    this.modalInputSkills = document.getElementById('edit-member-skills');

    this.sbStatusBadge = document.getElementById('supabase-status-badge');

    this.taskModal = document.getElementById('add-task-modal');
    this.taskInputTitle = document.getElementById('task-title');
    this.taskInputDesc = document.getElementById('task-desc');
    this.taskInputAssignee = document.getElementById('task-assignee');
    this.taskInputColumn = document.getElementById('task-column');

    this.aboutUpdateButton = document.getElementById('about-update-button');
    this.aboutUpdateModal = document.getElementById('about-update-modal');
    this.xoBoard = document.getElementById('xo-board');
  }

  initEvents() {
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchTab(btn.getAttribute('data-tab'), true);
      });
    });

    const savePlannerBtn = document.getElementById('save-allocations-btn');
    if (savePlannerBtn) {
      savePlannerBtn.addEventListener('click', async () => {
        if (!this.collaboration?.requireLogin()) return;
        try {
          await this.collaboration.saveAllocations();
          this.collaboration.toast('Đội hình đã được lưu.', 'success');
        } catch (error) {
          this.collaboration.toast(error.message || 'Không thể lưu đội hình.', 'error');
          await this.collaboration.loadSnapshot();
        }
      });
    }

    const exportBtnTimeline = document.getElementById('export-calendar-btn-timeline');
    if (exportBtnTimeline) {
      exportBtnTimeline.addEventListener('click', () => this.exportCalendar());
    }

    // Modal profile triggers
    const modalCloseX = document.getElementById('modal-close-x');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalSaveBtn = document.getElementById('modal-save-btn');

    if (modalCloseX) modalCloseX.addEventListener('click', () => this.closeModal());
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', () => this.closeModal());
    if (modalSaveBtn) modalSaveBtn.addEventListener('click', () => this.saveMemberProfile());

    // Kanban Modals
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskCloseX = document.getElementById('task-modal-close-x');
    const taskCancelBtn = document.getElementById('task-modal-cancel-btn');
    const taskSaveBtn = document.getElementById('task-modal-save-btn');

    if (addTaskBtn) addTaskBtn.addEventListener('click', () => this.openTaskModal());
    if (taskCloseX) taskCloseX.addEventListener('click', () => this.closeTaskModal());
    if (taskCancelBtn) taskCancelBtn.addEventListener('click', () => this.closeTaskModal());
    if (taskSaveBtn) taskSaveBtn.addEventListener('click', () => this.saveNewKanbanTask());

    const kanbanCompSelect = document.getElementById('kanban-comp-select');
    if (kanbanCompSelect) {
      kanbanCompSelect.addEventListener('change', (e) => {
        this.activeKanbanComp = e.target.value;
        this.render();
      });
    }

    // Toggle theme button
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    document.getElementById('about-update-button')?.addEventListener('click', () => this.openAboutUpdate());
    document.getElementById('about-update-close')?.addEventListener('click', () => this.closeAboutUpdate());
    document.getElementById('about-update-modal')?.addEventListener('click', event => {
      if (event.target.id === 'about-update-modal') this.closeAboutUpdate();
    });
    document.getElementById('xo-refresh-btn')?.addEventListener('click', () => this.loadXoCasino());
    document.getElementById('citizen-checkin-button')?.addEventListener('click', () => this.claimCitizenCheckin());
    document.getElementById('checkin-penalty-close')?.addEventListener('click', () => this.closeCheckinPenalty());
    document.getElementById('checkin-penalty-modal')?.addEventListener('click', event => {
      if (event.target.id === 'checkin-penalty-modal') this.closeCheckinPenalty();
    });
    document.getElementById('xo-challenge-form')?.addEventListener('submit', event => {
      event.preventDefault();
      this.createXoChallenge();
    });
    document.getElementById('xo-bet-form')?.addEventListener('submit', event => {
      event.preventDefault();
      this.placeXoBet();
    });
    document.getElementById('xo-open-matches')?.addEventListener('click', event => {
      const button = event.target.closest('[data-xo-action]');
      if (!button) return;
      if (button.dataset.xoAction === 'view') this.selectXoMatch(button.dataset.matchId);
      else this.respondXoChallenge(button.dataset.matchId, button.dataset.xoAction === 'accept');
    });
    document.getElementById('xo-recent-matches')?.addEventListener('click', event => {
      const button = event.target.closest('[data-match-id]');
      if (button) this.selectXoMatch(button.dataset.matchId);
    });

    // Custom base64 image uploader event
    const fileInput = document.getElementById('avatar-file-input');
    const emojiInput = document.getElementById('edit-member-emoji');
    const previewBox = document.getElementById('edit-avatar-preview');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            this.tempAvatar = reader.result; // Base64 string
            previewBox.innerHTML = `<img src="${this.tempAvatar}" class="member-avatar-img" alt="Avatar Preview">`;
            emojiInput.value = ''; // Clear emoji text if file chosen
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (emojiInput) {
      emojiInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (val) {
          this.tempAvatar = val;
          previewBox.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:1.5rem;">${val}</div>`;
        }
      });
    }

    window.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
      if (e.target === this.taskModal) this.closeTaskModal();
    });
  }

  switchTab(tabName, updateHash = true) {
    if (tabName === 'xo' && !this.isXoArenaVisible()) tabName = 'dashboard';
    this.currentTab = tabName;
    document.body.classList.toggle('chat-active', tabName === 'chat');
    this.tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    this.tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.getAttribute('id') === `tab-${tabName}`);
    });
    this.render();
    if (tabName === 'chat') this.collaboration?.loadMessages();
    if (tabName === 'xo') this.loadXoCasino();
    if (updateHash) window.history.pushState(null, '', `#${tabName}`);
  }

  async startCollaboration() {
    const config = window.PINGPING_CONFIG;
    if (!config?.supabaseUrl || !config?.supabaseKey || !window.supabase?.createClient) {
      console.error('Thiếu cấu hình Supabase hoặc SDK không tải được.');
      return;
    }
    this.collaboration = new CollaborationController(this, window.supabase.createClient(config.supabaseUrl, config.supabaseKey));
    try {
      await this.collaboration.init();
      if (this.currentTab === 'xo') await this.loadXoCasino();
    } catch (error) {
      console.error('Không thể khởi tạo cộng tác:', error);
      this.collaboration.setConnection(false, error.message);
    }
  }

  // ==========================================================================
  // UI/UX REDESIGN: LIGHT/DARK MODE IMPLEMENTATION
  // ==========================================================================

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.saveData('pp_theme', this.theme);
    this.applyTheme();
  }

  applyTheme() {
    const isLight = this.theme === 'light';
    document.documentElement.dataset.theme = this.theme;
    document.body.classList.toggle('light-theme', isLight);
    const themeBtn = document.getElementById('theme-toggle');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(!isLight));
      themeBtn.setAttribute('aria-label', isLight ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng');
    }
    if (themeMeta) themeMeta.content = isLight ? '#f3f5f8' : '#101319';
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      if (isLight) {
        // Render Moon SVG for switching back to dark
        themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"></path>`;
      } else {
        // Render Sun SVG for switching back to light
        themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path>`;
      }
    }
  }

  // ==========================================================================
  // VIEW RENDERER HELPER: VISUAL AVATAR ENGINE
  // ==========================================================================

  renderAvatarMarkup(member, sizeClass = '') {
    const initials = member.name.split(' ').map(n => n[0]).join('');
    const bubbleBg = member.color;

    if (member.avatar) {
      if (member.avatar.startsWith('data:image/')) {
        return `<div class="${sizeClass}" style="background: ${bubbleBg}; border: 1.5px solid rgba(255,255,255,0.15);" title="${member.name} - ${member.role}"><img src="${member.avatar}" class="member-avatar-img" alt="${member.name}"></div>`;
      } else {
        // Emoji
        return `<div class="${sizeClass}" style="background: ${bubbleBg}; display: flex; align-items: center; justify-content: center; font-size: 1.25em;" title="${member.name} - ${member.role}">${member.avatar}</div>`;
      }
    }
    // Fallback to text initials
    return `<div class="${sizeClass}" style="background: ${bubbleBg}; display: flex; align-items: center; justify-content: center; color: white; font-weight:700;" title="${member.name} - ${member.role}">${initials}</div>`;
  }

  render() {
    this.applyFeatureFlags();
    this.renderStats();
    this.setupCountdown();

    if (this.currentTab === 'dashboard') {
      this.renderDashboard();
    } else if (this.currentTab === 'competitions') {
      this.renderCompetitions();
    } else if (this.currentTab === 'planner') {
      this.renderPlanner();
    } else if (this.currentTab === 'timeline') {
      this.renderTimeline();
    } else if (this.currentTab === 'directory') {
      this.renderDirectory();
    } else if (this.currentTab === 'kanban') {
      this.renderKanbanBoard();
    } else if (this.currentTab === 'settings') {
      this.renderSettings();
    } else if (this.currentTab === 'xo') {
      this.renderXoArena();
    }
  }

  getNearestMilestone() {
    let nearest = null;
    let minDiff = Infinity;
    const now = new Date();

    COMPETITIONS.forEach(comp => {
      comp.timeline.forEach(event => {
        const eventDate = new Date(event.date);
        const diff = eventDate - now;
        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          nearest = { comp, event };
        }
      });
    });

    return nearest;
  }

  setupCountdown() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    const countdowns = getCompetitionCountdowns(COMPETITIONS);
    this.countdownContainer.innerHTML = countdowns.map(({ comp, event }) => `
      <div class="glass-card countdown-box competition-countdown-row" data-countdown-id="${comp.id}">
        <div class="countdown-header">
          <div>
            <span class="stat-label" style="color: var(--accent-rose);">Sự kiện sắp tới</span>
            <h3 class="countdown-title">${comp.name}</h3>
          </div>
          <div class="countdown-milestone">${event ? `${event.label} (${new Date(event.date).toLocaleDateString('vi-VN')})` : 'Đã hoàn thành'}</div>
        </div>
        <div class="countdown-display">
          ${[['days', 'Ngày'], ['hours', 'Giờ'], ['minutes', 'Phút'], ['seconds', 'Giây']].map(([part, label]) => `
            <div class="countdown-unit">
              <span class="countdown-value" data-countdown-part="${part}">00</span>
              <span class="countdown-label">${label}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    const updateTimer = () => {
      const now = new Date();
      for (const { comp, event } of countdowns) {
        if (!event) continue;
        if (new Date(event.date) <= now) {
          this.setupCountdown();
          return;
        }

        const row = this.countdownContainer.querySelector(`[data-countdown-id="${comp.id}"]`);
        const parts = getCountdownParts(new Date(event.date), now);
        Object.entries(parts).forEach(([part, value]) => {
          row.querySelector(`[data-countdown-part="${part}"]`).innerText = value;
        });
      }
    };

    updateTimer();
    if (countdowns.some(({ event }) => event)) {
      this.countdownTimer = setInterval(updateTimer, 1000);
    }
  }

  renderStats() {
    this.statActiveComp.innerText = `${COMPETITIONS.length} / ${COMPETITIONS.length}`;

    let teamCount = 0;
    COMPETITIONS.forEach(({ id: compId }) => {
      const alloc = this.allocations[compId];
      if (alloc.members) teamCount += 1;
      if (alloc.teamA) teamCount += 1;
      if (alloc.teamB) teamCount += 1;
    });
    this.statActiveTeams.innerText = `${teamCount} Nhóm`;

    const nearest = this.getNearestMilestone();
    if (nearest) {
      const diffTime = new Date(nearest.event.date) - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.statNearestDays.innerText = diffDays > 0 ? `${diffDays} Ngày` : 'Hôm nay!';
    } else {
      this.statNearestDays.innerText = 'N/A';
    }
  }

  renderDashboard() {
    // 1. Render active allocations map with avatar chips
    const allocContainer = document.getElementById('dashboard-allocations-list');
    allocContainer.innerHTML = '';

    COMPETITIONS.forEach(comp => {
      const alloc = this.allocations[comp.id];
      let allocationHTML = '';

      if (comp.id === 'onevoice') {
        const teamMembers = (alloc.members || []).map(id => this.getMemberById(id)).filter(Boolean);
        allocationHTML = `
          <div class="comp-meta-row" style="padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
            <div style="flex: 1;">
              <span class="q-comp-name" style="color: var(--accent-cyan); font-weight: 700;">${comp.name}</span>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem;">Đội hình chung (Cả 7 người)</div>
            </div>
            <div class="quick-members-list">
              ${teamMembers.map(m => this.renderAvatarMarkup(m, 'quick-member-bubble')).join('')}
            </div>
          </div>
        `;
      } else {
        const teamAMembers = (alloc.teamA || []).map(id => this.getMemberById(id)).filter(Boolean);
        const teamBMembers = (alloc.teamB || []).map(id => this.getMemberById(id)).filter(Boolean);

        allocationHTML = `
          <div style="padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.03);">
            <span class="q-comp-name" style="color: var(--accent-purple); font-weight: 700;">${comp.name}</span>
            <div style="display: flex; justify-content: space-between; margin-top: 0.35rem;">
              <div style="display: flex; align-items: center; justify-content: space-between; flex: 1; border-right: 1px solid rgba(255,255,255,0.05); padding-right: 0.75rem;">
                <span style="font-size: 0.75rem; color: var(--text-secondary);">Nhóm A:</span>
                <div class="quick-members-list">
                  ${teamAMembers.map(m => this.renderAvatarMarkup(m, 'quick-member-bubble')).join('')}
                </div>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; flex: 1; padding-left: 0.75rem;">
                <span style="font-size: 0.75rem; color: var(--text-secondary);">Nhóm B:</span>
                <div class="quick-members-list">
                  ${teamBMembers.map(m => this.renderAvatarMarkup(m, 'quick-member-bubble')).join('')}
                </div>
              </div>
            </div>
          </div>
        `;
      }
      allocContainer.insertAdjacentHTML('beforeend', allocationHTML);
    });

    // 2. Render chronological upcoming events
    const quickTimelineContainer = document.getElementById('dashboard-timeline-list');
    quickTimelineContainer.innerHTML = '';

    const allEvents = [];
    COMPETITIONS.forEach(comp => {
      comp.timeline.forEach(event => {
        allEvents.push({ comp, event });
      });
    });

    const now = new Date();
    const upcomingEvents = allEvents
      .filter(item => new Date(item.event.date) >= now)
      .sort((a, b) => new Date(a.event.date) - new Date(b.event.date))
      .slice(0, 5);

    upcomingEvents.forEach(item => {
      const d = new Date(item.event.date);
      const day = d.getDate();
      const month = `Thg ${d.getMonth() + 1}`;

      const chipColor = item.event.type === 'registration' ? 'rgba(239, 68, 68, 0.15)' : item.event.type === 'final' ? 'rgba(16, 184, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)';
      const chipTextColor = item.event.type === 'registration' ? 'var(--accent-rose)' : item.event.type === 'final' ? 'var(--accent-emerald)' : 'var(--accent-blue)';
      const chipLabel = item.event.type === 'registration' ? 'Đăng ký' : item.event.type === 'final' ? 'Chung kết' : 'Mốc phụ';

      const itemHTML = `
        <div class="quick-timeline-item">
          <div class="q-date-badge">
            <span class="q-day">${day}</span>
            <span class="q-month">${month}</span>
          </div>
          <div class="q-details">
            <div class="q-comp-name" style="color: var(--text-muted);">${item.comp.name}</div>
            <div class="q-event-title">${item.event.label}</div>
            <span class="q-tag" style="background: ${chipColor}; color: ${chipTextColor}; font-weight: 600;">${chipLabel}</span>
          </div>
        </div>
      `;
      quickTimelineContainer.insertAdjacentHTML('beforeend', itemHTML);
    });

    // 3. Render Workload Chart
    const ctx = document.getElementById('workload-chart');
    if (ctx && window.Chart) {
      if (this.workloadChart) this.workloadChart.destroy();
      
      const memberNames = this.members.map(m => m.name);
      const memberTasksCount = this.members.map(m => {
        let count = 0;
        Object.values(this.kanbanTasks || {}).forEach(tasks => {
          count += tasks.filter(t => t.assignee === m.id && t.column !== 'done').length;
        });
        return count;
      });

      this.workloadChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: memberNames,
          datasets: [{
            label: 'Task cần làm',
            data: memberTasksCount,
            backgroundColor: this.members.map(m => (m.color || '#8b5cf6') + '88'),
            borderColor: this.members.map(m => m.color || '#8b5cf6'),
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: this.theme === 'dark' ? '#94a3b8' : '#64748b' }
            },
            x: {
              ticks: { color: this.theme === 'dark' ? '#94a3b8' : '#64748b' }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  // ==========================================================================
  // VIEW RENDERERS: COMPETITIONS (with slide-down details)
  // ==========================================================================

  renderCompetitions() {
    const container = document.getElementById('competitions-list-container');
    container.innerHTML = '';

    COMPETITIONS.forEach(comp => {
      const alloc = this.allocations[comp.id];
      let teamDisplayHTML = '';

      if (comp.id === 'onevoice') {
        const teamMembers = (alloc.members || []).map(id => this.getMemberById(id)).filter(Boolean);
        teamDisplayHTML = `
          <div class="quick-members-list">
            ${teamMembers.map(m => this.renderAvatarMarkup(m, 'quick-member-bubble')).join('')}
          </div>
        `;
      } else {
        const teamAMembers = (alloc.teamA || []).map(id => this.getMemberById(id)).filter(Boolean);
        const teamBMembers = (alloc.teamB || []).map(id => this.getMemberById(id)).filter(Boolean);
        teamDisplayHTML = `
          <div style="display:flex; gap:1.5rem; align-items:center;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:0.75rem; color:var(--text-secondary);">Nhóm A:</span>
              <div class="quick-members-list">${teamAMembers.map(m => this.renderAvatarMarkup(m, 'quick-member-bubble')).join('')}</div>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:0.75rem; color:var(--text-secondary);">Nhóm B:</span>
              <div class="quick-members-list">${teamBMembers.map(m => this.renderAvatarMarkup(m, 'quick-member-bubble')).join('')}</div>
            </div>
          </div>
        `;
      }

      const listTopicsHTML = comp.topics.map(t => `<li class="comp-topic-item">• ${t}</li>`).join('');
      const listPrizesHTML = comp.prizes.map(p => `<li>🏆 ${p}</li>`).join('');

      const compEvents = comp.timeline.map(t => {
        const formattedDate = new Date(t.date).toLocaleDateString('vi-VN');
        return `<div class="comp-timeline-step">
          <span>${t.label}</span>
          <span style="font-weight: 600;">${formattedDate}</span>
        </div>`;
      }).join('');

      const cardHTML = `
        <div class="glass-card comp-card">
          <div class="comp-card-glow" style="background: ${comp.glow};"></div>
          
          <div class="comp-visual-panel">
            <div>
              <span class="comp-tag" style="background: ${comp.glow}; color: #ffffff;">${comp.status}</span>
              <h2 class="comp-title">${comp.name}</h2>
              <p class="comp-slogan">"${comp.slogan}"</p>
            </div>
            
            <div class="comp-meta-table">
              <div class="comp-meta-row">
                <span class="comp-meta-label">Ban tổ chức:</span>
                <span class="comp-meta-val">${comp.organizer}</span>
              </div>
              <div class="comp-meta-row">
                <span class="comp-meta-label">Thành viên / Đội:</span>
                <span class="comp-meta-val">${comp.teamLimit.max === 99 ? 'Không giới hạn' : comp.teamLimit.min === comp.teamLimit.max ? `${comp.teamLimit.min} người` : `${comp.teamLimit.min}-${comp.teamLimit.max} người`}</span>
              </div>
            </div>
          </div>

          <div class="comp-content-panel">
            <div class="comp-team-alloc" style="margin-bottom:1.5rem; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="comp-team-label" style="font-weight:600;">Nhóm tham gia:</span>
                ${teamDisplayHTML}
              </div>
              
              <button class="btn-expand-details" onclick="portal.toggleCompDetails('${comp.id}')" id="btn-expand-${comp.id}">
                <span>Chi tiết thể lệ</span>
                <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:14px; height:14px;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"></path>
                </svg>
              </button>
            </div>

            <!-- Slide down collapsible section -->
            <div class="comp-collapsible-details" id="details-${comp.id}">
              <div class="comp-grid-details">
                <div>
                  <h4 class="comp-section-title">Nội dung đề tài</h4>
                  <ul style="list-style:none;">${listTopicsHTML}</ul>
                </div>
                <div>
                  <h4 class="comp-section-title">Giải thưởng chính</h4>
                  <ul>${listPrizesHTML}</ul>
                </div>
              </div>

              <div>
                <h4 class="comp-section-title">Mốc thời gian quan trọng</h4>
                <div class="comp-timeline-steps">${compEvents}</div>
              </div>
            </div>

            <div class="comp-footer" style="border-top: 1px solid rgba(255,255,255,0.04); padding-top:1rem; margin-top:0.75rem;">
              <span style="font-size:0.75rem; color:var(--text-muted);">Trạng thái: ${comp.status}</span>
              <a href="${comp.registrationLink}" target="_blank" class="btn-primary" style="padding: 0.5rem 1rem; font-size:0.8rem;">
                Trang chủ cuộc thi
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width:14px; height:14px;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', cardHTML);
    });
  }

  toggleCompDetails(compId) {
    const el = document.getElementById(`details-${compId}`);
    const btn = document.getElementById(`btn-expand-${compId}`);
    if (el && btn) {
      const active = el.classList.toggle('expanded');
      btn.classList.toggle('expanded', active);
      btn.querySelector('span').innerText = active ? 'Thu gọn thể lệ' : 'Chi tiết thể lệ';
    }
  }

  // ==========================================================================
  // VIEW RENDERERS: PLANNER (with quick selection dropdowns)
  // ==========================================================================

  renderPlanner() {
    // 1. Pool
    const poolContainer = document.getElementById('planner-member-pool');
    poolContainer.innerHTML = '';

    this.members.forEach(member => {
      const avatarBadge = this.renderAvatarMarkup(member, 'member-initials-bubble');

      const cardHTML = `
        <div class="draggable-member" draggable="true" data-member-id="${member.id}">
          <div class="member-core-info">
            ${avatarBadge}
            <div>
              <div class="m-name">${member.name}</div>
              <div class="m-role-label">${member.role}</div>
            </div>
          </div>
          
          <!-- Mobile friendly quick assign selector -->
          <div style="display:flex; align-items:center; gap:0.25rem;">
            <select class="quick-assign-select" onchange="portal.quickAssignMember('${member.id}', this)">
              <option value="" disabled selected>+</option>
              <option value="onevoice.members">OneVoice</option>
              <option value="thucchien.teamA">Thực chiến A</option>
              <option value="thucchien.teamB">Thực chiến B</option>
              <option value="viettel.teamA">Viettel AI A</option>
              <option value="viettel.teamB">Viettel AI B</option>
            </select>
          </div>
        </div>
      `;
      poolContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    // 2. Workspace
    const workspaceContainer = document.getElementById('planner-workspace-root');
    workspaceContainer.innerHTML = '';

    COMPETITIONS.forEach(comp => {
      const alloc = this.allocations[comp.id];
      let subteamsHTML = '';

      if (comp.id === 'onevoice') {
        const teamList = alloc.members || [];
        const warnings = this.checkTeamSizeWarning(comp, teamList.length);

        subteamsHTML = `
          <div class="subteams-grid" style="grid-template-columns: 1fr;">
            <div class="subteam-box" data-comp-id="${comp.id}" data-team-type="members">
              <div class="subteam-header">
                <span class="subteam-title" style="color: var(--accent-cyan);">Đội hình chung</span>
                <span class="subteam-count">${teamList.length} người</span>
              </div>
              <div class="subteam-members-list">
                ${teamList.map(memberId => this.renderAllocatedMemberMarkup(comp.id, 'members', memberId)).join('')}
              </div>
            </div>
          </div>
          ${warnings ? `<div class="alert-warning">${warnings}</div>` : ''}
        `;
      } else {
        const listA = alloc.teamA || [];
        const listB = alloc.teamB || [];
        const warningA = this.checkTeamSizeWarning(comp, listA.length, 'A');
        const warningB = this.checkTeamSizeWarning(comp, listB.length, 'B');

        subteamsHTML = `
          <div class="subteams-grid">
            <div class="subteam-box" data-comp-id="${comp.id}" data-team-type="teamA">
              <div class="subteam-header">
                <span class="subteam-title">Nhóm A</span>
                <span class="subteam-count">${listA.length} / ${comp.teamLimit.max} người</span>
              </div>
              <div class="subteam-members-list">
                ${listA.map(memberId => this.renderAllocatedMemberMarkup(comp.id, 'teamA', memberId)).join('')}
              </div>
              ${warningA ? `<div class="alert-warning">${warningA}</div>` : ''}
            </div>
            <div class="subteam-box" data-comp-id="${comp.id}" data-team-type="teamB">
              <div class="subteam-header">
                <span class="subteam-title">Nhóm B</span>
                <span class="subteam-count">${listB.length} / ${comp.teamLimit.max} người</span>
              </div>
              <div class="subteam-members-list">
                ${listB.map(memberId => this.renderAllocatedMemberMarkup(comp.id, 'teamB', memberId)).join('')}
              </div>
              ${warningB ? `<div class="alert-warning">${warningB}</div>` : ''}
            </div>
          </div>
        `;
      }

      const limitLabel = comp.teamLimit.max === 99 ? 'Không giới hạn số lượng' : comp.teamLimit.min === comp.teamLimit.max ? `Yêu cầu đúng ${comp.teamLimit.min} người` : `Yêu cầu ${comp.teamLimit.min}-${comp.teamLimit.max} người`;

      const rowHTML = `
        <div class="planner-comp-row">
          <div class="planner-comp-header">
            <h4 class="planner-comp-title">
              <span class="logo-icon" style="width: 24px; height: 24px; font-size:0.6rem; border-radius: 6px;">${comp.name[0]}</span>
              ${comp.name}
            </h4>
            <span class="planner-comp-limit">${limitLabel}</span>
          </div>
          ${subteamsHTML}
        </div>
      `;
      workspaceContainer.insertAdjacentHTML('beforeend', rowHTML);
    });

    this.attachDragAndDropHandlers();
  }

  quickAssignMember(memberId, selectElement) {
    const val = selectElement.value;
    if (!val) return;

    const [compId, teamType] = val.split('.');
    this.addMemberToAllocation(compId, teamType, memberId);

    // Reset selection
    selectElement.value = '';
  }

  renderAllocatedMemberMarkup(compId, teamType, memberId) {
    const member = this.getMemberById(memberId);
    if (!member) return '';
    return `<div class="allocated-member" draggable="true" data-member-id="${member.id}">
      ${this.renderAvatarMarkup(member, 'member-initials-bubble')}
      <span>${member.name}</span>
      <button type="button" class="allocated-member-remove" onclick="portal.removeMemberFromAllocation('${compId}','${teamType}','${member.id}')" aria-label="Bỏ ${member.name} khỏi đội">×</button>
    </div>`;
  }

  checkTeamSizeWarning(competition, count, teamLabel = '') {
    return getTeamSizeWarning(competition, count, teamLabel);
  }

  exportCalendar() {
    const blob = new Blob([buildCalendar(COMPETITIONS)], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'pingping-competitions-2026.ics';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  addMemberToAllocation(compId, teamType, memberId) {
    if (!this.collaboration?.requireLogin()) return;
    const allocation = (this.allocations[compId] ||= {});
    const list = (allocation[teamType] ||= []);
    if (!list.includes(memberId)) list.push(memberId);
    this.render();
  }

  removeMemberFromAllocation(compId, teamType, memberId) {
    if (!this.collaboration?.requireLogin()) return;
    const list = this.allocations[compId]?.[teamType] || [];
    this.allocations[compId][teamType] = list.filter(id => id !== memberId);
    this.render();
  }

  // ==========================================================================
  // VIEW RENDERERS: TIMELINE (with past / future visual checkmarks)
  // ==========================================================================

  renderTimeline() {
    const filterContainer = document.getElementById('timeline-filters-container');

    if (filterContainer.children.length === 0) {
      filterContainer.innerHTML = '';

      const allChip = `<button class="filter-chip active" data-filter="all">Tất cả cuộc thi</button>`;
      filterContainer.insertAdjacentHTML('beforeend', allChip);

      COMPETITIONS.forEach(comp => {
        const chip = `<button class="filter-chip" data-filter="${comp.id}">${comp.name}</button>`;
        filterContainer.insertAdjacentHTML('beforeend', chip);
      });

      const chips = filterContainer.querySelectorAll('.filter-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.filterTimelineEvents(chip.getAttribute('data-filter'));
        });
      });
    }

    this.filterTimelineEvents('all');
  }

  filterTimelineEvents(filterVal) {
    const eventsContainer = document.getElementById('timeline-events-list');
    eventsContainer.innerHTML = '';

    const allEvents = [];
    COMPETITIONS.forEach(comp => {
      comp.timeline.forEach(event => {
        if (filterVal === 'all' || comp.id === filterVal) {
          allEvents.push({ comp, event });
        }
      });
    });

    allEvents.sort((a, b) => new Date(a.event.date) - new Date(b.event.date));

    if (allEvents.length === 0) {
      eventsContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">Không tìm thấy mốc thời gian phù hợp.</div>';
      return;
    }

    const now = new Date();

    allEvents.forEach(item => {
      const eventDate = new Date(item.event.date);
      const isPast = eventDate < now;

      const formattedFullDate = eventDate.toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const todayClass = Math.abs(eventDate - now) < (1000 * 60 * 60 * 24) ? 'today' : '';

      const cardHTML = `
        <div class="timeline-event-card ${todayClass}" style="color: ${isPast ? 'var(--text-muted)' : 'inherit'}; opacity: ${isPast ? '0.6' : '1'};">
          <div class="timeline-event-header">
            <span class="timeline-event-date">${formattedFullDate}</span>
            <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: ${isPast ? 'var(--accent-emerald)' : 'var(--accent-cyan)'};">
              ${isPast ? '[✓] Đã qua' : 'Sắp tới'}
            </span>
          </div>
          <div class="timeline-event-body" style="border-left: 3px solid ${isPast ? 'var(--accent-emerald)' : 'var(--accent-blue)'}; background: ${isPast ? 'transparent' : 'rgba(255,255,255,0.01)'};">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing:0.05em; margin-bottom: 0.15rem;">
              ${item.comp.name}
            </div>
            <h4 class="t-event-title">${item.event.label}</h4>
            <p class="t-event-desc">Mốc quan trọng của cuộc thi. Các nhóm gán vui lòng lưu ý thời gian hoàn thành.</p>
          </div>
        </div>
      `;
      eventsContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
  }

  // ==========================================================================
  // VIEW RENDERERS: KANBAN & DIRECTORY (with custom Base64 avatar display)
  // ==========================================================================

  renderDirectory() {
    const container = document.getElementById('team-directory-grid');
    container.innerHTML = '';

    this.members.forEach(member => {
      const avatarHTML = this.renderAvatarMarkup(member, 'member-avatar-lg');
      const skillsHTML = member.skills.split(',').map(s => `<span class="skill-tag">${s.trim()}</span>`).join('');

      const cardHTML = `
        <div class="glass-card member-card">
          ${avatarHTML}
          <h3 class="member-name" style="margin-top: 1rem;">${member.name}</h3>
          <span class="member-role">${member.role}</span>
          
          <div class="member-skills-section">
            <div class="skills-title">Kỹ năng chuyên môn</div>
            <div class="skills-list-wrap">${skillsHTML}</div>
          </div>
          
          <div class="member-actions">
            <button class="btn-secondary member-btn-edit" onclick="portal.openEditModal('${member.id}')">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 14px; height: 14px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
              </svg>
              Sửa hồ sơ & Ảnh
            </button>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', cardHTML);
    });
  }

  renderKanbanBoard() {
    const select = document.getElementById('kanban-comp-select');
    if (select.children.length === 0) {
      select.innerHTML = '';
      COMPETITIONS.forEach(comp => {
        select.insertAdjacentHTML('beforeend', `<option value="${comp.id}" ${this.activeKanbanComp === comp.id ? 'selected' : ''}>${comp.name}</option>`);
      });
    }

    const boardRoot = document.getElementById('kanban-board-root');
    boardRoot.innerHTML = '';

    const columnsConfig = [
      { id: 'todo', title: 'Cần làm', color: 'var(--accent-blue)' },
      { id: 'inprogress', title: 'Đang làm', color: 'var(--accent-amber)' },
      { id: 'review', title: 'Đánh giá (Review)', color: 'var(--accent-purple)' },
      { id: 'done', title: 'Hoàn thành', color: 'var(--accent-emerald)' }
    ];

    const tasks = this.kanbanTasks[this.activeKanbanComp] || [];

    columnsConfig.forEach(col => {
      const colTasks = tasks.filter(t => t.column === col.id);

      const colHTML = `
        <div class="kanban-column" data-column-id="${col.id}">
          <div class="kanban-column-header">
            <span class="kanban-column-title" style="color: ${col.color};">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${col.color}; margin-right:4px;"></span>
              ${col.title}
            </span>
            <span class="kanban-column-count">${colTasks.length}</span>
          </div>
          <div class="kanban-cards-list" data-column-id="${col.id}">
            ${colTasks.map(t => this.renderKanbanCardMarkup(t)).join('')}
          </div>
        </div>
      `;
      boardRoot.insertAdjacentHTML('beforeend', colHTML);
    });

    this.attachKanbanDragHandlers();
  }

  renderKanbanCardMarkup(task) {
    const assignee = this.getMemberById(task.assignee);
    const avatarBadge = assignee ? this.renderAvatarMarkup(assignee, 'kanban-card-assignee-bubble') : '<div class="kanban-card-assignee-bubble">?</div>';

    return `
      <div class="kanban-card" draggable="true" data-task-id="${task.id}">
        <h4 class="kanban-card-title">${task.title}</h4>
        <p class="kanban-card-desc">${task.desc || 'Không có mô tả chi tiết.'}</p>
        
        <div class="kanban-card-footer">
          <div class="kanban-card-assignee" title="${assignee ? assignee.name : 'Chưa gán'}">
            ${avatarBadge}
            <span class="kanban-card-assignee-name">${assignee ? assignee.name : 'Unassigned'}</span>
          </div>
          <div class="kanban-card-actions">
            <button class="kanban-move-btn" onclick="portal.moveKanbanTask('${task.id}', 'prev')" title="Sang trái">◀</button>
            <button class="kanban-move-btn" onclick="portal.moveKanbanTask('${task.id}', 'next')" title="Sang phải">▶</button>
            
            <button class="kanban-action-btn delete" onclick="portal.deleteKanbanTask('${task.id}')" title="Xóa thẻ">
              <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 13px; height: 13px;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // PROFILE EDIT MODAL ACTIONS (modified for custom Base64 image upload)
  // ==========================================================================

  openEditModal(memberId) {
    if (!this.collaboration?.requireLogin()) return;
    const member = this.getMemberById(memberId);
    if (!member) return;

    this.modalTitle.innerText = `Chỉnh sửa thành viên: ${member.name}`;
    this.modalInputId.value = member.id;
    this.modalInputName.value = member.name;
    this.modalInputRole.value = member.role;
    this.modalInputSkills.value = member.skills;

    // Load custom avatar cache
    this.tempAvatar = member.avatar || '';
    const preview = document.getElementById('edit-avatar-preview');
    const emojiInput = document.getElementById('edit-member-emoji');
    document.getElementById('avatar-file-input').value = ''; // Reset file input selector

    // Initialize inputs and preview markup
    emojiInput.value = (member.avatar && !member.avatar.startsWith('data:')) ? member.avatar : '';
    if (member.avatar) {
      if (member.avatar.startsWith('data:')) {
        preview.innerHTML = `<img src="${member.avatar}" class="member-avatar-img" alt="Avatar">`;
      } else {
        preview.innerText = member.avatar;
      }
    } else {
      preview.innerText = member.name.split(' ').map(n => n[0]).join('');
    }

    this.modal.classList.add('active');
  }

  closeModal() {
    this.modal.classList.remove('active');
  }

  async saveMemberProfile() {
    const id = this.modalInputId.value;
    const name = this.modalInputName.value.trim();
    const role = this.modalInputRole.value.trim();
    const skills = this.modalInputSkills.value.trim();

    if (!name || !role || !skills) {
      alert('Vui lòng điền đầy đủ các trường thông tin!');
      return;
    }

    const updatedMember = { ...this.getMemberById(id), name, role, skills, avatar: this.tempAvatar };
    this.members = this.members.map(m => {
      if (m.id === id) {
        return updatedMember;
      }
      return m;
    });

    try {
      await this.collaboration.saveMember(updatedMember);
      this.closeModal();
      this.render();
      this.collaboration.toast('Đã cập nhật thành viên.', 'success');
    } catch (error) {
      this.collaboration.toast(error.message || 'Không thể cập nhật thành viên.', 'error');
      await this.collaboration.loadSnapshot();
    }
  }

  // ==========================================================================
  // KANBAN ACTIONS & UTILS
  // ==========================================================================

  async updateKanbanTaskColumn(taskId, targetColId) {
    if (!this.collaboration?.requireLogin()) return;
    const compTasks = this.kanbanTasks[this.activeKanbanComp] || [];
    const task = compTasks.find(t => t.id === taskId);
    if (task) {
      task.column = targetColId;
      this.render();
      try { await this.collaboration.updateTask(taskId, { column: targetColId }); }
      catch (error) { this.collaboration.toast(error.message, 'error'); await this.collaboration.loadSnapshot(); }
    }
  }

  async moveKanbanTask(taskId, direction) {
    if (!this.collaboration?.requireLogin()) return;
    const compTasks = this.kanbanTasks[this.activeKanbanComp] || [];
    const task = compTasks.find(t => t.id === taskId);
    if (!task) return;

    const cols = ['todo', 'inprogress', 'review', 'done'];
    const currIdx = cols.indexOf(task.column);
    let nextIdx = direction === 'next' ? currIdx + 1 : currIdx - 1;

    if (nextIdx >= 0 && nextIdx < cols.length) {
      task.column = cols[nextIdx];
      this.render();
      try { await this.collaboration.updateTask(taskId, { column: task.column }); }
      catch (error) { this.collaboration.toast(error.message, 'error'); await this.collaboration.loadSnapshot(); }
    }
  }

  async deleteKanbanTask(taskId) {
    if (!this.collaboration?.requireLogin()) return;
    if (!confirm('Bạn có chắc chắn muốn xóa thẻ nhiệm vụ này?')) return;

    const compTasks = this.kanbanTasks[this.activeKanbanComp] || [];
    this.kanbanTasks[this.activeKanbanComp] = compTasks.filter(t => t.id !== taskId);
    this.render();
    try { await this.collaboration.deleteTask(taskId); }
    catch (error) { this.collaboration.toast(error.message, 'error'); await this.collaboration.loadSnapshot(); }
  }

  openTaskModal() {
    if (!this.collaboration?.requireLogin()) return;
    this.taskInputTitle.value = '';
    this.taskInputDesc.value = '';
    this.taskInputAssignee.innerHTML = '';
    this.members.forEach(m => {
      this.taskInputAssignee.insertAdjacentHTML('beforeend', `<option value="${m.id}">${m.name} (${m.role})</option>`);
    });
    this.taskInputColumn.value = 'todo';
    this.taskModal.classList.add('active');
  }

  closeTaskModal() {
    this.taskModal.classList.remove('active');
  }

  async saveNewKanbanTask() {
    if (!this.collaboration?.requireLogin()) return;
    const title = this.taskInputTitle.value.trim();
    const desc = this.taskInputDesc.value.trim();
    const assignee = this.taskInputAssignee.value;
    const column = this.taskInputColumn.value;

    if (!title) {
      alert('Vui lòng điền tiêu đề nhiệm vụ!');
      return;
    }

    const newTask = {
      id: `task-${Date.now()}`,
      title,
      desc,
      assignee,
      column
    };

    if (!this.kanbanTasks[this.activeKanbanComp]) {
      this.kanbanTasks[this.activeKanbanComp] = [];
    }
    this.kanbanTasks[this.activeKanbanComp].push(newTask);
    try {
      await this.collaboration.createTask(this.activeKanbanComp, newTask);
      this.closeTaskModal();
      this.render();
      this.collaboration.toast('Đã tạo nhiệm vụ.', 'success');
    } catch (error) {
      this.collaboration.toast(error.message || 'Không thể tạo nhiệm vụ.', 'error');
      await this.collaboration.loadSnapshot();
    }
  }

  attachDragAndDropHandlers() {
    const draggables = document.querySelectorAll('.draggable-member');
    const dropzones = document.querySelectorAll('.subteam-box');

    draggables.forEach(draggable => {
      draggable.addEventListener('dragstart', (e) => {
        this.activeDragElement = draggable;
        draggable.style.opacity = '0.5';
        e.dataTransfer.setData('text/plain', draggable.getAttribute('data-member-id'));
      });

      draggable.addEventListener('dragend', () => {
        draggable.style.opacity = '1';
        this.activeDragElement = null;
      });
    });

    dropzones.forEach(zone => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const memberId = e.dataTransfer.getData('text/plain');
        const compId = zone.getAttribute('data-comp-id');
        const teamType = zone.getAttribute('data-team-type');

        this.addMemberToAllocation(compId, teamType, memberId);
      });
    });
  }

  attachKanbanDragHandlers() {
    const cards = document.querySelectorAll('.kanban-card');
    const lists = document.querySelectorAll('.kanban-cards-list');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.getAttribute('data-task-id'));
        card.style.opacity = '0.5';
      });

      card.addEventListener('dragend', () => {
        card.style.opacity = '1';
      });
    });

    lists.forEach(list => {
      list.addEventListener('dragover', (e) => {
        e.preventDefault();
        list.parentElement.classList.add('drag-over');
      });

      list.addEventListener('dragleave', () => {
        list.parentElement.classList.remove('drag-over');
      });

      list.addEventListener('drop', (e) => {
        e.preventDefault();
        list.parentElement.classList.remove('drag-over');
        const taskId = e.dataTransfer.getData('text/plain');
        const targetColId = list.getAttribute('data-column-id');
        this.updateKanbanTaskColumn(taskId, targetColId);
      });
    });
  }

  // ==========================================================================
  // SETTINGS & SUPABASE DB SYNC IMPLEMENTATIONS
  // ==========================================================================

  renderSettings() {
    this.collaboration?.renderAccount();
  }

  isXoArenaVisible() {
    const config = window.PINGPING_CONFIG || {};
    const memberId = this.collaboration?.session?.member?.id;
    return Boolean(config.xoArenaEnabled || (memberId && (config.xoArenaTesterIds || []).includes(memberId)));
  }

  applyFeatureFlags() {
    const visible = this.isXoArenaVisible();
    document.querySelectorAll('[data-tab="xo"]').forEach(el => { el.hidden = !visible; });
    const panel = document.getElementById('tab-xo');
    if (panel) panel.hidden = !visible;
    if (this.aboutUpdateButton) this.aboutUpdateButton.hidden = !visible;
    if (!visible && this.currentTab === 'xo') this.switchTab('dashboard', true);
  }

  openAboutUpdate() {
    if (!this.isXoArenaVisible()) return;
    this.aboutUpdateModal.hidden = false;
    this.aboutUpdateModal.classList.add('active');
    document.getElementById('about-update-close')?.focus();
  }

  closeAboutUpdate() {
    this.aboutUpdateModal?.classList.remove('active');
    if (this.aboutUpdateModal) this.aboutUpdateModal.hidden = true;
    this.aboutUpdateButton?.focus();
  }

  renderXoArena() {
    if (!this.isXoArenaVisible()) return;
    this.renderXoBoard();
    this.renderXoPanels();
  }

  xoCredentials(extra = {}) {
    return {
      p_member_id: this.collaboration.session.member.id,
      p_login_code: this.collaboration.session.code,
      ...extra
    };
  }

  async loadXoCasino() {
    if (!this.isXoArenaVisible() || !this.collaboration?.session?.member) {
      this.renderXoArena();
      return;
    }
    try {
      const [grantResult, matchesResult, ratingsResult, walletsResult, checkinResult] = await Promise.all([
        this.collaboration.client.rpc('xo_grant_monthly_citizen_points', this.xoCredentials()),
        this.collaboration.client.from('xo_matches').select('*').order('created_at', { ascending: false }).limit(30),
        this.collaboration.client.from('xo_ratings').select('*').order('rating', { ascending: false }),
        this.collaboration.client.from('citizen_wallets').select('member_id, balance').order('balance', { ascending: false }),
        this.collaboration.client.rpc('xo_daily_checkin', { ...this.xoCredentials(), p_claim: false })
      ]);
      const error = grantResult.error || matchesResult.error || ratingsResult.error || walletsResult.error || checkinResult.error;
      if (error) throw error;
      const memberId = this.collaboration.session.member.id;
      const currentBalance = grantResult.data?.[0]?.balance
        ?? walletsResult.data?.find(row => row.member_id === memberId)?.balance
        ?? 0;
      this.xoMatches = matchesResult.data || [];
      this.xoRatings = ratingsResult.data || [];
      this.xoWallets = (walletsResult.data || []).map(row => row.member_id === memberId ? { ...row, balance: currentBalance } : row);
      this.xoCheckin = checkinResult.data?.[0] || null;
      this.xoWalletBalance = currentBalance;

      const selected = this.xoMatches.find(match => match.id === this.xoSelectedMatchId);
      const preferred = selected || this.xoMatches.find(match =>
        match.status === 'active' && [match.challenger_id, match.opponent_id].includes(memberId)
      ) || this.xoMatches.find(match => match.status === 'active') || this.xoMatches[0];
      this.xoSelectedMatchId = preferred?.id || null;
      this.xoBets = [];
      this.renderXoPanels();

      if (preferred) {
        const [gameResult, betsResult] = await Promise.all([
          this.collaboration.client.from('xo_games').select('*').eq('match_id', preferred.id).order('game_number', { ascending: false }).limit(1).maybeSingle(),
          this.collaboration.client.from('xo_bets').select('*').eq('match_id', preferred.id)
        ]);
        if (gameResult.error || betsResult.error) throw gameResult.error || betsResult.error;
        this.xoActiveGame = gameResult.data;
        this.xoBets = betsResult.data || [];
        this.xoState = this.xoActiveGame
          ? { bounds: this.xoActiveGame.bounds, moves: this.xoActiveGame.moves || [] }
          : createEmptyBoard();
      } else {
        this.xoActiveGame = null;
        this.xoBets = [];
        this.xoState = createEmptyBoard();
      }
      this.notifyXoThreat();
      this.subscribeXoCasino();
      this.renderXoArena();
    } catch (error) {
      this.collaboration.toast(error.message || 'Không thể tải Sòng X-O.', 'error');
    }
  }

  notifyXoThreat() {
    const memberId = this.collaboration?.session?.member?.id;
    const lastMove = this.xoState.moves.at(-1);
    if (!this.xoActiveGame || !lastMove || this.xoActiveGame.status !== 'active' || this.xoActiveGame.next_member_id !== memberId || lastMove.member_id === memberId) return;
    const noticeKey = `${this.xoActiveGame.id}:${this.xoState.moves.length}`;
    if (noticeKey === this.xoThreatNoticeKey) return;
    const threat = getFourThreat(this.xoState, lastMove?.mark);
    if (!threat.level) return;
    this.xoThreatNoticeKey = noticeKey;
    const flash = document.getElementById('xo-threat-flash');
    if (!flash) return;
    clearTimeout(this.xoThreatTimer);
    flash.hidden = false;
    flash.textContent = threat.level === 'unblockable' ? '💀 Mày chết rồi' : '⚠️ Mày sắp chết rồi';
    flash.className = `xo-threat-flash ${threat.level}`;
    void flash.offsetWidth;
    flash.classList.add('active');
    this.xoThreatTimer = setTimeout(() => {
      flash.classList.remove('active');
      flash.hidden = true;
    }, 3600);
  }

  subscribeXoCasino() {
    if (this.xoChannel) return;
    const reload = () => {
      clearTimeout(this.xoReloadTimer);
      this.xoReloadTimer = setTimeout(() => this.loadXoCasino(), 120);
    };
    this.xoChannel = this.collaboration.client.channel('xo-casino-live');
    for (const table of ['xo_matches', 'xo_games', 'xo_ratings', 'citizen_wallets', 'xo_bets']) {
      this.xoChannel.on('postgres_changes', { event: '*', schema: 'public', table }, reload);
    }
    this.xoChannel.subscribe();
  }

  async createXoChallenge() {
    if (!this.collaboration?.requireLogin()) return;
    const opponentId = document.getElementById('xo-opponent')?.value;
    const wager = Number(document.getElementById('xo-wager')?.value);
    try {
      const { data, error } = await this.collaboration.client.rpc('xo_create_challenge', this.xoCredentials({
        p_opponent_id: opponentId,
        p_wager: wager
      }));
      if (error) throw error;
      this.xoSelectedMatchId = data;
      this.collaboration.toast('Kèo đã mở. Chờ đối thủ nhận lời!', 'success');
      await this.loadXoCasino();
    } catch (error) {
      this.collaboration.toast(this.xoErrorMessage(error), 'error');
    }
  }

  async respondXoChallenge(matchId, accept) {
    if (!this.collaboration?.requireLogin()) return;
    try {
      const { error } = await this.collaboration.client.rpc('xo_respond_challenge', this.xoCredentials({
        p_match_id: matchId,
        p_accept: accept
      }));
      if (error) throw error;
      this.xoSelectedMatchId = matchId;
      this.collaboration.toast(accept ? 'Đã nhận kèo. Vào bàn!' : 'Đã từ chối kèo.', 'success');
      await this.loadXoCasino();
    } catch (error) {
      this.collaboration.toast(this.xoErrorMessage(error), 'error');
    }
  }

  async placeXoBet() {
    if (!this.collaboration?.requireLogin() || !this.xoSelectedMatchId) return;
    try {
      const { error } = await this.collaboration.client.rpc('xo_place_bet', this.xoCredentials({
        p_match_id: this.xoSelectedMatchId,
        p_pick_member_id: document.getElementById('xo-bet-pick')?.value,
        p_stake: Number(document.getElementById('xo-bet-stake')?.value)
      }));
      if (error) throw error;
      this.collaboration.toast('Đã xuống điểm!', 'success');
      await this.loadXoCasino();
    } catch (error) {
      this.collaboration.toast(this.xoErrorMessage(error), 'error');
    }
  }

  async claimCitizenCheckin() {
    if (!this.collaboration?.requireLogin()) return;
    const button = document.getElementById('citizen-checkin-button');
    if (button) button.disabled = true;
    try {
      const { data, error } = await this.collaboration.client.rpc('xo_daily_checkin', {
        ...this.xoCredentials(),
        p_claim: true
      });
      if (error) throw error;
      const result = data?.[0];
      if (Number(result?.points) === -360) this.openCheckinPenalty();
      else this.collaboration.toast(`Điểm danh thành công: +${result.points} điểm!`, 'success');
      await this.loadXoCasino();
    } catch (error) {
      this.collaboration.toast(error.message || 'Không thể điểm danh.', 'error');
      if (button) button.disabled = false;
    }
  }

  openCheckinPenalty() {
    const modal = document.getElementById('checkin-penalty-modal');
    if (!modal) return;
    modal.hidden = false;
    modal.classList.add('active');
    document.getElementById('checkin-penalty-close')?.focus();
  }

  closeCheckinPenalty() {
    const modal = document.getElementById('checkin-penalty-modal');
    modal?.classList.remove('active');
    if (modal) modal.hidden = true;
    document.getElementById('citizen-checkin-button')?.focus();
  }

  selectXoMatch(matchId) {
    this.xoSelectedMatchId = matchId;
    this.loadXoCasino();
  }

  xoErrorMessage(error) {
    const code = String(error?.message || '');
    const messages = {
      CHALLENGE_YOURSELF: 'Không thể tự thách đấu chính mình.',
      INVALID_OPPONENT: 'Đối thủ không hợp lệ.',
      PLAYER_BUSY: 'Một trong hai người đang có kèo chưa xong.',
      INSUFFICIENT_BALANCE: 'Không đủ điểm công dân.',
      CHALLENGE_NOT_AVAILABLE: 'Kèo này không còn khả dụng.',
      NOT_YOUR_TURN: 'Chưa đến lượt của bạn.',
      BETTING_LOCKED: 'Cược đã khóa sau nước đi đầu tiên.',
      PLAYERS_CANNOT_POOL_BET: 'Hai người chơi đã có tiền kèo, không cược pool.',
      OCCUPIED_CELL: 'Ô này đã được đánh.'
    };
    return Object.entries(messages).find(([key]) => code.includes(key))?.[1] || code || 'Không thể thực hiện thao tác X-O.';
  }

  renderXoBoard() {
    const board = document.getElementById('xo-board');
    const status = document.getElementById('xo-board-status');
    const spectatorStatus = document.getElementById('xo-spectator-status');
    if (!board || !status) return;

    const size = boardSize(this.xoState.bounds);
    const selectedMatch = this.xoMatches.find(match => match.id === this.xoSelectedMatchId);
    const memberId = this.collaboration?.session?.member?.id;
    const isSpectator = selectedMatch && ![selectedMatch.challenger_id, selectedMatch.opponent_id].includes(memberId);
    const occupied = new Map(this.xoState.moves.map(move => [`${move.row},${move.col}`, move]));
    const lastMove = this.xoState.moves.at(-1);
    board.style.setProperty('--xo-size', String(size.cols));
    board.innerHTML = '';

    for (let row = this.xoState.bounds.minRow; row <= this.xoState.bounds.maxRow; row += 1) {
      for (let col = this.xoState.bounds.minCol; col <= this.xoState.bounds.maxCol; col += 1) {
        const move = occupied.get(`${row},${col}`);
        const cell = document.createElement('button');
        cell.type = 'button';
        const isLastMove = move && move.row === lastMove?.row && move.col === lastMove?.col;
        cell.className = `xo-cell${move ? ` ${move.mark}` : ''}${isLastMove ? ' last' : ''}`;
        cell.textContent = move?.mark?.toUpperCase() || '';
        cell.setAttribute('aria-label', `Ô ${row}, ${col}${isLastMove ? ', nước đi mới nhất' : ''}`);
        cell.disabled = Boolean(move || !this.xoActiveGame || selectedMatch?.status !== 'active' || this.xoActiveGame.next_member_id !== memberId);
        cell.addEventListener('click', () => this.playXoMove(row, col));
        board.appendChild(cell);
      }
    }

    if (spectatorStatus) {
      spectatorStatus.hidden = !isSpectator;
      if (isSpectator) {
        if (selectedMatch.status === 'active') {
          spectatorStatus.textContent = selectedMatch.locked_at
            ? 'Bạn đang xem trực tiếp với tư cách khán giả · cược đã khóa.'
            : 'Bạn đang xem trực tiếp với tư cách khán giả · cược mở đến nước đi đầu tiên.';
        } else if (selectedMatch.status === 'completed') {
          spectatorStatus.textContent = 'Bạn đang xem lại trận với tư cách khán giả.';
        } else {
          spectatorStatus.textContent = 'Bạn đang theo dõi kèo đang chờ đối thủ nhận lời.';
        }
      }
    }

    if (!selectedMatch) status.textContent = 'Chọn một kèo để xem bàn';
    else if (selectedMatch.status === 'pending') status.textContent = 'Đang chờ đối thủ nhận kèo';
    else if (selectedMatch.status === 'completed') status.textContent = `${this.getMemberName(selectedMatch.winner_id)} thắng kèo`;
    else status.textContent = `${isSpectator ? 'Đang xem · ' : ''}BO1 · lượt ${this.getMemberName(this.xoActiveGame?.next_member_id)}`;
  }

  async playXoMove(row, col) {
    if (!this.xoActiveGame || !this.collaboration?.requireLogin()) return;
    try {
      const { error } = await this.collaboration.client.rpc('xo_make_move', this.xoCredentials({
        p_game_id: this.xoActiveGame.id,
        p_row: row,
        p_col: col
      }));
      if (error) throw error;
      await this.loadXoCasino();
    } catch (error) {
      this.collaboration.toast(this.xoErrorMessage(error), 'error');
    }
  }

  renderXoPanels() {
    const openMatches = document.getElementById('xo-open-matches');
    const recentMatches = document.getElementById('xo-recent-matches');
    const leaderboard = document.getElementById('xo-leaderboard');
    const citizenLeaderboard = document.getElementById('citizen-points-leaderboard');
    const wallet = document.getElementById('xo-wallet');
    const checkinButton = document.getElementById('citizen-checkin-button');
    const checkinStatus = document.getElementById('citizen-checkin-status');
    const bets = document.getElementById('xo-bets');
    const selectedMatch = this.xoMatches.find(match => match.id === this.xoSelectedMatchId);
    const memberId = this.collaboration?.session?.member?.id;
    const title = document.getElementById('xo-match-title');
    const opponent = document.getElementById('xo-opponent');
    if (opponent) {
      const current = opponent.value;
      opponent.innerHTML = this.members.filter(member => member.id !== memberId)
        .map(member => `<option value="${member.id}">${escapeHtml(member.name)}</option>`).join('');
      if ([...opponent.options].some(option => option.value === current)) opponent.value = current;
    }
    if (title) title.textContent = selectedMatch
      ? `${this.getMemberName(selectedMatch.challenger_id)} ⚔ ${this.getMemberName(selectedMatch.opponent_id)} · ${selectedMatch.wager} điểm`
      : 'Chưa chọn kèo';

    const matchMarkup = match => {
      const incoming = match.status === 'pending' && match.opponent_id === memberId;
      const outgoing = match.status === 'pending' && match.challenger_id === memberId;
      const participant = [match.challenger_id, match.opponent_id].includes(memberId);
      const viewLabel = match.status === 'active' && !match.locked_at && !participant ? 'Xem & cược' : 'Xem';
      return `<div class="xo-row"><span class="xo-row-main"><strong>${escapeHtml(this.getMemberName(match.challenger_id))} ⚔ ${escapeHtml(this.getMemberName(match.opponent_id))}</strong><small>${match.wager} điểm · ${match.status === 'pending' ? 'chờ nhận kèo' : 'BO1 · LIVE'}</small></span><span class="xo-row-actions">${incoming ? `<button class="btn-primary" data-xo-action="accept" data-match-id="${match.id}">Nhận</button><button class="btn-secondary" data-xo-action="reject" data-match-id="${match.id}">Từ chối</button>` : ''}${outgoing ? `<button class="btn-secondary" data-xo-action="cancel" data-match-id="${match.id}">Hủy</button>` : ''}<button class="btn-secondary" data-xo-action="view" data-match-id="${match.id}">${viewLabel}</button></span></div>`;
    };
    if (openMatches) {
      const rows = this.xoMatches.filter(match => ['pending', 'active'].includes(match.status));
      openMatches.innerHTML = rows.length ? rows.map(matchMarkup).join('') : '<span>Chưa có kèo nào. Mở bát đi!</span>';
    }
    if (recentMatches) {
      const rows = this.xoMatches.filter(match => match.status === 'completed').slice(0, 8);
      recentMatches.innerHTML = rows.length ? rows.map(match => `<button class="xo-row" data-match-id="${match.id}"><span>${escapeHtml(this.getMemberName(match.challenger_id))} ${match.challenger_wins}-${match.opponent_wins} ${escapeHtml(this.getMemberName(match.opponent_id))}</span><span><strong>${escapeHtml(this.getMemberName(match.winner_id))}</strong><small>Xem lại</small></span></button>`).join('') : '<span>Chưa có kết quả.</span>';
    }
    if (leaderboard) {
      const ratings = this.members.map(member => ({ member, ...(this.xoRatings.find(row => row.member_id === member.id) || {}) }))
        .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
      leaderboard.innerHTML = ratings.map((row, index) => `<div class="xo-row"><span>${index + 1}. ${escapeHtml(row.member.name)}</span><strong>${row.rating || 0}</strong></div>`).join('');
    }
    if (citizenLeaderboard) {
      const wallets = this.members.map(member => ({ member, balance: this.xoWallets.find(row => row.member_id === member.id)?.balance || 0 }))
        .sort((a, b) => b.balance - a.balance);
      citizenLeaderboard.innerHTML = wallets.map((row, index) => `<div class="xo-row"><span>${index + 1}. ${escapeHtml(row.member.name)}</span><strong>${row.balance} điểm</strong></div>`).join('');
    }
    if (wallet) {
      wallet.textContent = memberId ? `${this.xoWalletBalance ?? 0} điểm` : 'Đăng nhập để nhận điểm';
    }
    if (checkinButton && checkinStatus) {
      const claimed = Boolean(this.xoCheckin?.claimed);
      checkinButton.disabled = !memberId || !this.xoCheckin || this.xoCheckin.claimed;
      checkinButton.textContent = claimed ? 'Đã điểm danh' : `Điểm danh +${this.xoCheckin?.points || 18}`;
      checkinStatus.classList.toggle('bait', claimed);
      checkinStatus.textContent = claimed
        ? '🙏 Xin đừng dùng F12 🛠️ để bật lại nút này. 🏠 Đây là trang nội bộ nên không quá để tâm đến vấn đề security 🔐. 🤝 MỌI NGƯỜI TIN TƯỞNG VÀO NHÂN PHẨM CỦA BẠN 👀'
        : `Hôm nay nhận ${this.xoCheckin?.points || 18} điểm · cuối tuần nhận 36 điểm.`;
    }
    if (bets) {
      const pool = id => this.xoBets.filter(bet => bet.pick_member_id === id).reduce((sum, bet) => sum + Number(bet.stake), 0);
      const ownBet = this.xoBets.find(bet => bet.member_id === memberId);
      const betNote = ownBet
        ? `<p class="xo-bet-note">Vé của bạn: <strong>${ownBet.stake} điểm</strong> cho ${escapeHtml(this.getMemberName(ownBet.pick_member_id))}</p>`
        : selectedMatch?.status === 'active' && selectedMatch.locked_at
          ? '<p class="xo-bet-note">Cược đã khóa sau nước đi đầu tiên.</p>'
          : '';
      bets.innerHTML = selectedMatch ? `<div class="xo-row"><span>${escapeHtml(this.getMemberName(selectedMatch.challenger_id))}</span><strong>${pool(selectedMatch.challenger_id)} điểm</strong></div><div class="xo-row"><span>${escapeHtml(this.getMemberName(selectedMatch.opponent_id))}</span><strong>${pool(selectedMatch.opponent_id)} điểm</strong></div>${betNote}` : 'Chọn một kèo để xem pool.';
    }
    const betForm = document.getElementById('xo-bet-form');
    const alreadyBet = this.xoBets.some(bet => bet.member_id === memberId);
    const canBet = selectedMatch?.status === 'active' && !selectedMatch.locked_at && !alreadyBet && ![selectedMatch.challenger_id, selectedMatch.opponent_id].includes(memberId);
    if (betForm) betForm.hidden = !canBet;
    const betPick = document.getElementById('xo-bet-pick');
    if (betPick && selectedMatch) {
      betPick.innerHTML = [selectedMatch.challenger_id, selectedMatch.opponent_id]
        .map(id => `<option value="${id}">${escapeHtml(this.getMemberName(id))}</option>`).join('');
    }
  }

  // ==========================================================================
  // DATA HELPER ACCESSORS
  // ==========================================================================

  getMemberById(id) {
    return this.members.find(m => m.id === id);
  }

  getMemberName(id) {
    const m = this.getMemberById(id);
    return m ? m.name : '';
  }
}

// Instantiate Portal globally
const portal = new TeamPortal();
window.portal = portal;
