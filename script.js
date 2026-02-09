let attendanceData = {};
let allDepartments = [];
const today = "2026-01-28"; // Latest date in JSON

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    attendanceData = data.attendanceByDate;
    allDepartments = data.departments.map(d => d.name);
    initDashboard();
  });

function initDashboard() {
    const currentData = attendanceData[today] || {};
    const container = document.getElementById('deptCircleContainer');
    
    // 1. Render Top Circular Department Graphs with In/Out
    allDepartments.forEach((dept, index) => {
        const stats = currentData[dept] || { in: 0, out: 0 };
        const total = stats.in + stats.out;
        
        if (total === 0) return; // Skip departments with no activity

        const col = document.createElement('div');
        col.className = 'col-md-3 col-lg-2';
        col.innerHTML = `
            <div class="card shadow-sm text-center p-3 h-100 bg-white border-0">
                <div class="small fw-bold text-muted text-uppercase mb-2">${dept}</div>
                <div class="chart-container position-relative mx-auto" style="width:110px; height:110px;">
                    <canvas id="circle-${index}"></canvas>
                    <div class="circle-text">
                        <span class="fs-5 fw-bold d-block">${stats.in}</span>
                        <small class="text-muted" style="font-size: 10px;">Employees</small>
                    </div>
                </div>
                <div class="mt-2 d-flex justify-content-around small">
                    <span class="text-success">● In: ${stats.in}</span>
                    <span class="text-danger">● Out: ${stats.out}</span>
                </div>
            </div>
        `;
        container.appendChild(col);

        // Individual Circular Headcount Chart - In/Out breakdown
        new Chart(document.getElementById(`circle-${index}`), {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [stats.in, stats.out || 1], // Default to 1 to show ring if 0
                    backgroundColor: ['#22c55e', '#f87171'],
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

    renderBottomAnalytics();
    startClock();
}

function renderBottomAnalytics() {
    const allDates = Object.keys(attendanceData).sort();
    const currentDayData = attendanceData[today];

    // Trend Chart (Line) - Visitor Load H  istory
    new Chart(document.getElementById('trendChart'), {
        type: 'line',
        data: {
            labels: allDates,
            datasets: [{
                label: 'Total In',
                data: allDates.map(date => {
                    const dateData = attendanceData[date];
                    return Object.values(dateData).reduce((sum, d) => sum + (d.in || 0), 0);
                }),
                borderColor: '#3b82f6',
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: { 
            plugins: { legend: { display: false } }, 
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Composition Chart (Pie) - Total by Department
    const deptComposition = {};
    Object.values(attendanceData).forEach(dateData => {
        Object.entries(dateData).forEach(([dept, stats]) => {
            deptComposition[dept] = (deptComposition[dept] || 0) + stats.in;
        });
    });

    const deptLabels = allDepartments.filter(d => deptComposition[d]);
    
    new Chart(document.getElementById('compositionChart'), {
        type: 'pie',
        data: {
            labels: deptLabels,
            datasets: [{
                data: deptLabels.map(d => deptComposition[d]),
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#6366f1', '#14b8a6']
            }]
        },
        options: { 
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 }, padding: 8 } } }, 
            maintainAspectRatio: false 
        }
    });

    // Daily Bar Chart - Headcount In
    new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: allDepartments.filter(d => currentDayData[d]),
            datasets: [{
                label: 'Headcount In',
                data: allDepartments.filter(d => currentDayData[d]).map(d => currentDayData[d].in || 0),
                backgroundColor: '#10b981'
            }]
        },
        options: { 
            plugins: { legend: { display: false } }, 
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Out Bar Chart - Headcount Out
    new Chart(document.getElementById('outBarChart'), {
        type: 'bar',
        data: {
            labels: allDepartments.filter(d => currentDayData[d]),
            datasets: [{
                label: 'Headcount Out',
                data: allDepartments.filter(d => currentDayData[d]).map(d => currentDayData[d].out || 0),
                backgroundColor: '#ef4444'
            }]
        },
        options: { 
            plugins: { legend: { display: false } }, 
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function startClock() {
    setInterval(() => {
        document.getElementById('dtLive').textContent = new Date().toLocaleString();
    }, 1000);
}