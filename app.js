// MinuteGenAI - Core Application Controller
// Manages Cobalt routing, command palettes, input cleanups, local history database, and renderer actions.

window.App = {
  state: {
    history: [],
    currentMOM: null,
    uploadedFileName: null,
    uploadedFileText: null,
    
    // Command Palette state
    palette: {
      isOpen: false,
      results: [],
      selectedIndex: 0
    }
  },

  init() {
    this.setupEventListeners();
    this.loadHistory();
    this.updateDashboardStats();
    this.renderHistoryList();
    this.updateApiStatusIndicator();
  },

  setupEventListeners() {
    // Navigation link routers
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        this.switchView(view);
      });
    });

    // File Drag and Drop handlers
    const dropzone = document.getElementById('transcript-dropzone');
    const fileInput = document.getElementById('transcript-file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
          this.handleFileUpload(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    // Command palette key listeners (Signature Move 5)
    window.addEventListener('keydown', (e) => {
      // Toggle palette on Ctrl+K / Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (this.state.palette.isOpen) {
          this.closeCommandPalette();
        } else {
          this.openCommandPalette();
        }
      }

      // Traversal when open
      if (this.state.palette.isOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closeCommandPalette();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.navigatePaletteResults(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.navigatePaletteResults(-1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.selectPaletteItem();
        }
      }
    });

    // Default meeting picker date
    const dateInput = document.getElementById('meeting-date');
    if (dateInput) {
      dateInput.valueAsDate = new Date();
    }
  },

  switchView(viewId) {
    // Hide active views
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`view-${viewId}`);
    if (activePanel) {
      activePanel.classList.add('active');
    }

    // Manage nav active classes
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('data-view') === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // API Credentials status row
  async updateApiStatusIndicator() {
    const indicator = document.getElementById('api-status-indicator');
    if (!indicator) return;

    const apiBaseUrl = window.CONFIG?.API_BASE_URL ?? "http://localhost:8000";
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/health`);
      if (response.ok) {
        const data = await response.json();
        if (data.api_key_configured) {
          indicator.innerHTML = `
            <div class="status-indicator set"></div>
            <span>FastAPI Backend Active</span>
          `;
        } else {
          indicator.innerHTML = `
            <div class="status-indicator demo"></div>
            <span>Demo Mode (Configure API key in backend .env)</span>
          `;
        }
      } else {
        indicator.innerHTML = `
          <div class="status-indicator demo"></div>
          <span>Backend Error (HTTP ${response.status})</span>
        `;
      }
    } catch (e) {
      indicator.innerHTML = `
        <div class="status-indicator demo"></div>
        <span>Backend Offline (Run uvicorn server)</span>
      `;
    }
  },

  // File loading cleanups
  handleFileUpload(file) {
    const reader = new FileReader();
    this.state.uploadedFileName = file.name;

    reader.onload = (e) => {
      const text = e.target.result;
      const cleaned = this.cleanTranscript(text);
      this.state.uploadedFileText = cleaned;

      const textarea = document.getElementById('transcript-textarea');
      if (textarea) textarea.value = cleaned;

      const container = document.getElementById('selected-file-container');
      if (container) {
        container.innerHTML = `
          <div class="file-pill">
            <span>${file.name}</span>
            <span class="file-pill-close" onclick="window.App.clearUploadedFile(event)">&times;</span>
          </div>
        `;
        container.style.display = 'inline-flex';
      }
      this.showToast(`Loaded file: ${file.name}`, "success");
    };

    reader.readAsText(file);
  },

  clearUploadedFile(e) {
    if (e) e.stopPropagation();
    this.state.uploadedFileName = null;
    this.state.uploadedFileText = null;
    
    const fileInput = document.getElementById('transcript-file-input');
    const textarea = document.getElementById('transcript-textarea');
    const container = document.getElementById('selected-file-container');
    
    if (fileInput) fileInput.value = '';
    if (textarea) textarea.value = '';
    if (container) container.style.display = 'none';
  },

  cleanTranscript(text) {
    const lines = text.split(/\r?\n/);
    const cleaned = [];

    for (let line of lines) {
      line = line.trim();
      if (line.toUpperCase() === 'WEBVTT') continue;
      if (line === '') continue;
      if (/^\d+$/.test(line)) continue;
      if (line.includes('-->')) continue;
      if (line.startsWith('NOTE') || line.startsWith('STYLE')) continue;
      cleaned.push(line);
    }

    return cleaned.join('\n');
  },

  // Storage Operations
  loadHistory() {
    try {
      const stored = localStorage.getItem('minutegenai_history_v2');
      this.state.history = stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error(e);
      this.state.history = [];
    }
  },

  saveHistoryToStorage() {
    localStorage.setItem('minutegenai_history_v2', JSON.stringify(this.state.history));
    this.updateDashboardStats();
    this.renderHistoryList();
  },

  saveMOMToHistory(momData) {
    const record = {
      id: "mom-" + Date.now(),
      createdTime: new Date().toLocaleString(),
      ...momData
    };
    this.state.history.unshift(record);
    this.saveHistoryToStorage();
    return record;
  },

  deleteMOMRecord(id, e) {
    if (e) e.stopPropagation();
    if (!confirm("Delete this meeting summary from history?")) return;

    this.state.history = this.state.history.filter(item => item.id !== id);
    this.saveHistoryToStorage();
    this.showToast("Summary removed", "success");

    if (this.state.currentMOM && this.state.currentMOM.id === id) {
      this.state.currentMOM = null;
      this.switchView('dashboard');
    }
  },

  clearAllHistory() {
    if (!confirm("Erase all stored meeting archives? This cannot be undone.")) return;
    this.state.history = [];
    this.saveHistoryToStorage();
    this.showToast("All historical archives deleted", "success");
    this.switchView('dashboard');
  },

  // Calculate overview metrics
  updateDashboardStats() {
    const nonDemoHistory = this.state.history.filter(item => !item.isDemo);
    const totalMeetings = nonDemoHistory.length;
    document.getElementById('stat-total-meetings').innerText = totalMeetings;

    let totalMins = 0;
    let completed = 0;
    let pending = 0;

    nonDemoHistory.forEach(item => {
      const numMatch = item.duration ? item.duration.match(/\d+/) : null;
      totalMins += numMatch ? parseInt(numMatch[0]) : 40;

      if (item.actionItems) {
        item.actionItems.forEach(t => {
          if (t.status === 'completed') completed++;
          else pending++;
        });
      }
    });

    const hoursSaved = Math.max(1, Math.round((totalMins * 1.5) / 60));
    document.getElementById('stat-total-time').innerText = totalMeetings > 0 ? `${hoursSaved}h` : '0h';
    document.getElementById('stat-completed-actions').innerText = completed;
    document.getElementById('stat-pending-actions').innerText = pending;
  },

  // Demo Loaders
  loadDemoPreset(presetId) {
    const sample = window.MEETING_SAMPLES.find(s => s.id === presetId);
    if (!sample) return;

    this.showLoader("Retrieving demo matrix...");
    setTimeout(() => {
      this.hideLoader();
      const cloned = JSON.parse(JSON.stringify(sample.mom));
      cloned.isDemo = true; // Mark as demo to exclude from dashboard metrics
      const record = this.saveMOMToHistory(cloned);
      this.viewMOM(record.id);
      this.showToast(`Loaded preset demo`, "success");
    }, 600);
  },

  // Call FastAPI backend or fallback to Demo simulations
  async handleGenerationSubmit(event) {
    event.preventDefault();
    const apiBaseUrl = window.CONFIG?.API_BASE_URL ?? "http://localhost:8000";

    const transcript = document.getElementById('transcript-textarea').value.trim();
    const model = document.getElementById('ai-model-select').value;
    const style = document.getElementById('mom-style-select').value;

    if (!transcript) {
      this.showToast("Please enter transcript text.", "error");
      return;
    }

    // Title / Platform Meta
    const metaTitle = document.getElementById('meeting-title-input').value.trim();
    const metaPlatform = document.getElementById('meeting-platform').value;
    const metaDateVal = document.getElementById('meeting-date').value;
    
    let formattedDate = "";
    if (metaDateVal) {
      formattedDate = new Date(metaDateVal).toLocaleDateString("en-US", {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    }

    // Check backend health before sending request
    let isConfigured = false;
    let backendOffline = false;

    try {
      const healthRes = await fetch(`${apiBaseUrl}/api/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        isConfigured = healthData.api_key_configured;
      }
    } catch (e) {
      backendOffline = true;
    }

    if (backendOffline) {
      this.showToast("FastAPI Backend Offline. Please check server status.", "error");
      return;
    }

    if (!isConfigured) {
      this.showToast("API key tokens exhausted or too many requests. Check .env file.", "error");
      return;
    }

    this.showLoader("Running backend inference proxy...");
    try {
      const result = await window.GeminiMOMService.generateMOM({
        transcript,
        model,
        style,
        metadata: {
          title: metaTitle,
          platform: metaPlatform,
          date: formattedDate
        }
      });

      this.hideLoader();
      this.showToast("MOM Generated successfully", "success");
      const record = this.saveMOMToHistory(result);
      this.viewMOM(record.id);
    } catch (e) {
      this.hideLoader();
      const cleanMsg = e.message.replace(/^API Proxy Error:\s*/i, "");
      this.showToast(cleanMsg, "error");
    }
  },

  viewMOM(recordId) {
    const item = this.state.history.find(r => r.id === recordId);
    if (!item) return;

    this.state.currentMOM = item;
    this.renderMOMViewer(item);
    this.switchView('viewer');
  },

  renderMOMViewer(mom) {
    const container = document.getElementById('mom-viewer-content');
    if (!container) return;

    // Title / platform tags
    const titleHeader = document.getElementById('viewer-title-header');
    const platformTag = document.getElementById('viewer-platform-tag');
    if (titleHeader) titleHeader.innerText = mom.title;
    if (platformTag) platformTag.innerText = mom.platform.toUpperCase();

    // Attendee lists
    const attendeePills = mom.attendees.map(a => `<span class="mom-attendee-tag">${a}</span>`).join('');

    // Highlights list (Cobalt colors)
    const highlightsHTML = mom.highlights.map(h => `
      <div class="highlight-feed-item level-${h.level}">
        <div class="highlight-item-header">
          <span class="highlight-item-point">${h.keyPoint}</span>
          <span class="highlight-item-badge ${h.level}">${h.level}</span>
        </div>
        <p class="highlight-item-desc">${h.description}</p>
        <div class="highlight-item-speaker">Speaker: <strong>${h.speaker || 'Consensus'}</strong></div>
      </div>
    `).join('');

    // Tasks list
    let completedCount = 0;
    const taskListHTML = mom.actionItems.map((task, index) => {
      const isCompleted = task.status === 'completed';
      if (isCompleted) completedCount++;

      return `
        <li class="checklist-task-item ${isCompleted ? 'completed' : ''}">
          <input type="checkbox" class="checklist-task-checkbox" ${isCompleted ? 'checked' : ''}
            onclick="window.App.toggleTaskStatus('${mom.id}', ${index}, this)">
          <div class="checklist-task-content">
            <span class="checklist-task-text">${task.task}</span>
            <div class="checklist-task-meta">
              <span class="checklist-task-assignee">${task.assignee}</span>
              <span>Deadline: ${task.deadline}</span>
            </div>
          </div>
        </li>
      `;
    }).join('');

    const progressPercent = mom.actionItems.length > 0
      ? Math.round((completedCount / mom.actionItems.length) * 100)
      : 0;

    // Future agenda
    const agendaHTML = mom.futureActions.map(act => `
      <div class="agenda-timeline-item">
        <div class="agenda-item-title-row">
          <span class="agenda-item-name">${act.event}</span>
          <span class="agenda-item-date">${act.date}</span>
        </div>
        <p class="agenda-item-details">${act.details}</p>
      </div>
    `).join('');

    // Compile Markdown
    let htmlSummary = "";
    if (window.marked && typeof window.marked.parse === 'function') {
      htmlSummary = window.marked.parse(mom.summary);
    } else {
      htmlSummary = mom.summary.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    container.innerHTML = `
      <div class="mom-brief-header-box">
        <div class="mom-brief-meta-line">
          <span>Date: <strong>${mom.date}</strong></span>
          <span>•</span>
          <span>Duration: <strong>${mom.duration}</strong></span>
          <span>•</span>
          <span>Organizer: <strong>${mom.organizer}</strong></span>
        </div>

        <div class="mom-attendees-box-header">Attendees</div>
        <div class="mom-attendees-list-row">
          ${attendeePills}
        </div>
      </div>

      <div class="mom-report-grid">
        <!-- Left details column -->
        <div style="display: flex; flex-direction: column; gap: var(--space-lg);">
          <div class="report-section-box">
            <div class="box-title">Executive Summary</div>
            <div class="report-summary-text">
              ${htmlSummary}
            </div>
          </div>

          <div class="report-section-box">
            <div class="box-title">Discussion Highlights</div>
            <div class="report-highlights-feed">
              ${highlightsHTML || '<div style="font-size:12px; color:var(--color-ink-dim);">No key highlights extracted.</div>'}
            </div>
          </div>
        </div>

        <!-- Right action column -->
        <div style="display: flex; flex-direction: column; gap: var(--space-lg);">
          <div class="report-section-box">
            <div class="checklist-progress-bar-row">
              <span style="font-weight:600;">Action items checklist</span>
              <span id="task-completion-fraction" style="font-family:var(--font-mono); color:var(--color-accent); font-weight:600;">${completedCount}/${mom.actionItems.length} Done</span>
            </div>
            
            <div class="checklist-progress-bar-bg">
              <div class="checklist-progress-bar-fill" id="task-progress-bar-fill" style="width: ${progressPercent}%;"></div>
            </div>

            <ul class="checklist-tasks-list">
              ${taskListHTML || '<div style="font-size:12px; color:var(--color-ink-dim);">No active tasks designated.</div>'}
            </ul>
          </div>

          <div class="report-section-box">
            <div class="box-title">Future Agenda / Plans</div>
            <div class="agenda-vertical-timeline">
              ${agendaHTML || '<div style="font-size:12px; color:var(--color-ink-dim);">No next meetings designated.</div>'}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  toggleTaskStatus(momId, taskIndex, checkbox) {
    const item = this.state.history.find(r => r.id === momId);
    if (!item) return;

    item.actionItems[taskIndex].status = checkbox.checked ? 'completed' : 'pending';
    
    const taskLi = checkbox.closest('.checklist-task-item');
    if (checkbox.checked) {
      taskLi.classList.add('completed');
    } else {
      taskLi.classList.remove('completed');
    }

    this.saveHistoryToStorage();

    const total = item.actionItems.length;
    const done = item.actionItems.filter(t => t.status === 'completed').length;
    const percent = Math.round((done / total) * 100);

    document.getElementById('task-completion-fraction').innerText = `${done}/${total} Done`;
    document.getElementById('task-progress-bar-fill').style.width = `${percent}%`;
  },

  // Archive lists rendering
  renderHistoryList() {
    const grid = document.getElementById('history-grid-container');
    const query = document.getElementById('history-search-input').value.toLowerCase().trim();
    if (!grid) return;

    let filtered = this.state.history;
    if (query) {
      filtered = this.state.history.filter(item => {
        return item.title.toLowerCase().includes(query) ||
               item.organizer.toLowerCase().includes(query) ||
               item.summary.toLowerCase().includes(query) ||
               item.attendees.some(a => a.toLowerCase().includes(query));
      });
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-ink-dim); font-size:13px;">
          No historical entries found matching query.
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(item => {
      const summaryClean = item.summary.replace(/[*#`_\n]/g, ' ');
      const total = item.actionItems.length;
      const completed = item.actionItems.filter(t => t.status === 'completed').length;

      return `
        <div class="archive-grid-card" onclick="window.App.viewMOM('${item.id}')">
          <div class="archive-card-header">
            <h4 class="archive-card-title">${item.title}</h4>
            <button class="btn btn-danger" style="padding: 2px 6px; font-size: 10px;" onclick="window.App.deleteMOMRecord('${item.id}', event)">
              Delete
            </button>
          </div>
          <span class="archive-card-date">${item.date}</span>
          <p class="archive-card-body-excerpt">${summaryClean}</p>
          <div class="archive-card-footer">
            <div class="archive-card-meta-indicators">
              <span>Tasks: ${completed}/${total}</span>
              <span>Platform: ${item.platform}</span>
            </div>
            <span class="archive-card-link-txt">View brief &rarr;</span>
          </div>
        </div>
      `;
    }).join('');

    this.renderDashboardRecentTimeline();
  },

  renderDashboardRecentTimeline() {
    const container = document.getElementById('recent-meetings-list');
    if (!container) return;

    if (this.state.history.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--color-ink-dim); padding: var(--space-md); font-size: 13px;">No recent briefs found.</div>`;
      return;
    }

    const recent = this.state.history.slice(0, 3);
    container.innerHTML = recent.map(item => `
      <div class="record-item-row" onclick="window.App.viewMOM('${item.id}')">
        <div class="record-primary-info">
          <span class="record-platform-badge">${item.platform}</span>
          <span class="record-title-txt">${item.title}</span>
          <span class="record-date-txt">${item.date}</span>
        </div>
        <span class="record-arrow">Open &rarr;</span>
      </div>
    `).join('');
  },

  // Command Palette Overlay Controls (Signature Move 5)
  openCommandPalette() {
    const backdrop = document.getElementById('cmd-palette');
    const input = document.getElementById('cmd-palette-input');
    
    if (backdrop && input) {
      this.state.palette.isOpen = true;
      backdrop.classList.add('active');
      input.value = '';
      this.state.palette.selectedIndex = 0;
      this.handleCommandPaletteInput(); // populate defaults
      setTimeout(() => input.focus(), 50);
    }
  },

  closeCommandPalette(event) {
    const backdrop = document.getElementById('cmd-palette');
    if (backdrop) {
      this.state.palette.isOpen = false;
      backdrop.classList.remove('active');
    }
  },

  handleCommandPaletteInput() {
    const query = document.getElementById('cmd-palette-input').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('cmd-palette-results');
    if (!resultsContainer) return;

    let items = [];

    // Add general execution commands to search list
    items.push({
      type: 'command',
      title: 'Load Sprint Planning Preset',
      subtitle: 'Triggers sample workspace simulation',
      action: () => this.loadDemoPreset('sample-sprint-planning')
    });
    items.push({
      type: 'command',
      title: 'Load Marketing Campaign Preset',
      subtitle: 'Triggers sample workspace simulation',
      action: () => this.loadDemoPreset('sample-marketing-brainstorm')
    });
    items.push({
      type: 'command',
      title: 'Create New MOM Record',
      subtitle: 'Opens the transcript processing window',
      action: () => this.switchView('generate')
    });
    items.push({
      type: 'command',
      title: 'Erase All Stored History',
      subtitle: 'Deletes all records from device storage',
      action: () => this.clearAllHistory()
    });

    // Add historical entries matching search
    const matchedHistory = this.state.history.filter(item => {
      if (!query) return true;
      return item.title.toLowerCase().includes(query) ||
             item.summary.toLowerCase().includes(query) ||
             item.attendees.some(a => a.toLowerCase().includes(query));
    });

    matchedHistory.forEach(item => {
      items.push({
        type: 'meeting',
        title: item.title,
        subtitle: `Date: ${item.date} • Duration: ${item.duration}`,
        action: () => this.viewMOM(item.id)
      });
    });

    // Filter command matches if query is typed
    if (query) {
      items = items.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.subtitle.toLowerCase().includes(query)
      );
    }

    this.state.palette.results = items;
    this.state.palette.selectedIndex = Math.min(this.state.palette.selectedIndex, items.length - 1);
    this.state.palette.selectedIndex = Math.max(this.state.palette.selectedIndex, 0);

    this.renderPaletteResults();
  },

  navigatePaletteResults(direction) {
    const results = this.state.palette.results;
    if (results.length === 0) return;

    let idx = this.state.palette.selectedIndex + direction;
    if (idx < 0) idx = results.length - 1;
    if (idx >= results.length) idx = 0;

    this.state.palette.selectedIndex = idx;
    this.renderPaletteResults();

    // Scroll active item into view inside results container
    const activeItem = document.querySelector('.cmd-item-row.selected');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  },

  selectPaletteItem() {
    const results = this.state.palette.results;
    const selected = results[this.state.palette.selectedIndex];
    if (selected) {
      selected.action();
      this.closeCommandPalette();
    }
  },

  renderPaletteResults() {
    const container = document.getElementById('cmd-palette-results');
    if (!container) return;

    const results = this.state.palette.results;
    if (results.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding: 20px; color:var(--color-ink-dim); font-size:12px;">No actions or records match query.</div>`;
      return;
    }

    container.innerHTML = results.map((item, index) => {
      const isSelected = index === this.state.palette.selectedIndex;
      const icon = item.type === 'command'
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`;

      return `
        <div class="cmd-item-row ${isSelected ? 'selected' : ''}" onclick="window.App.executePaletteIndex(${index})">
          <div class="cmd-item-left">
            <div class="cmd-item-icon">${icon}</div>
            <div class="cmd-item-details">
              <span class="cmd-item-title">${item.title}</span>
              <span class="cmd-item-subtitle">${item.subtitle}</span>
            </div>
          </div>
          <span class="cmd-item-badge">${item.type}</span>
        </div>
      `;
    }).join('');
  },

  executePaletteIndex(index) {
    const item = this.state.palette.results[index];
    if (item) {
      item.action();
      this.closeCommandPalette();
    }
  },

  // Export functions
  copyToClipboard(format) {
    const mom = this.state.currentMOM;
    if (!mom) return;

    if (format === 'markdown') {
      const mdContent = this.compileMarkdown(mom);
      navigator.clipboard.writeText(mdContent)
        .then(() => this.showToast("Markdown copied", "success"));
    } else if (format === 'email') {
      const htmlContent = this.compileEmailHTML(mom);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      
      navigator.clipboard.write([clipboardItem])
        .then(() => this.showToast("HTML Email copied", "success"))
        .catch(() => {
          navigator.clipboard.writeText(htmlContent)
            .then(() => this.showToast("HTML text copied", "success"));
        });
    }
  },

  compileMarkdown(mom) {
    let md = `# Minutes of Meeting: ${mom.title}\n\n`;
    md += `* **Date**: ${mom.date}\n`;
    md += `* **Duration**: ${mom.duration}\n`;
    md += `* **Platform**: ${mom.platform}\n`;
    md += `* **Organizer**: ${mom.organizer}\n`;
    md += `* **Attendees**: ${mom.attendees.join(', ')}\n\n`;
    md += `## Executive Summary\n\n${mom.summary}\n\n`;
    
    md += `## Discussion Highlights\n\n`;
    mom.highlights.forEach(h => {
      md += `### ${h.keyPoint} [${h.level.toUpperCase()}]\n`;
      md += `* ${h.description}\n`;
      md += `* Speaker: ${h.speaker}\n\n`;
    });

    md += `## Action Items\n\n`;
    mom.actionItems.forEach(t => {
      const sym = t.status === 'completed' ? '[x]' : '[ ]';
      md += `* ${sym} **${t.task}** (Assignee: ${t.assignee}, Deadline: ${t.deadline})\n`;
    });

    md += `\n## Future Agenda\n\n`;
    mom.futureActions.forEach(a => {
      md += `* **${a.event}** (${a.date}): ${a.details}\n`;
    });

    return md;
  },

  compileEmailHTML(mom) {
    let html = `
      <div style="font-family: Arial, sans-serif; color: #333333; max-width: 600px; line-height: 1.6; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 6px;">
        <div style="background-color: #2563eb; color: #ffffff; padding: 20px; border-radius: 6px 6px 0 0; margin-bottom: 20px;">
          <span style="font-size: 10px; text-transform: uppercase; background-color: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; font-weight: bold;">${mom.platform}</span>
          <h2 style="margin: 8px 0 0 0; font-size: 20px; font-weight: bold;">${mom.title}</h2>
          <div style="margin-top: 10px; font-size: 12px; opacity: 0.9;">
            Date: ${mom.date} &nbsp;•&nbsp; Duration: ${mom.duration}
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #2563eb; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Attendees</h3>
          <p style="margin: 0; font-size: 13px; font-weight: bold; color: #4a5568;">${mom.attendees.join(', ')}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #2563eb; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Executive Summary</h3>
          <div style="font-size: 13px; color: #4a5568; background-color: #f8fafc; border-left: 3px solid #2563eb; padding: 12px; border-radius: 0 4px 4px 0;">
            ${mom.summary.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #2563eb; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Discussion Highlights</h3>
    `;

    mom.highlights.forEach(h => {
      let color = '#2563eb';
      if (h.level === 'warning') color = '#d97706';
      if (h.level === 'critical') color = '#dc2626';

      html += `
        <div style="border-left: 2px solid ${color}; padding: 8px 12px; margin-bottom: 10px; background-color: #fafafa;">
          <strong style="font-size: 13px; color: #1a202c;">${h.keyPoint}</strong>
          <span style="font-size: 8px; font-weight: bold; color: ${color}; text-transform: uppercase; margin-left: 8px;">${h.level}</span>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #4a5568;">${h.description}</p>
        </div>
      `;
    });

    html += `
        </div>
        <div style="margin-bottom: 20px;">
          <h3 style="color: #2563eb; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Action Items</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background-color: #f8fafc; text-align: left; border-bottom: 1px solid #e2e8f0;">
                <th style="padding: 8px; width: 60%;">Task</th>
                <th style="padding: 8px;">Assignee</th>
                <th style="padding: 8px;">Deadline</th>
              </tr>
            </thead>
            <tbody>
    `;

    mom.actionItems.forEach(t => {
      const strike = t.status === 'completed' ? 'text-decoration: line-through; color: #a0aec0;' : '';
      html += `
        <tr style="border-bottom: 1px solid #edf2f7;">
          <td style="padding: 8px; ${strike}">
            ${t.status === 'completed' ? '✓ ' : '☐ '} <strong>${t.task}</strong>
          </td>
          <td style="padding: 8px; color: #2563eb; font-weight: bold;">${t.assignee}</td>
          <td style="padding: 8px; color: #718096;">${t.deadline}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>

        <div>
          <h3 style="color: #2563eb; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Future Agenda</h3>
          <ul style="padding-left: 20px; font-size: 12px; color: #4a5568; margin-top: 6px;">
    `;

    mom.futureActions.forEach(a => {
      html += `
        <li style="margin-bottom: 6px;">
          <strong>${a.event}</strong> (${a.date}) - <span style="color: #718096;">${a.details}</span>
        </li>
      `;
    });

    html += `
          </ul>
        </div>
      </div>
    `;

    return html;
  },

  // Toast Messaging System
  showToast(message, type = "info") {
    const holder = document.getElementById('toast-holder');
    if (!holder) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = "";
    if (type === 'success') {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-critical)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${icon} <span>${message}</span>`;
    holder.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "toastSlideIn 150ms ease reverse forwards";
      setTimeout(() => toast.remove(), 150);
    }, 3500);
  },

  // Loader Overlay
  showLoader(statusText) {
    const overlay = document.getElementById('loading-overlay');
    const label = document.getElementById('loader-status-text');
    if (overlay && label) {
      label.innerText = statusText || "Processing...";
      overlay.style.display = 'flex';
    }
  },

  hideLoader() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
