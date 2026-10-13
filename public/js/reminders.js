/**
 * Smart Vehicle Maintenance Platform - Reminders Client Script
 */

let allVehicles = [];
let allReminders = [];
let currentFilterStatus = 'all';
let reminderModalInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await App.initAuthHeader();
  if (!user) return;

  const modalEl = document.getElementById('reminderModal');
  if (modalEl) {
    reminderModalInstance = new bootstrap.Modal(modalEl);
  }

  setupEventListeners();
  await loadVehicles();
  await loadReminders();

  // Handle URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const targetVehicleId = urlParams.get('vehicle_id');
  const targetStatus = urlParams.get('status');
  const action = urlParams.get('action');

  if (targetStatus) {
    currentFilterStatus = targetStatus;
    document.querySelectorAll('#reminderStatusTabs .nav-link').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === targetStatus);
    });
  }

  if (targetVehicleId) {
    const vSelect = document.getElementById('reminderVehicleSelect');
    if (vSelect) vSelect.value = targetVehicleId;
  }

  if (targetStatus || targetVehicleId) {
    filterAndRenderReminders();
  }

  if (action === 'new') {
    prepareAddReminder(targetVehicleId);
  }
});

function setupEventListeners() {
  // Preset selector auto-fill
  const presetSelect = document.getElementById('reminderFormPreset');
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        document.getElementById('reminderFormTaskName').value = e.target.value;
      }
    });
  }

  // Status Tab navigation
  document.querySelectorAll('#reminderStatusTabs .nav-link').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('#reminderStatusTabs .nav-link').forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentFilterStatus = e.currentTarget.dataset.status || 'all';
      filterAndRenderReminders();
    });
  });

  // Vehicle selector filter
  const vehicleFilter = document.getElementById('reminderVehicleSelect');
  if (vehicleFilter) {
    vehicleFilter.addEventListener('change', () => filterAndRenderReminders());
  }

  // Form submission
  const form = document.getElementById('reminderForm');
  if (form) {
    form.addEventListener('submit', handleReminderSubmit);
  }

  // Test Notification triggers
  const triggerBtn = document.getElementById('triggerNotificationBtn');
  const testBtn = document.getElementById('btnTestNotify');
  if (triggerBtn) triggerBtn.addEventListener('click', triggerNotificationCheck);
  if (testBtn) testBtn.addEventListener('click', triggerNotificationCheck);
}

async function loadVehicles() {
  try {
    const res = await fetch('/api/vehicles');
    if (!res.ok) return;
    const data = await res.json();
    allVehicles = data.vehicles || [];

    const filterSelect = document.getElementById('reminderVehicleSelect');
    const formSelect = document.getElementById('reminderFormVehicle');

    filterSelect.innerHTML = '<option value="">All Vehicles</option>';
    formSelect.innerHTML = '<option value="">Choose vehicle...</option>';

    allVehicles.forEach(v => {
      const opt1 = document.createElement('option');
      opt1.value = v.id;
      opt1.textContent = `${v.name} (${v.registration_number})`;
      filterSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = v.id;
      opt2.textContent = `${v.name} (${v.registration_number}) - ${v.make} ${v.model}`;
      formSelect.appendChild(opt2);
    });
  } catch (err) {
    console.error('Failed to load vehicles list:', err);
  }
}

async function loadReminders() {
  try {
    const res = await fetch('/api/reminders');
    if (!res.ok) {
      if (res.status === 401) return (window.location.href = '/login.html');
      throw new Error('Failed to fetch reminders');
    }

    const data = await res.json();
    allReminders = data.reminders || [];

    // Update SMTP status banner honestly
    updateSmtpBanner(data.emailEnabled);

    filterAndRenderReminders();
  } catch (err) {
    console.error('Error fetching reminders:', err);
    App.showToast('Could not load reminders', 'error');
  }
}

function updateSmtpBanner(isEmailConfigured) {
  const banner = document.getElementById('smtpStatusBanner');
  const icon = document.getElementById('smtpIcon');
  const title = document.getElementById('smtpTitle');
  const msg = document.getElementById('smtpMessage');

  if (isEmailConfigured) {
    banner.className = 'alert d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 shadow-sm alert-success border-success-subtle';
    icon.className = 'bi bi-check-circle-fill text-success fs-5';
    title.textContent = 'Email Reminders Active:';
    msg.textContent = 'Automated Nodemailer notifications are connected and will alert your inbox for due dates.';
  } else {
    banner.className = 'alert d-flex align-items-center justify-content-between p-3 mb-4 rounded-3 shadow-sm alert-secondary border-secondary-subtle';
    icon.className = 'bi bi-info-circle-fill text-primary fs-5';
    title.textContent = 'In-App Alerts Active:';
    msg.textContent = 'Due reminders are tracked in real time. (To enable automated email alerts, set SMTP_USER and SMTP_PASS in .env).';
  }
}

