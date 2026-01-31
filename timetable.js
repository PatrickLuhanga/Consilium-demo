// timetable.js

document.addEventListener('DOMContentLoaded', () => {
  renderGridBackground();
  loadEvents();
  window.addEventListener('resize', loadEvents); // keep alignment on resize

  const saveBtn = document.getElementById('btn-save-event');
  if (saveBtn) saveBtn.addEventListener('click', saveEvent);
});

// Builds the grid rows and hour columns
function renderGridBackground() {
  const container = document.getElementById('timetable-grid-background');
  if (!container) return;
  container.innerHTML = '';

  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  days.forEach(day => {
    const row = document.createElement('div');
    row.className = 'grid timetable-row border-b border-gray-100';

    let html = `<div class="flex items-center justify-center font-bold bg-gray-50 border-r border-gray-200 text-xs sticky left-0 z-10 shadow-sm text-gray-400">${day}</div>`;
    for (let i = 0; i < 17; i++) html += `<div class="border-r border-gray-100"></div>`;

    row.innerHTML = html;
    container.appendChild(row);
  });
}

function saveEvent() {
  const title = document.getElementById('evt-title').value;
  const dayIndex = parseInt(document.getElementById('evt-day').value);
  const type = document.getElementById('evt-type').value;
  const startHour = parseInt(document.getElementById('evt-start').value);
  const duration = parseInt(document.getElementById('evt-duration').value);

  if (!title) { alert('Please enter a title'); return; }

  // 1. GET CURRENT USER
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const userEmail = currentUser ? currentUser.email : "guest";

  // 2. SAVE WITH EMAIL TAG
  const newEvent = { 
      id: Date.now(), 
      userEmail: userEmail, // <--- Tagged!
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
  document.getElementById('evt-title').value = '';
  loadEvents();
}

function loadEvents() {
  const container = document.getElementById('events-container');
  const printable = document.getElementById('printable-timetable');
  if (!container || !printable) return;
  container.innerHTML = '';

  // 1. GET CURRENT USER
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const userEmail = currentUser ? currentUser.email : "guest";

  // Read layout values from CSS
  const styles = getComputedStyle(printable);
  const dayCol = parseFloat(styles.getPropertyValue('--day-col')) || 100;
  const hours = parseInt(styles.getPropertyValue('--hours-count')) || 17;
  const rowHeight = parseFloat(styles.getPropertyValue('--row-height')) || 96; // Updated default to match CSS

  const totalWidth = printable.getBoundingClientRect().width;
  const usable = Math.max(totalWidth - dayCol, 0);
  const cellWidth = usable / hours;

  const allEvents = JSON.parse(localStorage.getItem('consilium_events')) || [];
  
  // 2. FILTER EVENTS BY USER
  const userEvents = allEvents.filter(evt => evt.userEmail === userEmail);

  userEvents.forEach(evt => {
    const card = document.createElement('div');
    card.className = 'evt-card absolute rounded-md p-2 text-xs font-semibold shadow-sm border-l-4 overflow-hidden hover:shadow-md transition cursor-pointer flex flex-col justify-center pointer-events-auto';

    if (evt.type === 'blue') card.classList.add('bg-blue-50', 'text-blue-800', 'border-blue-600');
    else if (evt.type === 'green') card.classList.add('bg-green-50', 'text-green-800', 'border-green-600');
    else if (evt.type === 'gray') card.classList.add('bg-gray-50', 'text-gray-800', 'border-gray-500');
    else if (evt.type === 'red') card.classList.add('bg-red-50', 'text-red-800', 'border-red-600');

    const top = (evt.dayIndex - 1) * rowHeight + 4;
    const offset = Math.max(0, evt.startHour - 5); // grid starts at 05:00
    const left = dayCol + cellWidth * offset;
    const width = Math.max(28, cellWidth * evt.duration - 8);

    card.style.top = top + 'px';
    card.style.height = (rowHeight - 10) + 'px';
    card.style.left = left + 'px';
    card.style.width = width + 'px';

    card.innerHTML = `
      <div class="truncate font-bold text-sm">${escapeHtml(evt.title)}</div>
      <div class="opacity-75 truncate text-[10px]">${evt.startHour}:00 - ${evt.startHour + evt.duration}:00</div>
      <button onclick="deleteEvent(${evt.id})" class="absolute top-1 right-1 text-gray-400 hover:text-red-600 font-bold px-1 text-lg leading-none">×</button>
    `;

    container.appendChild(card);
  });
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