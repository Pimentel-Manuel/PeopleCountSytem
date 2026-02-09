let attendanceData = {};
let allDepartments = [];
let allLocations = [];
let selectedDepartment = null;
let currentView = 'employees'; // 'employees' | 'locations'
const today = "2026-01-28"; // Latest date in JSON

// Load merged data.json (keep your structured departments/locations/attendanceByDate)
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    // Expecting structured data with attendanceByDate, departments, locations
    attendanceData = data.attendanceByDate || {};
    allDepartments = (data.departments || []).map(d => d.name);
    allLocations = data.locations || [];
    initDashboard();
  });

function initDashboard() {
  // Toggle events
  document.getElementById('btnEmployees').addEventListener('click', () => {
    currentView = 'employees';
    renderView();
  });
  document.getElementById('btnLocations').addEventListener('click', () => {
    currentView = 'locations';
    renderView();
  });

  document.getElementById('summaryDate').textContent = today;

  // Choose an initial selected department with activity
  const currentData = attendanceData[today] || {};
  const firstWithIn = allDepartments.find(d => currentData[d]?.in > 0);
  selectedDepartment = firstWithIn || allDepartments[0] || null;

  renderView();
  startClock();
}

function renderView() {
  // Toggle button UI
  const btnEmp = document.getElementById('btnEmployees');
  const btnLoc = document.getElementById('btnLocations');
  btnEmp.classList.toggle('active', currentView === 'employees');
  btnLoc.classList.toggle('active', currentView === 'locations');

  // Containers
  const deptContainer = document.getElementById('deptCircleContainer');
  const locContainer = document.getElementById('locationContainer');
  const insertionPoint = document.getElementById('insertionPoint');

  // Clear all
  deptContainer.innerHTML = '';
  locContainer.innerHTML = '';
  insertionPoint.innerHTML = '';

  // Always render summary (single in-building summary)
  renderSummary();

  if (currentView === 'employees') {
    deptContainer.classList.remove('d-none');
    locContainer.classList.add('d-none');
    renderDepartments(deptContainer);
    if (selectedDepartment) {
      renderDepartmentLocationOverview(selectedDepartment, insertionPoint);
    }
  } else {
    deptContainer.classList.add('d-none');
    locContainer.classList.remove('d-none');
    renderLocationsOverviewAll(locContainer);
  }
}

function renderSummary() {
  const currentData = attendanceData[today] || {};
  const totalIn = Object.values(currentData).reduce((sum, d) => sum + (d?.in || 0), 0);
  document.getElementById('summaryTotal').textContent = totalIn;
}

function renderDepartments(container) {
  const currentData = attendanceData[today] || {};

  allDepartments.forEach((dept, index) => {
    const stats = currentData[dept] || { in: 0, locations: {} };
    const total = stats.in; // OUT is removed

    if (!total || total === 0) return; // Skip departments with no IN activity

    // Ensure at least 5 locations shown (fill with 0 if needed)
    const displayLocations = {};
    if (stats.locations) {
      Object.entries(stats.locations).forEach(([locId, count]) => {
        displayLocations[locId] = count;
      });
    }
    const targetCount = 5;
    let currentCount = Object.keys(displayLocations).length;
    if (currentCount < targetCount) {
      allLocations.forEach(loc => {
        if (currentCount >= targetCount) return;
        if (!displayLocations[loc.id]) {
          displayLocations[loc.id] = 0;
          currentCount++;
        }
      });
    }

    // Generate location breakdown HTML in two columns
    let locationHTML = '<div class="row mt-3 location-breakdown">';
    const locations = Object.entries(displayLocations);
    const mid = Math.ceil(locations.length / 2);
    const leftColumn = locations.slice(0, mid);
    const rightColumn = locations.slice(mid);

    // Left column
    locationHTML += '<div class="col-6 text-start px-2">';
    leftColumn.forEach(([locId, count]) => {
      const location = allLocations.find(l => l.id === locId);
      const locName = location ? location.name : locId;
      locationHTML += `<div style="font-size: 11px;" class="mb-1"><strong>${locName}:</strong> <span class="text-primary fw-bold">${count}</span></div>`;
    });
    locationHTML += '</div>';

    // Right column
    locationHTML += '<div class="col-6 text-start px-2">';
    rightColumn.forEach(([locId, count]) => {
      const location = allLocations.find(l => l.id === locId);
      const locName = location ? location.name : locId;
      locationHTML += `<div style="font-size: 11px;" class="mb-1"><strong>${locName}:</strong> <span class="text-primary fw-bold">${count}</span></div>`;
    });
    locationHTML += '</div>';
    locationHTML += '</div>';

    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3';

    const isSelected = (selectedDepartment === dept) || (!selectedDepartment && index === 0);
    if (!selectedDepartment && index === 0) selectedDepartment = dept;

    col.innerHTML = `
      <div class="card shadow-sm text-center p-3 h-100 bg-white border-0 dept-card ${isSelected ? 'selected-dept' : ''}" 
           data-dept="${dept}">
        <div class="small fw-bold text-primary text-uppercase mb-2">${dept}</div>
        <div class="small text-muted mb-2">Total In: ${stats.in}</div>
        
        <div class="chart-container position-relative mx-auto" style="width:110px; height:110px;">
          <canvas id="circle-${index}"></canvas>
          <div class="circle-text">
            <span class="fs-5 fw-bold d-block">${stats.in}</span>
            <small class="text-muted" style="font-size: 10px;">In</small>
          </div>
        </div>

        ${locationHTML}
      </div>
    `;
    container.appendChild(col);

    // Click to select department
    col.querySelector('.dept-card').addEventListener('click', () => {
      selectedDepartment = dept;
      document.querySelectorAll('.dept-card').forEach(card => card.classList.remove('selected-dept'));
      col.querySelector('.dept-card').classList.add('selected-dept');
      const insertionPoint = document.getElementById('insertionPoint');
      insertionPoint.innerHTML = '';
      renderDepartmentLocationOverview(dept, insertionPoint);
    });

    // Single-slice doughnut for IN only
    new Chart(document.getElementById(`circle-${index}`), {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [stats.in],
          backgroundColor: ['#22c55e'],
          borderWidth: 0,
          cutout: '75%'
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        maintainAspectRatio: false
      }
    });
  });
}

