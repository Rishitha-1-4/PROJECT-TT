/**
 * Smart Vehicle Maintenance Platform - Service History Client Script
 */

let allVehicles = [];
let allServices = [];
let serviceModalInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await App.initAuthHeader();
  if (!user) return;

  const modalEl = document.getElementById('serviceModal');
  if (modalEl) {
    serviceModalInstance = new bootstrap.Modal(modalEl);
  }

  setupEventListeners();
  await loadVehicles();
  await loadServices();

  // Check URL query parameters for deep linking
  const urlParams = new URLSearchParams(window.location.search);
  const targetVehicleId = urlParams.get('vehicle_id');
  const action = urlParams.get('action');

  if (targetVehicleId) {
    const filterSelect = document.getElementById('vehicleFilterSelect');
    if (filterSelect) {
      filterSelect.value = targetVehicleId;
      await loadServices();
    }
  }

  if (action === 'new') {
    prepareAddService(targetVehicleId);
  }
});

function setupEventListeners() {
  const searchInput = document.getElementById('serviceSearchInput');
  const vehicleFilter = document.getElementById('vehicleFilterSelect');
  const sortSelect = document.getElementById('sortSelect');
  const resetBtn = document.getElementById('resetFiltersBtn');

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadServices(), 300);
    });
  }

  if (vehicleFilter) {
    vehicleFilter.addEventListener('change', () => loadServices());
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => loadServices());
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('serviceSearchInput').value = '';
      document.getElementById('vehicleFilterSelect').value = '';
      document.getElementById('sortSelect').value = 'date_desc';
      loadServices();
    });
  }

  const form = document.getElementById('serviceForm');
  if (form) {
    form.addEventListener('submit', handleServiceSubmit);
  }
}

