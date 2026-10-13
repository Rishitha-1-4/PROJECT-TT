/**
 * Smart Vehicle Maintenance Platform - Problem Knowledge Base Client Script
 */

let allProblems = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = await App.initAuthHeader();
  if (!user) return;

  setupEventListeners();
  await loadProblems();
});

function setupEventListeners() {
  const searchInput = document.getElementById('problemSearchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const urgencyFilter = document.getElementById('urgencyFilter');

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadProblems(), 300);
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => loadProblems());
  }

  if (urgencyFilter) {
    urgencyFilter.addEventListener('change', () => loadProblems());
  }
}

async function loadProblems() {
  const query = document.getElementById('problemSearchInput')?.value || '';
  const category = document.getElementById('categoryFilter')?.value || 'all';
  const urgency = document.getElementById('urgencyFilter')?.value || 'all';

  const params = new URLSearchParams();
  if (query.trim()) params.append('q', query.trim());
  if (category && category !== 'all') params.append('category', category);
  if (urgency && urgency !== 'all') params.append('urgency', urgency);

  try {
    const res = await fetch(`/api/problems?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch knowledge base problems');

    const data = await res.json();
    allProblems = data.problems || [];

    // Populate category dropdown on first run
    populateCategoryDropdown(data.categories || []);

    document.getElementById('problemCountBadge').textContent = data.count || allProblems.length;
    renderProblems(allProblems);
  } catch (err) {
    console.error('Error fetching problems:', err);
    App.showToast('Could not load knowledge base', 'error');
  }
}

let categoryDropdownPopulated = false;
function populateCategoryDropdown(categories) {
  if (categoryDropdownPopulated || !categories || categories.length === 0) return;

  const select = document.getElementById('categoryFilter');
  if (!select) return;

  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
  categoryDropdownPopulated = true;
}

function renderProblems(problems) {
  const container = document.getElementById('problemsContainer');

  if (problems.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="card-custom p-5 text-center">
          <div class="empty-state-icon">
            <i class="bi bi-search"></i>
          </div>
          <h5 class="empty-state-title">No matching problems found</h5>
          <p class="empty-state-desc">Try modifying your search keywords or resetting the category and urgency filters.</p>
        </div>
      </div>
    `;
    return;
  }

  let html = '';
  problems.forEach(p => {
    const urgency = p.urgency ? p.urgency.toLowerCase() : 'medium';

    let urgencyColor = '#f59e0b';
    let urgencyBadge = '<span class="badge-status urgency-medium"><i class="bi bi-dash-circle-fill"></i> Medium Urgency</span>';

    if (urgency === 'critical') {
      urgencyColor = '#ef4444';
      urgencyBadge = '<span class="badge-status urgency-critical"><i class="bi bi-exclamation-octagon-fill"></i> Critical Urgency</span>';
    } else if (urgency === 'high') {
      urgencyColor = '#ea580c';
      urgencyBadge = '<span class="badge-status urgency-high"><i class="bi bi-exclamation-triangle-fill"></i> High Urgency</span>';
    } else if (urgency === 'low') {
      urgencyColor = '#10b981';
      urgencyBadge = '<span class="badge-status urgency-low"><i class="bi bi-check-circle-fill"></i> Low Urgency</span>';
    }

    html += `
      <div class="col-lg-6">
        <div class="problem-card">
          <div class="urgency-strip" style="background-color: ${urgencyColor};"></div>

          <div class="d-flex align-items-center justify-content-between mb-3">
            <span class="badge bg-light text-secondary border px-2 py-1">${p.category || 'General'}</span>
            ${urgencyBadge}
          </div>

          <h5 class="fw-bold text-navy-main mb-3">${p.title}</h5>

          <div class="mb-3">
            <div class="text-uppercase text-muted fw-bold small mb-1" style="font-size:0.75rem;">
              <i class="bi bi-activity text-primary me-1"></i> Common Symptoms
            </div>
            <p class="small text-dark mb-0">${p.symptoms}</p>
          </div>

          <div class="mb-3">
            <div class="text-uppercase text-muted fw-bold small mb-1" style="font-size:0.75rem;">
              <i class="bi bi-question-circle text-primary me-1"></i> Possible Causes
            </div>
            <p class="small text-muted mb-0">${p.possible_causes}</p>
          </div>

          <div class="mb-3 p-2 bg-light rounded small">
            <span class="text-muted fw-semibold">Affected Components:</span>
            <span class="text-dark fw-bold">${p.affected_components}</span>
          </div>

          <div class="mb-3">
            <div class="text-uppercase text-muted fw-bold small mb-1" style="font-size:0.75rem;">
              <i class="bi bi-lightbulb text-warning me-1"></i> Recommended Next Steps
            </div>
            <p class="small text-dark mb-0">${p.recommendations}</p>
          </div>

          <div class="p-3 rounded-3 mt-auto ${urgency === 'critical' ? 'bg-danger-subtle text-danger-emphasis' : 'bg-warning-subtle text-dark'} small">
            <div class="fw-bold mb-1">
              <i class="bi bi-wrench-adjustable me-1"></i> When to Consult a Mechanic:
            </div>
            <div>${p.consult_mechanic_note}</div>
          </div>

          <div class="mt-3 pt-3 border-top text-end">
            <a href="/services.html?action=new" class="btn btn-sm btn-outline-custom">
              <i class="bi bi-plus-lg me-1"></i> Schedule Service for this Issue
            </a>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