function filterAndRenderReminders() {
  const vehicleId = document.getElementById('reminderVehicleSelect')?.value || '';

  const filtered = allReminders.filter(r => {
    const matchesVehicle = !vehicleId || String(r.vehicle_id) === String(vehicleId);
    const matchesStatus = (currentFilterStatus === 'all') || (r.status === currentFilterStatus);
    return matchesVehicle && matchesStatus;
  });

  renderRemindersList(filtered);
}

function renderRemindersList(reminders) {
  const container = document.getElementById('remindersContainer');

  if (reminders.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="card-custom p-5 text-center">
          <div class="empty-state-icon">
            <i class="bi bi-bell"></i>
          </div>
          <h5 class="empty-state-title">No maintenance reminders found</h5>
          <p class="empty-state-desc">Stay ahead of maintenance by creating reminders for oil changes, inspections, and tyre rotations.</p>
          <button class="btn btn-primary-dark" onclick="prepareAddReminder()">
            <i class="bi bi-plus-lg me-1"></i> Add Maintenance Reminder
          </button>
        </div>
      </div>
    `;
    return;
  }

  let html = '';
  reminders.forEach(r => {
    let statusClass = 'border-start border-4 ';
    let badgeHtml = '';

    if (r.status === 'overdue') {
      statusClass += 'border-danger';
      badgeHtml = `<span class="badge-status status-overdue"><i class="bi bi-exclamation-octagon-fill"></i> Overdue</span>`;
    } else if (r.status === 'upcoming') {
      statusClass += 'border-warning';
      badgeHtml = `<span class="badge-status status-due"><i class="bi bi-clock-history"></i> Upcoming</span>`;
    } else {
      statusClass += 'border-secondary';
      badgeHtml = `<span class="badge-status status-completed"><i class="bi bi-check2-all"></i> Completed</span>`;
    }

    html += `
      <div class="col-md-6 col-lg-4">
        <div class="card-custom h-100 ${statusClass} d-flex flex-column">
          <div class="p-3 flex-grow-1">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="badge bg-light text-dark border small">${r.vehicle_name}</span>
              ${badgeHtml}
            </div>

            <h5 class="fw-bold mb-1 text-navy-main">${r.task_name}</h5>
            <div class="small text-muted mb-3 font-monospace">${r.registration_number}</div>

            <div class="p-2 bg-light rounded small mb-2">
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted"><i class="bi bi-calendar-event me-1"></i>Due Date:</span>
                <span class="fw-bold ${r.status === 'overdue' ? 'text-danger' : 'text-dark'}">${App.formatDate(r.due_date)}</span>
              </div>
              ${r.due_odometer ? `
                <div class="d-flex justify-content-between">
                  <span class="text-muted"><i class="bi bi-speedometer2 me-1"></i>Due Odometer:</span>
                  <span class="fw-semibold">${App.formatNumber(r.due_odometer)} km</span>
                </div>
              ` : ''}
              ${r.completed_at ? `
                <div class="d-flex justify-content-between text-success">
                  <span><i class="bi bi-check-circle me-1"></i>Finished on:</span>
                  <span>${App.formatDate(r.completed_at)}</span>
                </div>
              ` : ''}
            </div>

            ${r.notes ? `<p class="small text-muted mb-0"><i class="bi bi-chat-left-text me-1"></i>${r.notes}</p>` : ''}
          </div>

          <div class="p-2 bg-light border-top d-flex gap-2 justify-content-between align-items-center">
            ${r.status !== 'completed' ? `
              <button class="btn btn-sm btn-outline-success flex-grow-1" onclick="handleMarkCompleted(${r.id})">
                <i class="bi bi-check-lg me-1"></i> Mark Complete
              </button>
            ` : `
              <span class="small text-muted ps-2 flex-grow-1"><i class="bi bi-check2 text-success me-1"></i>Task Finished</span>
            `}
            <button class="btn-action" title="Edit Reminder" onclick="prepareEditReminder(${r.id})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-action btn-delete" title="Delete Reminder" onclick="handleDeleteReminder(${r.id})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function prepareAddReminder(preselectedVehicleId = null) {
  const form = document.getElementById('reminderForm');
  form.reset();
  form.classList.remove('was-validated');
  document.getElementById('reminderId').value = '';

  // Default due date to two weeks from now
  const future = new Date();
  future.setDate(future.getDate() + 14);
  document.getElementById('reminderFormDueDate').value = future.toISOString().split('T')[0];

  if (preselectedVehicleId) {
    document.getElementById('reminderFormVehicle').value = preselectedVehicleId;
  }

  document.getElementById('reminderStatusSelectGroup').style.display = 'none';
  document.getElementById('reminderModalLabel').textContent = 'Set Maintenance Reminder';
  document.getElementById('saveReminderBtnText').textContent = 'Save Reminder';
  const alertEl = document.getElementById('reminderModalAlert');
  alertEl.className = 'alert d-none';

  if (reminderModalInstance) reminderModalInstance.show();
}

function prepareEditReminder(reminderId) {
  const reminder = allReminders.find(r => r.id === reminderId);
  if (!reminder) return;

  document.getElementById('reminderId').value = reminder.id;
  document.getElementById('reminderFormVehicle').value = reminder.vehicle_id;
  document.getElementById('reminderFormTaskName').value = reminder.task_name;

  if (reminder.due_date) {
    const d = new Date(reminder.due_date);
    document.getElementById('reminderFormDueDate').value = d.toISOString().split('T')[0];
  }

  document.getElementById('reminderFormDueOdometer').value = reminder.due_odometer || '';
  document.getElementById('reminderFormNotes').value = reminder.notes || '';

  const statusGroup = document.getElementById('reminderStatusSelectGroup');
  statusGroup.style.display = 'block';
  document.getElementById('reminderFormStatus').value = reminder.status;

  document.getElementById('reminderModalLabel').textContent = 'Edit Maintenance Reminder';
  document.getElementById('saveReminderBtnText').textContent = 'Update Reminder';
  const alertEl = document.getElementById('reminderModalAlert');
  alertEl.className = 'alert d-none';

  if (reminderModalInstance) reminderModalInstance.show();
}

async function handleReminderSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const alertEl = document.getElementById('reminderModalAlert');
  alertEl.className = 'alert d-none';

  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const reminderId = document.getElementById('reminderId').value;
  const isEdit = Boolean(reminderId);

  const payload = {
    vehicle_id: document.getElementById('reminderFormVehicle').value,
    task_name: document.getElementById('reminderFormTaskName').value.trim(),
    due_date: document.getElementById('reminderFormDueDate').value,
    due_odometer: document.getElementById('reminderFormDueOdometer').value || null,
    notes: document.getElementById('reminderFormNotes').value.trim()
  };

  if (isEdit) {
    payload.status = document.getElementById('reminderFormStatus').value;
  }

  const saveBtn = document.getElementById('saveReminderBtn');
  const spinner = document.getElementById('saveReminderSpinner');
  saveBtn.disabled = true;
  spinner.classList.remove('d-none');

  try {
    const url = isEdit ? `/api/reminders/${reminderId}` : '/api/reminders';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      alertEl.className = 'alert alert-danger d-block';
      alertEl.textContent = data.message || 'Operation failed.';
      saveBtn.disabled = false;
      spinner.classList.add('d-none');
      return;
    }

    App.showToast(isEdit ? 'Reminder updated!' : 'Reminder created successfully!', 'success');
    if (reminderModalInstance) reminderModalInstance.hide();
    await loadReminders();
  } catch (err) {
    alertEl.className = 'alert alert-danger d-block';
    alertEl.textContent = 'Server error while saving reminder.';
  } finally {
    saveBtn.disabled = false;
    spinner.classList.add('d-none');
  }
}