async function loadVehicles() {
  try {
    const res = await fetch('/api/vehicles');
    if (!res.ok) return;
    const data = await res.json();
    allVehicles = data.vehicles || [];

    const filterSelect = document.getElementById('vehicleFilterSelect');
    const formSelect = document.getElementById('formVehicleId');

    filterSelect.innerHTML = '<option value="">All Registered Vehicles</option>';
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

async function loadServices() {
  const query = document.getElementById('serviceSearchInput')?.value || '';
  const vehicleId = document.getElementById('vehicleFilterSelect')?.value || '';
  const sort = document.getElementById('sortSelect')?.value || 'date_desc';

  const params = new URLSearchParams();
  if (query.trim()) params.append('search', query.trim());
  if (vehicleId) params.append('vehicle_id', vehicleId);
  if (sort) params.append('sort', sort);

  try {
    const res = await fetch(`/api/services?${params.toString()}`);
    if (!res.ok) {
      if (res.status === 401) return (window.location.href = '/login.html');
      throw new Error('Failed to fetch services');
    }

    const data = await res.json();
    allServices = data.services || [];
    renderServicesTable(allServices);
  } catch (err) {
    console.error('Error fetching services:', err);
    App.showToast('Could not load service records', 'error');
  }
}

function renderServicesTable(services) {
  const tbody = document.getElementById('servicesTableBody');
  const countDisplay = document.getElementById('serviceCountDisplay');
  const totalExpenseDisplay = document.getElementById('serviceTotalExpenseDisplay');

  countDisplay.textContent = services.length;
  const totalCost = services.reduce((sum, s) => sum + parseFloat(s.total_cost || 0), 0);
  totalExpenseDisplay.textContent = App.formatCurrency(totalCost);

  if (services.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-5">
          <div class="empty-state-icon">
            <i class="bi bi-wrench"></i>
          </div>
          <h5 class="empty-state-title">No service records found</h5>
          <p class="empty-state-desc">Log past or recent maintenance visits, part renewals, and repair bills to keep track of spending.</p>
          <button class="btn btn-primary-dark" onclick="prepareAddService()">
            <i class="bi bi-plus-lg me-1"></i> Record First Service
          </button>
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  services.forEach(s => {
    html += `
      <tr>
        <td class="fw-semibold text-nowrap">${App.formatDate(s.service_date)}</td>
        <td>
          <div class="fw-semibold text-navy-main">
            <a href="/vehicle-details.html?id=${s.vehicle_id}" class="text-decoration-none text-dark">${s.vehicle_name}</a>
          </div>
          <small class="text-muted font-monospace">${s.registration_number}</small>
        </td>
        <td><span class="badge bg-light text-dark border">${s.service_type}</span></td>
        <td class="text-nowrap">${App.formatNumber(s.odometer_reading)} km</td>
        <td style="max-width: 250px;">
          ${s.description ? `<div class="small text-dark text-truncate">${s.description}</div>` : ''}
          ${s.parts_replaced ? `<small class="text-muted d-block text-truncate"><i class="bi bi-box-seam me-1"></i>Parts: ${s.parts_replaced}</small>` : ''}
          ${!s.description && !s.parts_replaced ? '<span class="text-muted small">—</span>' : ''}
        </td>
        <td>${s.service_center || '<span class="text-muted">—</span>'}</td>
        <td class="fw-bold text-success text-nowrap">${App.formatCurrency(s.total_cost)}</td>
        <td class="text-end text-nowrap">
          <button class="btn-action me-1" title="Edit Service" onclick="prepareEditService(${s.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn-action btn-delete" title="Delete Service" onclick="handleDeleteService(${s.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

function prepareAddService(preselectedVehicleId = null) {
  const form = document.getElementById('serviceForm');
  form.reset();
  form.classList.remove('was-validated');
  document.getElementById('serviceId').value = '';

  // Default date to today
  document.getElementById('formServiceDate').value = new Date().toISOString().split('T')[0];

  if (preselectedVehicleId) {
    document.getElementById('formVehicleId').value = preselectedVehicleId;
  }

  document.getElementById('serviceModalLabel').textContent = 'Record New Service';
  document.getElementById('saveServiceBtnText').textContent = 'Save Service Record';
  const alertEl = document.getElementById('serviceModalAlert');
  alertEl.className = 'alert d-none';

  if (serviceModalInstance) serviceModalInstance.show();
}

function prepareEditService(serviceId) {
  const service = allServices.find(s => s.id === serviceId);
  if (!service) return;

  document.getElementById('serviceId').value = service.id;
  document.getElementById('formVehicleId').value = service.vehicle_id;
  document.getElementById('formServiceType').value = service.service_type;

  if (service.service_date) {
    const d = new Date(service.service_date);
    document.getElementById('formServiceDate').value = d.toISOString().split('T')[0];
  }

  document.getElementById('formOdometer').value = service.odometer_reading;
  document.getElementById('formCost').value = service.total_cost;
  document.getElementById('formServiceCenter').value = service.service_center || '';
  document.getElementById('formParts').value = service.parts_replaced || '';
  document.getElementById('formDescription').value = service.description || '';

  if (service.next_service_date) {
    const nd = new Date(service.next_service_date);
    document.getElementById('formNextDate').value = nd.toISOString().split('T')[0];
  } else {
    document.getElementById('formNextDate').value = '';
  }

  document.getElementById('serviceModalLabel').textContent = 'Edit Service Record';
  document.getElementById('saveServiceBtnText').textContent = 'Update Record';
  const alertEl = document.getElementById('serviceModalAlert');
  alertEl.className = 'alert d-none';

  if (serviceModalInstance) serviceModalInstance.show();
}

async function handleServiceSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const alertEl = document.getElementById('serviceModalAlert');
  alertEl.className = 'alert d-none';

  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const serviceId = document.getElementById('serviceId').value;
  const isEdit = Boolean(serviceId);

  const payload = {
    vehicle_id: document.getElementById('formVehicleId').value,
    service_type: document.getElementById('formServiceType').value,
    service_date: document.getElementById('formServiceDate').value,
    odometer_reading: document.getElementById('formOdometer').value,
    total_cost: document.getElementById('formCost').value,
    service_center: document.getElementById('formServiceCenter').value.trim(),
    parts_replaced: document.getElementById('formParts').value.trim(),
    description: document.getElementById('formDescription').value.trim(),
    next_service_date: document.getElementById('formNextDate').value || null
  };

  const saveBtn = document.getElementById('saveServiceBtn');
  const spinner = document.getElementById('saveServiceSpinner');
  saveBtn.disabled = true;
  spinner.classList.remove('d-none');

  try {
    const url = isEdit ? `/api/services/${serviceId}` : '/api/services';
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

    App.showToast(isEdit ? 'Service record updated!' : 'Service record saved successfully!', 'success');
    if (serviceModalInstance) serviceModalInstance.hide();
    await loadServices();
  } catch (err) {
    alertEl.className = 'alert alert-danger d-block';
    alertEl.textContent = 'Server error while saving service record.';
  } finally {
    saveBtn.disabled = false;
    spinner.classList.add('d-none');
  }
}

async function handleDeleteService(serviceId) {
  const confirmed = await App.confirm(
    'Are you sure you want to delete this service record? This action cannot be undone.',
    'Delete Service Record',
    'Delete Record',
    'btn-danger'
  );

  if (!confirmed) return;

  try {
    const res = await fetch(`/api/services/${serviceId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      App.showToast(data.message || 'Could not delete service record', 'error');
      return;
    }

    App.showToast('Service record deleted', 'success');
    await loadServices();
  } catch (err) {
    App.showToast('Network error while deleting service record', 'error');
  }
}
