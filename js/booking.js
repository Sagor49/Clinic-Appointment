/* =========================================================
   CarePoint Clinic — Booking form client-side validation
   No backend: on a valid submit we show a success summary.
   ========================================================= */
(function () {
  'use strict';

  var form = document.getElementById('bookingForm');
  var successBox = document.getElementById('successBox');
  var formCard = document.getElementById('formCard');

  // ---------- Data: doctors per department ----------
  var DOCTORS = {
    general:    ['Dr. Ayesha Rahman', 'Dr. Kamal Hossain'],
    dental:     ['Dr. Tanvir Hasan', 'Dr. Farhana Akter'],
    pediatrics: ['Dr. Nusrat Jahan', 'Dr. Imran Kabir'],
    cardiology: ['Dr. Mahbub Alam', 'Dr. Sharmin Sultana'],
    eye:        ['Dr. Rafiq Ahmed'],
    ortho:      ['Dr. Shahid Karim', 'Dr. Laila Noor']
  };

  // ---------- Helpers ----------
  var $ = function (id) { return document.getElementById(id); };

  // Parse "YYYY-MM-DD" as a LOCAL date (new Date("YYYY-MM-DD") would be UTC)
  function parseDate(str) {
    if (!str) return null;
    var p = str.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function toISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function ageOn(dob, onDate) {
    var age = onDate.getFullYear() - dob.getFullYear();
    var m = onDate.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && onDate.getDate() < dob.getDate())) age--;
    return age;
  }
  function radioValue(name) {
    var r = form.querySelector('input[name="' + name + '"]:checked');
    return r ? r.value : '';
  }

  // Limit the date pickers (UX help — JS rules below still enforce it)
  var maxBook = today(); maxBook.setDate(maxBook.getDate() + 60);
  $('apptDate').min = toISO(today());
  $('apptDate').max = toISO(maxBook);
  $('dob').max = toISO(today());

  // ---------- Show / clear an error next to its field ----------
  function setError(field, message) {
    var el = $(field + '-error');
    var input = $(field) || $(field + '-group');
    if (message) {
      el.textContent = message;
      el.classList.add('show');
      if (input) { input.classList.add('is-invalid'); input.classList.remove('is-valid'); input.setAttribute('aria-invalid', 'true'); }
    } else {
      el.textContent = '';
      el.classList.remove('show');
      if (input) { input.classList.remove('is-invalid'); input.removeAttribute('aria-invalid'); }
    }
    return !message;
  }
  function markValid(field) {
    var input = $(field);
    if (input && input.classList.contains('control') && input.value) input.classList.add('is-valid');
  }

  // ---------- Validation rules (one function per field) ----------
  var rules = {
    fullName: function () {
      var v = $('fullName').value.trim();
      if (!v) return 'Full name is required.';
      if (v.length < 3) return 'Name must be at least 3 characters.';
      if (v.length > 60) return 'Name must be 60 characters or fewer.';
      if (!/^[A-Za-z][A-Za-z .'-]*$/.test(v)) return 'Name can contain letters, spaces, dots, hyphens and apostrophes only.';
      return '';
    },

    email: function () {
      var v = $('email').value.trim();
      if (!v) return 'Email address is required.';
      // format: something@domain.tld
      if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v)) return 'Enter a valid email address, e.g. name@example.com.';
      return '';
    },

    // PATTERN RULE: Bangladeshi mobile number
    phone: function () {
      var v = $('phone').value.replace(/[\s-]/g, '');
      if (!v) return 'Mobile number is required.';
      if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(v)) return 'Enter a valid 11-digit mobile number starting with 013–019 (e.g. 01712345678).';
      return '';
    },

    dob: function () {
      var d = parseDate($('dob').value);
      if (!d) return 'Date of birth is required.';
      if (d > today()) return 'Date of birth cannot be in the future.';
      if (ageOn(d, today()) > 120) return 'Please enter a realistic date of birth.';
      return '';
    },

    gender: function () {
      return radioValue('gender') ? '' : 'Please select a gender.';
    },

    // CROSS-FIELD: Pediatrics is only for patients under 18
    department: function () {
      var v = $('department').value;
      if (!v) return 'Please select a department.';
      var dob = parseDate($('dob').value);
      if (v === 'pediatrics' && dob && ageOn(dob, parseDate($('apptDate').value) || today()) >= 18) {
        return 'Pediatrics is for patients under 18. Please choose another department.';
      }
      return '';
    },

    doctor: function () {
      return $('doctor').value ? '' : 'Please select a doctor.';
    },

    // CROSS-FIELD: appointment date must be after date of birth, not in the past, not a Friday
    apptDate: function () {
      var d = parseDate($('apptDate').value);
      if (!d) return 'Please choose an appointment date.';
      if (d < today()) return 'Appointment date cannot be in the past.';
      if (d > maxBook) return 'You can book at most 60 days in advance.';
      if (d.getDay() === 5) return 'The clinic is closed on Fridays. Please pick another day.';
      var dob = parseDate($('dob').value);
      if (dob && d <= dob) return 'Appointment date must be after the date of birth.';
      return '';
    },

    apptTime: function () {
      var v = $('apptTime').value;
      if (!v) return 'Please choose a preferred time.';
      if (v < '09:00' || v > '19:45') return 'Please choose a time between 9:00 AM and 7:45 PM.';
      // CROSS-FIELD: if booking for today, time must still be ahead
      var d = parseDate($('apptDate').value);
      if (d && d.getTime() === today().getTime()) {
        var now = new Date();
        var nowStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        if (v <= nowStr) return 'That time has already passed today. Choose a later time.';
      }
      return '';
    },

    visitType: function () {
      return radioValue('visitType') ? '' : 'Please select the visit type.';
    },

    // CROSS-FIELD: follow-up needs at least one previous visit
    prevVisits: function () {
      var raw = $('prevVisits').value;
      if (raw === '') return 'Enter 0 if this is your first visit.';
      var n = Number(raw);
      if (!Number.isInteger(n) || n < 0 || n > 100) return 'Enter a whole number between 0 and 100.';
      if (radioValue('visitType') === 'Follow-up' && n < 1) return 'A follow-up visit requires at least 1 previous visit.';
      return '';
    },

    // LENGTH RULE
    symptoms: function () {
      var v = $('symptoms').value.trim();
      if (!v) return 'Please describe the reason for your visit.';
      if (v.length < 10) return 'Please write at least 10 characters (' + v.length + ' so far).';
      return '';
    },

    reports: function () {
      var f = $('reports').files[0];
      if (!f) return ''; // optional
      if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) return 'Only PDF, JPG or PNG files are allowed.';
      if (f.size > 2 * 1024 * 1024) return 'File is too large (' + (f.size / 1048576).toFixed(1) + ' MB). Max 2 MB.';
      return '';
    },

    // STRENGTH / PATTERN RULE
    password: function () {
      var v = $('password').value;
      if (!v) return 'Password is required.';
      var missing = [];
      if (v.length < 8) missing.push('8+ characters');
      if (!/[A-Z]/.test(v)) missing.push('an uppercase letter');
      if (!/[a-z]/.test(v)) missing.push('a lowercase letter');
      if (!/\d/.test(v)) missing.push('a number');
      if (!/[^A-Za-z0-9]/.test(v)) missing.push('a symbol');
      return missing.length ? 'Password needs ' + missing.join(', ') + '.' : '';
    },

    // CROSS-FIELD: confirm password matches password
    confirmPassword: function () {
      var v = $('confirmPassword').value;
      if (!v) return 'Please confirm your password.';
      if (v !== $('password').value) return 'Passwords do not match.';
      return '';
    },

    terms: function () {
      return $('terms').checked ? '' : 'You must accept the terms to book an appointment.';
    }
  };

  // Fields whose result depends on another field → re-check when that field changes
  var dependents = {
    password:  ['confirmPassword'],
    dob:       ['apptDate', 'department'],
    apptDate:  ['apptTime', 'department'],
    visitType: ['prevVisits']
  };

  var touched = {};

  function validateField(name) {
    var ok = setError(name, rules[name]());
    if (ok) markValid(name);
    return ok;
  }
  function revalidateDependents(name) {
    (dependents[name] || []).forEach(function (dep) { if (touched[dep]) validateField(dep); });
  }

  // ---------- Live validation: on blur, then on every change once touched ----------
  Object.keys(rules).forEach(function (name) {
    var inputs = form.querySelectorAll('[name="' + name + '"]');
    inputs.forEach(function (input) {
      input.addEventListener('blur', function () { touched[name] = true; validateField(name); });
      var evt = (input.type === 'radio' || input.type === 'checkbox' || input.tagName === 'SELECT' || input.type === 'file' || input.type === 'date' || input.type === 'time') ? 'change' : 'input';
      input.addEventListener(evt, function () {
        if (evt === 'change') touched[name] = true;
        if (touched[name]) validateField(name);
        revalidateDependents(name);
      });
    });
  });

  // ---------- Department → Doctor dependent dropdown ----------
  var DEPT_INFO = {
    general:    { name: 'General Medicine', dur: '20 min', fee: '৳800' },
    dental:     { name: 'Dental Care',      dur: '30 min', fee: '৳1,000' },
    pediatrics: { name: 'Pediatrics',       dur: '15 min', fee: '৳700' },
    cardiology: { name: 'Cardiology',       dur: '30 min', fee: '৳1,500' },
    eye:        { name: 'Eye Care',         dur: '20 min', fee: '৳900' },
    ortho:      { name: 'Orthopedics',      dur: '25 min', fee: '৳1,200' }
  };
  // Doctors that have a photo in assets/images (others show initials)
  var PHOTOS = {
    'Dr. Ayesha Rahman': 'assets/images/dr-ayesha.jpg',
    'Dr. Tanvir Hasan':  'assets/images/dr-tanvir.jpg',
    'Dr. Nusrat Jahan':  'assets/images/dr-nusrat.jpg',
    'Dr. Mahbub Alam':   'assets/images/dr-mahbub.jpg'
  };

  function fillDoctors(dept) {
    var sel = $('doctor');
    sel.innerHTML = '';
    if (!dept) {
      sel.add(new Option('Select department first', ''));
      sel.disabled = true;
    } else {
      sel.add(new Option('Select doctor', ''));
      DOCTORS[dept].forEach(function (d) { sel.add(new Option(d, d)); });
      sel.disabled = false;
    }
    updatePreview();
  }

  // Sidebar card showing the chosen doctor
  function updatePreview() {
    var dept = $('department').value, doc = $('doctor').value, info = DEPT_INFO[dept];
    var img = $('pvImg'), ini = $('pvInitials'), empty = $('pvEmpty');
    if (!img) return;
    $('pvRole').textContent = info ? info.name : 'Your doctor';
    $('pvName').textContent = doc || (info ? 'Choose a doctor' : 'Not selected yet');
    $('pvDur').textContent = info ? info.dur : '—';
    $('pvFee').textContent = info ? info.fee : '—';
    img.hidden = ini.hidden = true; empty.hidden = false;
    if (doc && PHOTOS[doc]) {
      img.src = PHOTOS[doc]; img.alt = doc; img.hidden = false; empty.hidden = true;
    } else if (doc) {
      ini.textContent = doc.replace('Dr. ', '').split(' ').map(function (w) { return w[0]; }).join('');
      ini.hidden = false; empty.hidden = true;
    }
  }

  $('department').addEventListener('change', function () {
    fillDoctors(this.value);
    $('doctor').classList.remove('is-valid');
    if (touched.doctor) validateField('doctor');
  });
  $('doctor').addEventListener('change', updatePreview);

  // Pre-select department (and doctor) from the URL — links from Page 1 cards
  var params = new URLSearchParams(location.search);
  var qDept = params.get('dept'), qDoc = params.get('doctor');
  if (qDept && DOCTORS[qDept]) {
    $('department').value = qDept;
    fillDoctors(qDept);
    if (qDoc && DOCTORS[qDept].indexOf(qDoc) !== -1) { $('doctor').value = qDoc; updatePreview(); }
  }

  // ---------- Character counter ----------
  $('symptoms').addEventListener('input', function () {
    $('symptomsCount').textContent = this.value.length + ' / 500';
  });

  // ---------- Password strength meter (4 bars) ----------
  var HINT = '8+ characters with uppercase, lowercase, a number and a symbol';
  function updateMeter() {
    var v = $('password').value, score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    if (v && score === 0) score = 1;
    var colors = ['#dc2626', '#f59e0b', '#3b82f6', '#15803d'];
    var labels = ['Weak', 'Fair', 'Good', 'Strong'];
    form.querySelectorAll('.meter span').forEach(function (bar, i) {
      bar.style.background = i < score ? colors[score - 1] : '';
    });
    $('strengthText').textContent = v ? 'Strength: ' + labels[score - 1] : HINT;
  }
  $('password').addEventListener('input', updateMeter);

  // ---------- Progress sidebar ----------
  var stepFields = { 1: ['fullName', 'email', 'phone', 'dob', 'gender'],
                     2: ['department', 'doctor', 'apptDate', 'apptTime'],
                     3: ['visitType', 'prevVisits', 'symptoms', 'reports'],
                     4: ['password', 'confirmPassword', 'terms'] };
  var currentStep = 1;
  function updateProgress() {
    Object.keys(stepFields).forEach(function (step) {
      var li = document.querySelector('#progress li[data-step="' + step + '"]');
      var done = stepFields[step].every(function (f) { return !rules[f](); });
      li.classList.toggle('done', done);
      li.classList.toggle('current', +step === currentStep && !done);
    });
  }
  form.addEventListener('focusin', function (e) {
    var fs = e.target.closest('fieldset[data-step]');
    if (fs) { currentStep = +fs.dataset.step; updateProgress(); }
  });
  form.addEventListener('input', updateProgress);
  form.addEventListener('change', updateProgress);

  // ---------- Show / hide password ----------
  document.querySelectorAll('.toggle-pw').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = $(btn.dataset.target);
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = show ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });

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
    showSummary();
  });

  function showSummary() {
    var deptSel = $('department');
    var d = parseDate($('apptDate').value);
    var t = $('apptTime').value.split(':');
    var h = +t[0], ampm = h >= 12 ? 'PM' : 'AM';
    var file = $('reports').files[0];
    var rows = [
      ['Full Name', $('fullName').value.trim()],
      ['Email', $('email').value.trim()],
      ['Mobile', $('phone').value.trim()],
      ['Date of Birth', parseDate($('dob').value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
                        ' (age ' + ageOn(parseDate($('dob').value), today()) + ')'],
      ['Gender', radioValue('gender')],
      ['Department', deptSel.options[deptSel.selectedIndex].text],
      ['Doctor', $('doctor').value],
      ['Date', d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
      ['Time', ((h % 12) || 12) + ':' + t[1] + ' ' + ampm],
      ['Visit Type', radioValue('visitType')],
      ['Previous Visits', $('prevVisits').value],
      ['Reason / Symptoms', $('symptoms').value.trim(), true],
      ['Uploaded Report', file ? file.name + ' (' + Math.ceil(file.size / 1024) + ' KB)' : 'None'],
      ['SMS Reminder', $('smsReminder').checked ? 'Yes' : 'No'],
      ['Portal Password', 'Set (hidden for security)']
    ];

    // Build summary with textContent (safe — never inject user input as HTML)
    var body = $('summaryBody');
    body.innerHTML = '';
    rows.forEach(function (r) {
      var wrap = document.createElement('div');
      if (r[2]) wrap.className = 'wide';
      var dt = document.createElement('dt'); dt.textContent = r[0];
      var dd = document.createElement('dd'); dd.textContent = r[1];
      wrap.appendChild(dt); wrap.appendChild(dd); body.appendChild(wrap);
    });

    $('refNo').textContent = 'CP-' + Date.now().toString().slice(-6);
    formCard.classList.add('hidden');
    successBox.classList.add('show');
    successBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    successBox.focus({ preventScroll: true });
  }

  // ---------- Reset: clear values, errors, meter, doctor list ----------
  form.addEventListener('reset', function () {
    setTimeout(function () { // let the browser clear values first
      Object.keys(rules).forEach(function (name) {
        setError(name, '');
        var el = $(name); if (el) el.classList.remove('is-valid');
      });
      touched = {};
      fillDoctors('');
      $('symptomsCount').textContent = '0 / 500';
      updateMeter();
      currentStep = 1;
      updateProgress();
    }, 0);
  });

  $('newBooking').addEventListener('click', function () {
    form.reset();
    successBox.classList.remove('show');
    formCard.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