async function handleMarkCompleted(reminderId) {
  try {
    const res = await fetch(`/api/reminders/${reminderId}/complete`, { method: 'PATCH' });
    const data = await res.json();
    if (!res.ok) {
      App.showToast(data.message || 'Failed to update reminder', 'error');
      return;
    }

    App.showToast('Reminder marked as completed!', 'success');
    await loadReminders();
  } catch (err) {
    App.showToast('Network error while completing reminder', 'error');
  }
}

async function handleDeleteReminder(reminderId) {
  const confirmed = await App.confirm(
    'Are you sure you want to delete this maintenance reminder?',
    'Delete Reminder',
    'Delete',
    'btn-danger'
  );

  if (!confirmed) return;

  try {
    const res = await fetch(`/api/reminders/${reminderId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      App.showToast(data.message || 'Failed to delete reminder', 'error');
      return;
    }

    App.showToast('Reminder deleted successfully', 'success');
    await loadReminders();
  } catch (err) {
    App.showToast('Network error while deleting reminder', 'error');
  }
}

async function triggerNotificationCheck() {
  App.showToast('Checking maintenance schedules...', 'info');
  try {
    const res = await fetch('/api/reminders/trigger-check', { method: 'POST' });
    const data = await res.json();

    if (!data.emailEnabled) {
      App.showToast('In-app reminder dates refreshed. Email alerts are unconfigured (set SMTP credentials in .env to enable).', 'warning');
    } else {
      App.showToast(`Notification check complete: ${data.sentCount || 0} email(s) sent.`, 'success');
    }
    await loadReminders();
  } catch (err) {
    App.showToast('Could not run notification check', 'error');
  }
}