function renderDepartmentLocationOverview(dept, mountEl) {
  const currentData = attendanceData[today] || {};
  const deptStats = currentData[dept];

  if (!deptStats || !deptStats.locations) return;

  // Aggregate by location for selected department
  const locationTotals = {};
  Object.entries(deptStats.locations).forEach(([locId, count]) => {
    const location = allLocations.find(l => l.id === locId);
    if (location) {
      locationTotals[locId] = {
        name: location.name,
        floor: location.floor,
        count,
        employees: []
      };
      // Add employee names if available
      if (deptStats.employees && deptStats.employees[locId]) {
        locationTotals[locId].employees = deptStats.employees[locId];
      }
    }
  });

  const locationSection = document.createElement('div');
  locationSection.className = 'row g-3 mb-4 location-overview-section';
  locationSection.innerHTML = `<div class="col-12">
    <h5 class="text-muted fw-bold">📍 Location Overview - ${dept}</h5>
    <p class="text-muted small">Click a department card above to switch views</p>
  </div>`;

  Object.entries(locationTotals).forEach(([locId, data]) => {
    if (data.count > 0) {
      // Employee list
      let employeeList = '';
      if (Array.isArray(data.employees) && data.employees.length > 0) {
        employeeList = '<div class="mt-3"><div class="text-muted fw-bold mb-2" style="font-size: 11px;">Employees:</div>';
        data.employees.forEach(emp => {
          const initial = (emp?.name || '?').charAt(0);
          const roleOrDept = emp?.role || emp?.department || '';
          employeeList += `<div class="d-flex align-items-center mb-2">
              <div class="employee-avatar me-2">${initial}</div>
              <div class="text-start" style="font-size: 11px;">
                  <div class="fw-bold text-dark">${emp?.name || 'Unknown'}</div>
                  <div class="text-muted small">${roleOrDept}</div>
              </div>
          </div>`;
        });
        employeeList += '</div>';
      }

      const locCard = document.createElement('div');
      locCard.className = 'col-md-4 col-lg-3';
      locCard.innerHTML = `
        <div class="card shadow-sm h-100 bg-white border-0 location-card">
          <div class="card-body">
            <h6 class="card-title text-primary fw-bold">${data.name}</h6>
            <p class="text-muted small mb-2">${data.floor}</p>
            <div class="fs-3 fw-bold text-center my-3 text-primary">${data.count}</div>
            <div class="small text-center text-muted mb-3">Employees from ${dept}</div>
            ${employeeList}
          </div>
        </div>
      `;
      locationSection.appendChild(locCard);
    }
  });

  if (Object.keys(locationTotals).length > 0) {
    mountEl.appendChild(locationSection);
  }
}

function renderLocationsOverviewAll(container) {
  const currentData = attendanceData[today] || {};
  // Aggregate counts per location across all departments (IN only)
  const locationTotals = {}; // locId -> { name, floor, count }

  allLocations.forEach(loc => {
    locationTotals[loc.id] = { name: loc.name, floor: loc.floor, count: 0 };
  });

  Object.values(currentData).forEach(deptStats => {
    if (!deptStats?.locations) return;
    Object.entries(deptStats.locations).forEach(([locId, count]) => {
      if (locationTotals[locId]) {
        locationTotals[locId].count += (count || 0);
      }
    });
  });

  // Render only locations with at least 1 person inside
  Object.values(locationTotals)
    .filter(loc => loc.count > 0)
    .forEach(data => {
      const col = document.createElement('div');
      col.className = 'col-md-4 col-lg-3';
      col.innerHTML = `
        <div class="card shadow-sm h-100 bg-white border-0 location-card">
          <div class="card-body text-center">
            <h6 class="card-title text-primary fw-bold">${data.name}</h6>
            <p class="text-muted small mb-2">${data.floor}</p>
            <div class="display-6 fw-bold text-primary">${data.count}</div>
            <div class="small text-muted mt-2">Inside now</div>
          </div>
        </div>
      `;
      container.appendChild(col);
    });

  // If no one is inside any defined room, show an info card
  if (!container.children.length) {
    const col = document.createElement('div');
    col.className = 'col-12';
    col.innerHTML = `
      <div class="alert alert-info mb-0">
        No in-building presence recorded for defined rooms today (${today}).
      </div>
    `;
    container.appendChild(col);
  }
}

function startClock() {
  const tick = () => {
    const ts = new Date().toLocaleString();
    const liveEl = document.getElementById('dtLive');
    if (liveEl) liveEl.textContent = ts;
  };
  tick();
  setInterval(tick, 1000);
}