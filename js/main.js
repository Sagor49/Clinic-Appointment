/* Shared: navbar hamburger, sticky shadow, footer year */
(function () {
  'use strict';
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('navMenu');

  function setOpen(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  toggle.addEventListener('click', function () { setOpen(!menu.classList.contains('open')); });

  // Close after choosing a link, on Escape, on outside click, or when resized to desktop
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setOpen(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024) setOpen(false); });

  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Scroll-reveal animation (content is visible by default if JS/observer is unavailable)
  document.documentElement.classList.remove('no-js');
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 80 + 'ms';   // gentle stagger within rows
      io.observe(el);
    });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }
})();
