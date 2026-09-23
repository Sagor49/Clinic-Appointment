/* =========================================================
   CarePoint Clinic — Booking form (book.html)
   - Client-side validation with an error next to each field
   - On a valid submit: save to localStorage + show a summary
   No backend is used.
   ========================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'carepoint.appointments';

  var form = document.getElementById('bookingForm');
  var formCard = document.getElementById('formCard');
  var successBox = document.getElementById('successBox');
  var $ = function (id) { return document.getElementById(id); };

  // ---------- Helpers ----------
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function parseDate(str) {               // "YYYY-MM-DD" → local Date
    if (!str) return null;
    var p = str.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function toISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function radioValue(name) {
    var r = form.querySelector('input[name="' + name + '"]:checked');
    return r ? r.value : '';
  }
  function selectedDept() {
    var opt = $('doctor').selectedOptions[0];
    return opt ? opt.getAttribute('data-dept') || '' : '';
  }
  function fileLabel(f) {                 // "report.pdf (120 KB)" or ''
    return f ? f.name + ' (' + Math.ceil(f.size / 1024) + ' KB)' : '';
  }
  function to12h(t) {                     // "14:30" → "2:30 PM"
    var h = +t.split(':')[0], m = t.split(':')[1];
    return ((h % 12) || 12) + ':' + m + ' ' + (h >= 12 ? 'PM' : 'AM');
  }

  // ---------- Time slots: 9:00 AM – 7:30 PM, every 30 minutes ----------
  for (var h = 9; h < 20; h++) {
    ['00', '30'].forEach(function (m) {
      var v = String(h).padStart(2, '0') + ':' + m;
      $('apptTime').add(new Option(to12h(v), v));
    });
  }

  // Date picker can't go into the past
  $('apptDate').min = toISO(today());

  // ---------- Show / clear an error next to its field ----------
  function setError(field, message) {
    var box = $(field + '-error');
    var input = $(field) || $(field + '-group');
    box.textContent = message;
    box.classList.toggle('show', !!message);
    input.classList.toggle('is-invalid', !!message);
    input.classList.toggle('is-valid', !message && input.classList.contains('control') && !!input.value);
    return !message;
  }

  // ---------- Validation rules (return '' when valid) ----------
  var rules = {
    // required + length rule
    fullName: function () {
      var v = $('fullName').value.trim();
      if (!v) return 'Full name is required.';
      if (v.length < 3) return 'Name must be at least 3 characters.';
      if (!/^[A-Za-z][A-Za-z .'-]*$/.test(v)) return 'Name can contain letters, spaces, dots and hyphens only.';
      return '';
    },

    // email format
    email: function () {
      var v = $('email').value.trim();
      if (!v) return 'Email address is required.';
      if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v)) return 'Enter a valid email, e.g. name@example.com.';
      return '';
    },

    // PATTERN rule: Bangladeshi mobile number
    phone: function () {
      var v = $('phone').value.replace(/[\s-]/g, '');
      if (!v) return 'Mobile number is required.';
      if (!/^01[3-9]\d{8}$/.test(v)) return 'Enter an 11-digit number starting with 013–019, e.g. 01712345678.';
      return '';
    },

    age: function () {
      var raw = $('age').value;
      if (raw === '') return 'Age is required.';
      var n = Number(raw);
      if (!Number.isInteger(n) || n < 0 || n > 120) return 'Enter a whole number between 0 and 120.';
      return '';
    },

    gender: function () {
      return radioValue('gender') ? '' : 'Please select a gender.';
    },

    // CROSS-FIELD rule: Pediatrics doctors only see patients under 18
    doctor: function () {
      if (!$('doctor').value) return 'Please select a doctor.';
      var age = Number($('age').value);
      if (selectedDept() === 'Pediatrics' && $('age').value !== '' && age >= 18) {
        return 'Pediatrics is for patients under 18. Please choose another doctor.';
      }
      return '';
    },

    apptDate: function () {
      var d = parseDate($('apptDate').value);
      if (!d) return 'Please choose a date.';
      if (d < today()) return 'The date cannot be in the past.';
      if (d.getDay() === 5) return 'The clinic is closed on Fridays. Please pick another day.';
      return '';
    },

    // CROSS-FIELD rule: a time booked for today must still be ahead
    apptTime: function () {
      var t = $('apptTime').value;
      if (!t) return 'Please choose a time.';
      var d = parseDate($('apptDate').value);
      if (d && d.getTime() === today().getTime()) {
        var now = new Date();
        var nowStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        if (t <= nowStr) return 'That time has already passed today. Choose a later time.';
      }
      return '';
    },

    // LENGTH rule
    reason: function () {
      var v = $('reason').value.trim();
      if (!v) return 'Please tell us the reason for your visit.';
      if (v.length < 10) return 'Please write at least 10 characters (' + v.length + ' so far).';
      return '';
    },

    // Optional file: only PDF / JPG / PNG up to 2 MB
    reports: function () {
      var f = $('reports').files[0];
      if (!f) return '';
      if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) return 'Only PDF, JPG or PNG files are allowed.';
      if (f.size > 2 * 1024 * 1024) return 'File is too large (' + (f.size / 1048576).toFixed(1) + ' MB). Maximum is 2 MB.';
      return '';
    },

    terms: function () {
      return $('terms').checked ? '' : 'You must accept the terms to book.';
    }
  };

  // When one field changes, re-check the fields that depend on it
  var dependents = { age: ['doctor'], apptDate: ['apptTime'] };
  var touched = {};

  function validateField(name) { return setError(name, rules[name]()); }

  // ---------- Live validation: after leaving a field, then while typing ----------
  Object.keys(rules).forEach(function (name) {
    form.querySelectorAll('[name="' + name + '"]').forEach(function (input) {
      var typing = input.matches('input[type=text], input[type=email], input[type=tel], input[type=number], textarea');
      input.addEventListener('blur', function () { touched[name] = true; validateField(name); });
      input.addEventListener(typing ? 'input' : 'change', function () {
        if (!typing) touched[name] = true;
        if (touched[name]) validateField(name);
        (dependents[name] || []).forEach(function (dep) { if (touched[dep]) validateField(dep); });
      });
    });
  });

  $('reason').addEventListener('input', function () { $('reasonCount').textContent = this.value.length + ' / 300'; });

  // ---------- Pre-select a doctor from the URL (links on the home page) ----------
  var params = new URLSearchParams(location.search);
  var DEPT_FROM_URL = { general: 'General Medicine', dental: 'Dental Care', pediatrics: 'Pediatrics', cardiology: 'Cardiology', eye: 'Eye Care', ortho: 'Orthopedics' };
  if (params.get('doctor')) {
    $('doctor').value = params.get('doctor');   // unknown name → stays on "Select a doctor"
  } else if (DEPT_FROM_URL[params.get('dept')]) {
    var first = $('doctor').querySelector('option[data-dept="' + DEPT_FROM_URL[params.get('dept')] + '"]');
    if (first) $('doctor').value = first.value;
  }

  // ---------- Save to localStorage ----------
  function saveAppointment(appt) {
    try {
      var list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      list.push(appt);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;                        // private mode / storage blocked
    }
  }

  // ---------- Submit ----------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      touched[name] = true;
      if (!validateField(name) && !firstInvalid) firstInvalid = name;
    });
    if (firstInvalid) {
      var target = $(firstInvalid) || form.querySelector('[name="' + firstInvalid + '"]');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus({ preventScroll: true });
      return;
    }

    var appt = {
      ref: 'CP-' + Date.now().toString().slice(-6),
      name: $('fullName').value.trim(),
      email: $('email').value.trim(),
      phone: $('phone').value.trim(),
      age: Number($('age').value),
      gender: radioValue('gender'),
      doctor: $('doctor').value,
      dept: selectedDept(),
      date: $('apptDate').value,
      time: $('apptTime').value,
      reason: $('reason').value.trim(),
      report: fileLabel($('reports').files[0]),   // only the file name + size is saved, not the file itself
      createdAt: new Date().toISOString()
    };
    showSummary(appt, saveAppointment(appt));
  });

  function showSummary(a, saved) {
    var rows = [
      ['Full Name', a.name], ['Email', a.email], ['Mobile', a.phone], ['Age', a.age],
      ['Gender', a.gender], ['Doctor', a.doctor + ' (' + a.dept + ')'],
      ['Date', parseDate(a.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
      ['Time', to12h(a.time)], ['Reason for Visit', a.reason, true],
      ['Uploaded Report', a.report || 'None', true]
    ];
    var body = $('summaryBody');
    body.innerHTML = '';
    rows.forEach(function (r) {            // textContent keeps user input safe
      var wrap = document.createElement('div');
      if (r[2]) wrap.className = 'wide';
      var dt = document.createElement('dt'); dt.textContent = r[0];
      var dd = document.createElement('dd'); dd.textContent = r[1];
      wrap.appendChild(dt); wrap.appendChild(dd); body.appendChild(wrap);
    });
    $('refNo').textContent = a.ref + (saved ? '' : ' (not saved — browser storage is blocked)');

    formCard.classList.add('hidden');
    successBox.classList.add('show');
    successBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    successBox.focus({ preventScroll: true });
  }

  // ---------- Reset: clear values and all error messages ----------
  form.addEventListener('reset', function () {
    setTimeout(function () {               // wait for the browser to clear values
      Object.keys(rules).forEach(function (name) { setError(name, ''); });
      touched = {};
      $('reasonCount').textContent = '0 / 300';
    }, 0);
  });

  $('newBooking').addEventListener('click', function () {
    form.reset();
    successBox.classList.remove('show');
    formCard.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
