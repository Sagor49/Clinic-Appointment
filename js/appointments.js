/* =========================================================
   CarePoint Clinic — My Appointments (appointments.html)
   Reads the bookings saved by book.html from localStorage,
   lets the user filter by doctor and cancel a booking.
   ========================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'carepoint.appointments';
  var $ = function (id) { return document.getElementById(id); };
  var list = $('apptList'), filter = $('doctorFilter');

  // ---------- Storage helpers ----------
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function save(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) { /* storage blocked */ }
  }

  // ---------- Format helpers ----------
  function parseDate(str) { var p = str.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function to12h(t) {
    var h = +t.split(':')[0], m = t.split(':')[1];
    return ((h % 12) || 12) + ':' + m + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function isPast(a) { return new Date(a.date + 'T' + a.time) < new Date(); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;   // textContent keeps user input safe
    return e;
  }

  // ---------- Doctor filter options (only doctors that have bookings) ----------
  function fillFilter(items) {
    var current = filter.value;
    var doctors = [];
    items.forEach(function (a) { if (doctors.indexOf(a.doctor) === -1) doctors.push(a.doctor); });
    doctors.sort();
    filter.length = 1;                                // keep "All doctors"
    doctors.forEach(function (d) {
      var n = items.filter(function (a) { return a.doctor === d; }).length;
      filter.add(new Option(d + ' (' + n + ')', d));
    });
    filter.value = doctors.indexOf(current) !== -1 ? current : '';
  }

  // ---------- Render the list ----------
  function render() {
    var all = load();
    fillFilter(all);

    var shown = all
      .filter(function (a) { return !filter.value || a.doctor === filter.value; })
      .sort(function (x, y) { return (x.date + x.time).localeCompare(y.date + y.time); });

    list.innerHTML = '';
    shown.forEach(function (a) {
      var d = parseDate(a.date), past = isPast(a);
      var li = el('li', 'appt' + (past ? ' is-past' : ''));

      var when = el('div', 'appt-date');
      when.appendChild(el('b', '', d.getDate()));
      when.appendChild(el('span', '', d.toLocaleDateString('en-GB', { month: 'short' })));

      var info = el('div', 'appt-info');
      var top = el('div', 'appt-top');
      top.appendChild(el('span', 'appt-ref', a.ref));
      top.appendChild(el('span', 'badge ' + (past ? 'badge-past' : 'badge-up'), past ? 'Completed' : 'Upcoming'));
      info.appendChild(top);
      info.appendChild(el('h3', '', a.name));
      var meta = el('p', 'appt-meta');
      meta.appendChild(el('span', '', a.doctor + ' · ' + a.dept));
      meta.appendChild(el('span', '', d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + ' at ' + to12h(a.time)));
      info.appendChild(meta);
      info.appendChild(el('p', 'appt-reason', a.reason));
      if (a.report) {
        var file = el('p', 'appt-file');
        file.innerHTML = '<i class="bi bi-paperclip"></i> ';
        file.appendChild(document.createTextNode(a.report));
        info.appendChild(file);
      }

      var btn = el('button', 'btn btn-ghost appt-cancel');
      btn.type = 'button';
      btn.innerHTML = '<i class="bi bi-x-lg"></i> ';
      btn.appendChild(document.createTextNode(past ? 'Remove' : 'Cancel'));
      btn.setAttribute('aria-label', (past ? 'Remove ' : 'Cancel ') + 'appointment ' + a.ref);
      btn.addEventListener('click', function () { removeAppt(a.ref, past); });

      li.appendChild(when); li.appendChild(info); li.appendChild(btn);
      list.appendChild(li);
    });

    // Count + empty state
    $('apptCount').textContent = all.length
      ? 'Showing ' + shown.length + ' of ' + all.length + ' appointment' + (all.length === 1 ? '' : 's')
      : '';
    $('apptEmpty').classList.toggle('hidden', shown.length > 0);
    $('emptyText').textContent = all.length
      ? 'This doctor has no appointments yet.'
      : 'When you book an appointment it will appear here.';
  }

  function removeAppt(ref, past) {
    var ok = window.confirm((past ? 'Remove' : 'Cancel') + ' appointment ' + ref + '?');
    if (!ok) return;
    save(load().filter(function (a) { return a.ref !== ref; }));
    render();
  }

  filter.addEventListener('change', render);
  window.addEventListener('storage', render);        // update if another tab books
  render();
})();
