// Sample data: replace with your real data feed or fetch from API
const peopleData = [
  {"category":"in","accesslevel":"1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0","firstname":"Admin","lastname":"OJT","datename":"2026-02-02","location":"","internalnumber":"1042105364","lvlname":"Employee"},
  {"category":"in","accesslevel":"1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0","firstname":"Admin","lastname":"OJT","datename":"2026-02-03","location":"","internalnumber":"1042105364","lvlname":"Employee"},
  {"category":"in","accesslevel":"1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0","firstname":"ernie","lastname":"ernie","datename":"2026-01-28","location":"","internalnumber":"867613084","lvlname":"Employee"},
  {"category":"in","accesslevel":"1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0","firstname":"Jade","lastname":"Asuncion","datename":"2026-01-28","location":"","internalnumber":"1044132084","lvlname":"Employee"},
  {"category":"in","accesslevel":"1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0","firstname":"richelle","lastname":"barrientos","datename":"2026-01-28","location":"","internalnumber":"1045156484","lvlname":"Employee"},
  {"category":"in","accesslevel":"1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0","firstname":"JENNIFER","lastname":"TACALAN","datename":"2026-01-28","location":"","internalnumber":"3575575813","lvlname":"Employee"},
  {"category":"in","accesslevel":"2 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0","firstname":"Sample","lastname":"Visitor3","datename":"2026-01-28","location":"","internalnumber":"3644779886","lvlname":"Visitor"}
];

// Utility: normalize empty/whitespace locations so they still appear on the chart
function normalizeLocation(loc) {
  if (!loc || (typeof loc === 'string' && loc.trim() === '')) return 'Unassigned';
  return loc.trim();
}

// Aggregate counts by a field or a field-mapper function
function aggregateCounts(rows, fieldOrMapper) {
  const getKey = typeof fieldOrMapper === 'function' ? fieldOrMapper : (r) => r[fieldOrMapper];
  const counts = {};
  for (const r of rows) {
    const key = getKey(r);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

// Palette (expand as needed)
const PALETTE = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc948','#b07aa1','#ff9da7','#9c755f','#bab0ab'];
function pickColors(n) {
  const colors = [];
  for (let i = 0; i < n; i++) colors.push(PALETTE[i % PALETTE.length]);
  return colors;
}

// Prepare data
const groupCounts = aggregateCounts(peopleData, 'lvlname');             // e.g., Employee vs Visitor
const locationCounts = aggregateCounts(peopleData, (r) => normalizeLocation(r.location)); // e.g., Unassigned or actual locations

// Create charts
function createDonut(canvasId, labels, values, title) {
  const ctx = document.getElementById(canvasId);
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: pickColors(labels.length),
        borderColor: '#0f172a',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%', // donut thickness
      plugins: {
        legend: { position: 'bottom', labels: { color: '#e5e7eb' } },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw}`
          }
        },
        title: { display: false, text: title, color: '#e5e7eb' }
      }
    }
  });
}

// Instantiate
createDonut('groupDonut', Object.keys(groupCounts), Object.values(groupCounts), 'Per Group');
createDonut('locationDonut', Object.keys(locationCounts), Object.values(locationCounts), 'Per Location');
