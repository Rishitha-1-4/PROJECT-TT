/**
 * Smart Vehicle Maintenance Platform - Shared Client Utilities
 */

const App = {
  // Current user cache
  currentUser: null,

  // Toast notification system
  showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: 'bi-check-circle-fill text-success',
      error: 'bi-exclamation-octagon-fill text-danger',
      danger: 'bi-exclamation-octagon-fill text-danger',
      warning: 'bi-exclamation-triangle-fill text-warning',
      info: 'bi-info-circle-fill text-primary'
    };

    const icon = icons[type] || icons.info;
    const toast = document.createElement('div');
    toast.className = 'toast-custom mb-2 p-3 d-flex align-items-center gap-3';
    toast.innerHTML = `
      <i class="bi ${icon} fs-4"></i>
      <div class="flex-grow-1" style="font-size: 0.88rem; font-weight: 500;">${message}</div>
      <button type="button" class="btn-close btn-close-sm" style="font-size: 0.75rem;" aria-label="Close"></button>
    `;

    container.appendChild(toast);

    toast.querySelector('.btn-close').addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.transition = 'opacity 0.4s ease';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
      }
    }, 4500);
  },

  // Confirmation Modal
  confirm(message, title = 'Confirm Action', confirmBtnText = 'Confirm', confirmBtnClass = 'btn-danger') {
    return new Promise((resolve) => {
      let modalEl = document.getElementById('appConfirmModal');
      if (!modalEl) {
        const div = document.createElement('div');
        div.innerHTML = `
          <div class="modal fade" id="appConfirmModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-sm">
              <div class="modal-content border-0 shadow-lg" style="border-radius: var(--radius-md);">
                <div class="modal-header border-bottom-0 pb-1">
                  <h6 class="modal-title fw-bold" id="appConfirmModalTitle">Confirm</h6>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body pt-2 pb-3" id="appConfirmModalBody" style="font-size: 0.9rem; color: #475569;">
                  Are you sure?
                </div>
                <div class="modal-footer border-top-0 pt-0">
                  <button type="button" class="btn btn-sm btn-light border" data-bs-dismiss="modal">Cancel</button>
                  <button type="button" class="btn btn-sm" id="appConfirmModalBtn">Confirm</button>
                </div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(div.firstElementChild);
        modalEl = document.getElementById('appConfirmModal');
      }

      const titleEl = document.getElementById('appConfirmModalTitle');
      const bodyEl = document.getElementById('appConfirmModalBody');
      const actionBtn = document.getElementById('appConfirmModalBtn');

      titleEl.textContent = title;
      bodyEl.textContent = message;
      actionBtn.textContent = confirmBtnText;
      actionBtn.className = `btn btn-sm ${confirmBtnClass}`;

      const bsModal = new bootstrap.Modal(modalEl);

      const handleConfirm = () => {
        actionBtn.removeEventListener('click', handleConfirm);
        bsModal.hide();
        resolve(true);
      };

      const handleDismiss = () => {
        modalEl.removeEventListener('hidden.bs.modal', handleDismiss);
        actionBtn.removeEventListener('click', handleConfirm);
        resolve(false);
      };

      actionBtn.addEventListener('click', handleConfirm);
      modalEl.addEventListener('hidden.bs.modal', handleDismiss, { once: true });

      bsModal.show();
    });
  },

  // Currency & Date formatters
  formatCurrency(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(num);
  },

  formatDate(dateString) {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  formatNumber(val) {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US').format(num);
  },

  // Calculate maintenance status based on next service date & reminders
  calculateVehicleStatus(latestServiceNextDate, upcomingReminders = []) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const datesToCheck = [];
    if (latestServiceNextDate) {
      datesToCheck.push(new Date(latestServiceNextDate));
    }

    if (Array.isArray(upcomingReminders)) {
      upcomingReminders.forEach(r => {
        if (r.due_date && r.status !== 'completed') {
          datesToCheck.push(new Date(r.due_date));
        }
      });
    }

    if (datesToCheck.length === 0) {
      return { status: 'good', label: 'Good Condition', icon: 'bi-check-circle-fill' };
    }

    let isOverdue = false;
    let isDueSoon = false;

    for (const d of datesToCheck) {
      const diffDays = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        isOverdue = true;
        break;
      } else if (diffDays <= 14) {
        isDueSoon = true;
      }
    }

    if (isOverdue) {
      return { status: 'overdue', label: 'Overdue Service', icon: 'bi-exclamation-octagon-fill' };
    }
    if (isDueSoon) {
      return { status: 'due', label: 'Due Soon', icon: 'bi-exclamation-triangle-fill' };
    }
    return { status: 'good', label: 'Good Condition', icon: 'bi-check-circle-fill' };
  },

  renderStatusBadge(statusObj) {
    const status = typeof statusObj === 'string' ? statusObj.toLowerCase() : (statusObj?.status || 'good');
    if (status === 'overdue') {
      return `<span class="badge-status status-overdue"><i class="bi bi-exclamation-octagon-fill"></i> Overdue</span>`;
    }
    if (status === 'due' || status === 'due soon' || status === 'upcoming') {
      return `<span class="badge-status status-due"><i class="bi bi-clock-history"></i> Due Soon</span>`;
    }
    if (status === 'completed') {
      return `<span class="badge-status status-completed"><i class="bi bi-check2-all"></i> Completed</span>`;
    }
    return `<span class="badge-status status-good"><i class="bi bi-check-circle-fill"></i> Good</span>`;
  },

  // Auth and session header initialization
  async initAuthHeader() {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        if (window.location.pathname !== '/' && 
            !window.location.pathname.includes('login') && 
            !window.location.pathname.includes('register')) {
          window.location.href = '/login.html';
          return null;
        }
        return null;
      }
      const data = await res.json();
      this.currentUser = data.user;

      // Update sidebar/topbar user labels if present
      document.querySelectorAll('.sidebar-user-name, .topbar-user-name').forEach(el => {
        el.textContent = this.currentUser.name;
      });
      document.querySelectorAll('.sidebar-user-avatar, .topbar-user-avatar').forEach(el => {
        el.textContent = this.currentUser.name.charAt(0).toUpperCase();
      });

      return this.currentUser;
    } catch (err) {
      console.warn('Session check warning:', err);
      return null;
    }
  },

  // Logout handler
  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login.html';
    } catch (err) {
      window.location.href = '/login.html';
    }
  },

  // Setup sidebar mobile toggle listener
  initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        if (overlay) overlay.classList.toggle('show');
      });
    }

    if (overlay && sidebar) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.initSidebarToggle();
});
