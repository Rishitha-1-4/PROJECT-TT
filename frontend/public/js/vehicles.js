/**
 * Smart Vehicle Maintenance Platform - Vehicle Management Client Script
 */

let allVehicles = [];
let vehicleModalInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await App.initAuthHeader();
  if (!user) return;

  const modalEl = document.getElementById('vehicleModal');
  if (modalEl) {
    vehicleModalInstance = new bootstrap.Modal(modalEl);
  }

  setupEventListeners();
  await loadVehicles();
});

function setupEventListeners() {
  const searchInput = document.getElementById('vehicleSearchInput');
  const typeFilter = document.getElementById('vehicleTypeFilter');

  if (searchInput) {
    searchInput.addEventListener('input', () => filterAndRenderVehicles());
  }

  if (typeFilter) {
    typeFilter.addEventListener('change', () => filterAndRenderVehicles());
  }

  const vehicleForm = document.getElementById('vehicleForm');
  if (vehicleForm) {
    vehicleForm.addEventListener('submit', handleVehicleSubmit);
  }
}

async function loadVehicles() {
  try {
    const res = await fetch('/api/vehicles');
    if (!res.ok) {
      if (res.status === 401) return (window.location.href = '/login.html');
      throw new Error('Could not fetch vehicles');
    }

    const data = await res.json();
    allVehicles = data.vehicles || [];
    filterAndRenderVehicles();
  } catch (err) {
    console.error('Failed to load vehicles:', err);
    App.showToast('Could not load vehicles list', 'error');
  }
}

function filterAndRenderVehicles() {
  const query = (document.getElementById('vehicleSearchInput')?.value || '').toLowerCase().trim();
  const selectedType = document.getElementById('vehicleTypeFilter')?.value || 'all';

  const filtered = allVehicles.filter(v => {
    const matchesType = (selectedType === 'all') || (v.vehicle_type === selectedType);
    const textTarget = `${v.name} ${v.registration_number} ${v.make} ${v.model} ${v.year} ${v.fuel_type}`.toLowerCase();
    const matchesQuery = !query || textTarget.includes(query);
    return matchesType && matchesQuery;
  });

  document.getElementById('vehicleCountBadge').textContent = filtered.length;
  renderVehiclesGrid(filtered);
}

