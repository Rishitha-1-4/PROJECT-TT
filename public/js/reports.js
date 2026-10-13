/**
 * Smart Vehicle Maintenance Platform - Reports & Analytics Client Script
 */

let monthlyChart = null;
let vehicleChart = null;
let allVehicles = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await App.initAuthHeader();
  if (!user) return;

  const printDateEl = document.getElementById('printDate');
  if (printDateEl) {
    printDateEl.textContent = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  setupEventListeners();
  await loadVehicles();
  await loadAnalytics();
});

function setupEventListeners() {
  const applyBtn = document.getElementById('applyFiltersBtn');
  const resetBtn = document.getElementById('resetFiltersBtn');

  if (applyBtn) {
    applyBtn.addEventListener('click', () => loadAnalytics());
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('filterVehicle').value = 'all';
      document.getElementById('filterStartDate').value = '';
      document.getElementById('filterEndDate').value = '';
      loadAnalytics();
    });
  }
}

async function loadVehicles() {
  try {
    const res = await fetch('/api/vehicles');
    if (!res.ok) return;
    const data = await res.json();
    allVehicles = data.vehicles || [];

    const select = document.getElementById('filterVehicle');
    if (!select) return;

    allVehicles.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.name} (${v.registration_number})`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load vehicles list:', err);
  }
}

async function loadAnalytics() {
  const vehicleId = document.getElementById('filterVehicle')?.value || 'all';
  const startDate = document.getElementById('filterStartDate')?.value || '';
  const endDate = document.getElementById('filterEndDate')?.value || '';

  const params = new URLSearchParams();
  if (vehicleId && vehicleId !== 'all') params.append('vehicle_id', vehicleId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  try {
    const res = await fetch(`/api/reports/analytics?${params.toString()}`);
    if (!res.ok) {
      if (res.status === 401) return (window.location.href = '/login.html');
      throw new Error('Failed to fetch analytics');
    }

    const data = await res.json();

    // Summary KPIs
    document.getElementById('repTotalExpense').textContent = App.formatCurrency(data.summary.totalExpense);
    document.getElementById('repTotalServices').textContent = App.formatNumber(data.summary.totalServices);
    document.getElementById('repAvgCost').textContent = App.formatCurrency(data.summary.avgCost);

    // Render Charts
    renderMonthlyTrendChart(data.monthlyExpenses);
    renderVehicleDistributionChart(data.vehicleBreakdown);

    // Render Detailed Table
    renderDetailedReport(data.detailedRecords, data.summary.totalExpense);
  } catch (err) {
    console.error('Error fetching analytics:', err);
    App.showToast('Could not load analytics report', 'error');
  }
}

function renderMonthlyTrendChart(monthlyData) {
  const canvas = document.getElementById('monthlyTrendChart');
  const emptyNotice = document.getElementById('monthlyEmptyNotice');

  if (!monthlyData || monthlyData.length === 0) {
    canvas.classList.add('d-none');
    emptyNotice.classList.remove('d-none');
    if (monthlyChart) monthlyChart.destroy();
    return;
  }

  canvas.classList.remove('d-none');
  emptyNotice.classList.add('d-none');

  const labels = monthlyData.map(d => d.month_label);
  const values = monthlyData.map(d => parseFloat(d.total_amount));

  if (monthlyChart) monthlyChart.destroy();

  const ctx = canvas.getContext('2d');
  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Expense ($)',
        data: values,
        backgroundColor: '#2563eb',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => 'Amount: ' + App.formatCurrency(ctx.parsed.y)
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => '$' + v
          }
        }
      }
    }
  });
}

function renderVehicleDistributionChart(vehicleBreakdown) {
  const canvas = document.getElementById('vehicleDistributionChart');
  const emptyNotice = document.getElementById('vehicleEmptyNotice');

  const activeVehicles = (vehicleBreakdown || []).filter(v => parseFloat(v.total_spent) > 0);

  if (activeVehicles.length === 0) {
    canvas.classList.add('d-none');
    emptyNotice.classList.remove('d-none');
    if (vehicleChart) vehicleChart.destroy();
    return;
  }

  canvas.classList.remove('d-none');
  emptyNotice.classList.add('d-none');

  const labels = activeVehicles.map(v => v.name);
  const values = activeVehicles.map(v => parseFloat(v.total_spent));

  if (vehicleChart) vehicleChart.destroy();

  const palette = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  const ctx = canvas.getContext('2d');
  vehicleChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: palette.slice(0, labels.length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${App.formatCurrency(ctx.parsed)}`
          }
        }
      }
    }
  });
}

function renderDetailedReport(records, totalExpense) {
  const tbody = document.getElementById('detailedReportTbody');
  const footTotal = document.getElementById('reportFootTotal');

  footTotal.textContent = App.formatCurrency(totalExpense);

  if (!records || records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          No records match the current filter range.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  records.forEach(r => {
    html += `
      <tr>
        <td class="text-nowrap">${App.formatDate(r.service_date)}</td>
        <td class="fw-semibold">${r.vehicle_name}</td>
        <td class="font-monospace small">${r.registration_number}</td>
        <td><span class="badge bg-light text-dark border">${r.service_type}</span></td>
        <td>${App.formatNumber(r.odometer_reading)} km</td>
        <td>${r.service_center || '—'}</td>
        <td class="text-end fw-bold text-success">${App.formatCurrency(r.total_cost)}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}
