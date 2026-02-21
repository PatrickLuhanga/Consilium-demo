document.addEventListener('DOMContentLoaded', () => {
  renderGridBackground();
  loadEvents();
  window.addEventListener('resize', loadEvents); 

  const saveBtn = document.getElementById('btn-save-event');
  if (saveBtn) saveBtn.addEventListener('click', saveEvent);
});

function renderGridBackground() {
  const container = document.getElementById('timetable-grid-background');
  if (!container) return;
  container.innerHTML = '';

  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  days.forEach(day => {
    const row = document.createElement('div');
    row.className = 'timetable-row border-b border-gray-100';

    let html = `<div class="flex items-center justify-center font-bold bg-slate-50 border-r border-slate-200 text-xs sticky left-0 z-10 shadow-sm text-slate-400">${day}</div>`;
    for (let i = 0; i < 16; i++) html += `<div class="border-r border-slate-100"></div>`;

    row.innerHTML = html;
    container.appendChild(row);
  });
}

function saveEvent() {
  const code = document.getElementById('evt-code').value.toUpperCase();
  const title = document.getElementById('evt-title').value;
  const dayIndex = parseInt(document.getElementById('evt-day').value);
  const type = document.getElementById('evt-type').value;
  const startHour = parseInt(document.getElementById('evt-start').value);
  const duration = parseInt(document.getElementById('evt-duration').value);

  if (!code) { alert('Please enter a Module Code (e.g. IPRT301)'); return; }
  if (!title) { alert('Please enter a Description'); return; }

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const userEmail = currentUser ? currentUser.email : "guest";

  const newEvent = { 
      id: Date.now(), 
      userEmail: userEmail,
      code,      
      title,     
      dayIndex, 
      type, 
      startHour, 
      duration 
  };

  let events = JSON.parse(localStorage.getItem('consilium_events')) || [];
  events.push(newEvent);
  localStorage.setItem('consilium_events', JSON.stringify(events));

  document.getElementById('add-event-modal').classList.add('hidden');
  document.getElementById('evt-code').value = '';
  document.getElementById('evt-title').value = '';
  loadEvents();
}

function loadEvents() {
  const container = document.getElementById('events-container');
  if (!container) return;
  container.innerHTML = '';

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const userEmail = currentUser ? currentUser.email : "guest";
  const allEvents = JSON.parse(localStorage.getItem('consilium_events')) || [];
  
  const userEvents = allEvents.filter(evt => evt.userEmail === userEmail);

  userEvents.forEach(evt => {
    const card = document.createElement('div');
    
    card.className = 'evt-card absolute rounded-md p-1 text-center shadow-sm border-l-4 overflow-hidden hover:shadow-md transition cursor-pointer flex flex-col justify-center items-center pointer-events-auto leading-tight';

    if (evt.type === 'blue') card.classList.add('bg-blue-50', 'text-blue-900', 'border-blue-600');
    else if (evt.type === 'green') card.classList.add('bg-green-50', 'text-green-900', 'border-green-600');
    else if (evt.type === 'gray') card.classList.add('bg-slate-100', 'text-slate-800', 'border-slate-500');
    else if (evt.type === 'red') card.classList.add('bg-red-50', 'text-red-900', 'border-red-600');

    const startOffset = Math.max(0, evt.startHour - 5);
    const hoursCount = 16; 

    // --- THE HARDEST LOGIC: RESPONSIVE POSITIONING ---
    // Instead of fixed pixels, we use CSS calc() and variables defined in the HTML stylesheet.
    // This allows the browser to dynamically recalculate the size and position of the event 
    // cards instantly whenever the screen resizes or switches to Print mode.
    
    // LEFT: Day Column Width + (Remaining Grid Width * (Start Hour / 16 total hours))
    card.style.left = `calc(var(--day-col-width) + ((100% - var(--day-col-width)) * (${startOffset} / ${hoursCount})))`;
    
    // WIDTH: (Remaining Grid Width * (Duration / 16 total hours)) - 4px (to leave a tiny visual gap between adjacent classes)
    card.style.width = `calc(((100% - var(--day-col-width)) * (${evt.duration} / ${hoursCount})) - 4px)`;
    
    // TOP & HEIGHT: Based purely on the CSS row-height variable so cards always snap perfectly to the background grid lines.
    card.style.top = `calc((var(--row-height) * ${evt.dayIndex - 1}) + 4px)`;
    card.style.height = `calc(var(--row-height) - 8px)`;

    card.innerHTML = `
      <div class="font-black text-xs sm:text-sm uppercase tracking-tight">${escapeHtml(evt.code)}</div>
      <button onclick="deleteEvent(${evt.id})" class="absolute top-0 right-1 text-black/20 hover:text-red-600 font-bold px-1 text-base leading-none">&times;</button>
    `;

    container.appendChild(card);
  });

  renderLegend(userEvents);
}

function renderLegend(events) {
    const legendContainer = document.getElementById('legend-container');
    const legendGrid = document.getElementById('legend-grid');
    
    if (!events || events.length === 0) {
        if(legendContainer) legendContainer.classList.add('hidden');
        return;
    }

    const uniqueMap = {};
    events.forEach(e => {
        if(e.code) uniqueMap[e.code] = e.title;
    });

    if(legendGrid) {
        legendGrid.innerHTML = '';
        Object.keys(uniqueMap).forEach(code => {
            const item = document.createElement('div');
            item.className = "flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100";
            item.innerHTML = `
                <span class="bg-indigo-100 text-indigo-800 text-xs font-black px-2 py-1 rounded uppercase min-w-[60px] text-center">${escapeHtml(code)}</span>
                <span class="text-sm text-slate-700 font-medium truncate">${escapeHtml(uniqueMap[code])}</span>
            `;
            legendGrid.appendChild(item);
        });
    }

    if(legendContainer) legendContainer.classList.remove('hidden');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s]);
}

window.deleteEvent = function (id) {
  if (!confirm('Remove this class?')) return;
  let events = JSON.parse(localStorage.getItem('consilium_events')) || [];
  events = events.filter(e => e.id !== id);
  localStorage.setItem('consilium_events', JSON.stringify(events));
  loadEvents();
};