function renderVehiclesGrid(vehicles) {
  const grid = document.getElementById('vehiclesGrid');
  if (!grid) return;

  if (vehicles.length === 0) {
    grid.innerHTML = `
      <div class="col-12">
        <div class="card-custom p-5 text-center">
          <div class="empty-state-icon">
            <i class="bi bi-car-front"></i>
          </div>
          <h5 class="empty-state-title">No vehicles found</h5>
          <p class="empty-state-desc">You haven't registered any vehicles matching your filter criteria yet.</p>
          <button class="btn btn-primary-dark" onclick="prepareAddVehicle()">
            <i class="bi bi-plus-lg me-1"></i> Register New Vehicle
          </button>
        </div>
      </div>
    `;
    return;
  }

  let html = '';
  vehicles.forEach(v => {
    let statusBadge = '';
    if (v.maintenance_status === 'Overdue') {
      statusBadge = `<span class="badge-status status-overdue"><i class="bi bi-exclamation-octagon-fill"></i> Overdue</span>`;
    } else if (v.maintenance_status === 'Due Soon') {
      statusBadge = `<span class="badge-status status-due"><i class="bi bi-clock-history"></i> Due Soon</span>`;
    } else {
      statusBadge = `<span class="badge-status status-good"><i class="bi bi-check-circle-fill"></i> Good</span>`;
    }

    const vehicleIcon = v.vehicle_type === 'Motorcycle' ? 'bi-bicycle' : 
                        v.vehicle_type === 'Truck' ? 'bi-truck' : 'bi-car-front-fill';

    html += `
      <div class="col-md-6 col-lg-4">
        <div class="card-custom h-100 d-flex flex-column">
          <div class="p-4 flex-grow-1">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <span class="badge bg-light text-secondary border px-2 py-1">${v.vehicle_type}</span>
              ${statusBadge}
            </div>

            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="vehicle-avatar" style="width:50px;height:50px;font-size:1.6rem;">
                <i class="bi ${vehicleIcon}"></i>
              </div>
              <div>
                <h5 class="fw-bold mb-0 text-navy-main">${v.name}</h5>
                <span class="text-primary fw-semibold small">${v.make} ${v.model} (${v.year})</span>
              </div>
            </div>

            <div class="p-3 bg-light rounded-3 mb-3 small">
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted">Plate:</span>
                <span class="fw-bold text-dark font-monospace">${v.registration_number}</span>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted">Odometer:</span>
                <span class="fw-semibold">${App.formatNumber(v.current_odometer)} km</span>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span class="text-muted">Fuel Type:</span>
                <span class="fw-semibold">${v.fuel_type}</span>
              </div>
              <div class="d-flex justify-content-between">
                <span class="text-muted">Total Spent:</span>
                <span class="fw-bold text-success">${App.formatCurrency(v.total_expenses || 0)}</span>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center small text-muted">
              <span><i class="bi bi-wrench me-1"></i>${v.service_count || 0} services</span>
              <span><i class="bi bi-bell me-1"></i>${(v.upcoming_reminders || 0) + (v.overdue_reminders || 0)} reminders</span>
            </div>
          </div>

          <div class="p-3 bg-light border-top d-flex gap-2 justify-content-between align-items-center">
            <a href="/vehicle-details.html?id=${v.id}" class="btn btn-sm btn-outline-custom flex-grow-1">
              <i class="bi bi-heart-pulse me-1"></i> Health & Details
            </a>
            <button class="btn-action" title="Edit Vehicle" onclick="prepareEditVehicle(${v.id})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-action btn-delete" title="Delete Vehicle" onclick="handleDeleteVehicle(${v.id}, '${v.name}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

function prepareAddVehicle() {
  const form = document.getElementById('vehicleForm');
  form.reset();
  form.classList.remove('was-validated');
  document.getElementById('vehicleId').value = '';
  document.getElementById('vehicleModalLabel').textContent = 'Add New Vehicle';
  document.getElementById('saveBtnText').textContent = 'Save Vehicle';
  const alertEl = document.getElementById('modalAlert');
  alertEl.className = 'alert d-none';
  alertEl.textContent = '';
  if (vehicleModalInstance) vehicleModalInstance.show();
}

function prepareEditVehicle(vehicleId) {
  const vehicle = allVehicles.find(v => v.id === vehicleId);
  if (!vehicle) return;

  document.getElementById('vehicleId').value = vehicle.id;
  document.getElementById('vehicleName').value = vehicle.name;
  document.getElementById('registrationNumber').value = vehicle.registration_number;
  document.getElementById('vehicleType').value = vehicle.vehicle_type;
  document.getElementById('make').value = vehicle.make;
  document.getElementById('model').value = vehicle.model;
  document.getElementById('year').value = vehicle.year;
  document.getElementById('fuelType').value = vehicle.fuel_type;
  document.getElementById('currentOdometer').value = vehicle.current_odometer;

  if (vehicle.purchase_date) {
    const d = new Date(vehicle.purchase_date);
    document.getElementById('purchaseDate').value = d.toISOString().split('T')[0];
  } else {
    document.getElementById('purchaseDate').value = '';
  }

  document.getElementById('vehicleModalLabel').textContent = 'Edit Vehicle Details';
  document.getElementById('saveBtnText').textContent = 'Update Vehicle';
  const alertEl = document.getElementById('modalAlert');
  alertEl.className = 'alert d-none';

  if (vehicleModalInstance) vehicleModalInstance.show();
}

async function handleVehicleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const alertEl = document.getElementById('modalAlert');
  alertEl.className = 'alert d-none';

  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const vehicleId = document.getElementById('vehicleId').value;
  const isEdit = Boolean(vehicleId);

  const payload = {
    name: document.getElementById('vehicleName').value.trim(),
    registration_number: document.getElementById('registrationNumber').value.trim(),
    vehicle_type: document.getElementById('vehicleType').value,
    make: document.getElementById('make').value.trim(),
    model: document.getElementById('model').value.trim(),
    year: document.getElementById('year').value,
    fuel_type: document.getElementById('fuelType').value,
    current_odometer: document.getElementById('currentOdometer').value,
    purchase_date: document.getElementById('purchaseDate').value || null
  };

  const saveBtn = document.getElementById('saveVehicleBtn');
  const spinner = document.getElementById('saveSpinner');
  saveBtn.disabled = true;
  spinner.classList.remove('d-none');

  try {
    const url = isEdit ? `/api/vehicles/${vehicleId}` : '/api/vehicles';
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

    App.showToast(isEdit ? 'Vehicle updated successfully!' : 'Vehicle added to your garage!', 'success');
    if (vehicleModalInstance) vehicleModalInstance.hide();
    await loadVehicles();
  } catch (err) {
    alertEl.className = 'alert alert-danger d-block';
    alertEl.textContent = 'Server or network error. Please try again.';
  } finally {
    saveBtn.disabled = false;
    spinner.classList.add('d-none');
  }
}

async function handleDeleteVehicle(vehicleId, vehicleName) {
  const confirmed = await App.confirm(
    `Are you sure you want to delete "${vehicleName}"? This will permanently delete all associated service records and maintenance reminders.`,
    'Delete Vehicle',
    'Delete Permanently',
    'btn-danger'
  );

  if (!confirmed) return;

  try {
    const res = await fetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      App.showToast(data.message || 'Could not delete vehicle', 'error');
      return;
    }

    App.showToast('Vehicle deleted successfully', 'success');
    await loadVehicles();
  } catch (err) {
    App.showToast('Network error while deleting vehicle', 'error');
  }
}
