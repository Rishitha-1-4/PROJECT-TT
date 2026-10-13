/**
 * Smart Vehicle Maintenance Platform - Dashboard Client Logic
 */

let expenseChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await App.initAuthHeader();
  if (!user) return;

  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    const res = await fetch('/api/dashboard/stats');
    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = '/login.html';
        return;
      }
      throw new Error('Failed to fetch dashboard telemetry');
    }

    const data = await res.json();
    const stats = data.stats;

    // 1. Populate KPI counters
    document.getElementById('kpiVehicles').textContent = App.formatNumber(stats.totalVehicles);
    document.getElementById('kpiUpcoming').textContent = App.formatNumber(stats.upcomingReminders);
    document.getElementById('kpiOverdue').textContent = App.formatNumber(stats.overdueReminders);
    document.getElementById('kpiExpenses').textContent = App.formatCurrency(stats.totalExpenses);

    // 2. Render Monthly Expenses Chart
    renderExpenseChart(stats.monthlyExpenses);

    // 3. Render Vehicle Status Overview
    renderVehicleStatuses(stats.vehicleStatuses);

    // 4. Render Recent Services Table
    renderRecentServices(stats.recentServices);
  } catch (err) {
    console.error('Dashboard load error:', err);
    App.showToast('Could not load dashboard data. Check database connection.', 'error');
  }
}

function renderExpenseChart(monthlyData) {
  const canvas = document.getElementById('monthlyExpenseChart');
  const emptyState = document.getElementById('chartEmptyState');

  if (!monthlyData || monthlyData.length === 0) {
    canvas.classList.add('d-none');
    emptyState.classList.remove('d-none');
    return;
  }

  canvas.classList.remove('d-none');
  emptyState.classList.add('d-none');

  const labels = monthlyData.map(d => d.month_label);
  const values = monthlyData.map(d => parseFloat(d.total_amount));

  if (expenseChartInstance) {
    expenseChartInstance.destroy();
  }

  const ctx = canvas.getContext('2d');
  expenseChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Maintenance Expenses ($)',
        data: values,
        backgroundColor: 'rgba(37, 99, 235, 0.75)',
        hoverBackgroundColor: 'rgba(29, 78, 216, 0.9)',
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return 'Cost: ' + App.formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { size: 12 } }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: {
            color: '#64748b',
            callback: function(value) {
              return '$' + value;
            }
          }
        }
      }
    }
  });
}

function renderVehicleStatuses(vehicleStatuses) {
  const container = document.getElementById('vehiclesStatusContainer');

  if (!vehicleStatuses || vehicleStatuses.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-muted">
        <i class="bi bi-car-front fs-2 text-secondary mb-2 d-block"></i>
        <p class="mb-2">No vehicles registered yet.</p>
        <a href="/vehicles.html" class="btn btn-sm btn-primary-dark">Add Your First Vehicle</a>
      </div>
    `;
    return;
  }

  let html = '';
  vehicleStatuses.forEach(v => {
    let badgeHtml = '';
    if (v.status === 'Overdue') {
      badgeHtml = `<span class="badge-status status-overdue"><i class="bi bi-exclamation-octagon-fill"></i> Overdue</span>`;
    } else if (v.status === 'Due Soon') {
      badgeHtml = `<span class="badge-status status-due"><i class="bi bi-clock-history"></i> Due Soon</span>`;
    } else {
      badgeHtml = `<span class="badge-status status-good"><i class="bi bi-check-circle-fill"></i> Good</span>`;
    }

    html += `
      <div class="p-3 rounded border d-flex align-items-center justify-content-between hover-bg-light transition" style="background: #fafbfc;">
        <div class="d-flex align-items-center gap-3">
          <div class="vehicle-avatar">
            <i class="bi ${v.vehicle_type === 'Motorcycle' ? 'bi-bicycle' : 'bi-car-front-fill'}"></i>
          </div>
          <div>
            <div class="fw-bold text-navy-main">
              <a href="/vehicle-details.html?id=${v.id}" class="text-decoration-none text-dark">${v.name}</a>
            </div>
            <small class="text-muted">${v.make} ${v.model} &bull; ${v.registration_number}</small>
          </div>
        </div>
        <div class="text-end">
          ${badgeHtml}
          <div class="small text-muted mt-1">${App.formatNumber(v.current_odometer)} km</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderRecentServices(recentServices) {
  const tbody = document.getElementById('recentServicesTableBody');

  if (!recentServices || recentServices.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <i class="bi bi-wrench fs-3 text-secondary mb-2 d-block"></i>
          No service records logged yet. 
          <a href="/services.html" class="ms-1 fw-semibold text-primary">Record a service now</a>
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  recentServices.forEach(s => {
    html += `
      <tr>
        <td>
          <div class="fw-semibold">${s.vehicle_name}</div>
          <small class="text-muted">${s.registration_number}</small>
        </td>
        <td>${App.formatDate(s.service_date)}</td>
        <td><span class="badge bg-light text-dark border">${s.service_type}</span></td>
        <td>${App.formatNumber(s.odometer_reading)} km</td>
        <td>${s.service_center || '—'}</td>
        <td class="fw-bold text-navy-main">${App.formatCurrency(s.total_cost)}</td>
        <td class="text-end">
          <a href="/services.html" class="btn btn-sm btn-outline-custom" title="View in Service History">
            <i class="bi bi-eye"></i>
          </a>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}
