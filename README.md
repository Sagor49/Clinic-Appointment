# CarePoint Clinic — Appointment Booking System

Information System Design & Software Engineering Lab — two connected, responsive pages.
Plain HTML + CSS + JavaScript (no framework, no backend). Icons and fonts are stored locally in `assets/` so it works offline.

## How to run
Open `index.html` in a browser (or use VS Code **Live Server**).

## Files
| File | Purpose |
|---|---|
| `index.html` | Page 1: landing / home page |
| `book.html` | Page 2: appointment booking form |
| `css/style.css` | All styles and responsive breakpoints |
| `js/main.js` | Hamburger menu, sticky navbar, footer year |
| `js/booking.js` | Form validation, dependent dropdown, success summary |
| `assets/` | Local Bootstrap Icons + fonts (Fraunces, Plus Jakarta Sans) |

## Breakpoints
- **Desktop:** 1024px and up (full navbar, 3-column cards, sidebar beside the form)
- **Tablet:** 768px to 1023px (hamburger menu, 2-column cards, single-column form layout)
- **Mobile:** 767px and below (hamburger menu, 1-column layout, full-width buttons)

## Requirement checklist

### Page 1: `index.html`
1. **Navbar:** 5 links + "Book Appointment" (goes to Page 2). Becomes a hamburger menu below 1024px.
2. **Hero:** heading, description, **Book Now** (primary, filled) and **Learn More** (secondary, outlined).
3. **Cards:** 6 service cards + 3 doctor cards. Each has an icon, a title, a description and a button.
4. **Footer:** address, phone and email, opening hours, and 5 social icons.

### Page 2: `book.html`
1. **15 fields, 11 input types:** text, email, tel, date, time, number, select, radio, checkbox, textarea, file, password.
2. **Client-side validation:**
   - Required fields: all fields marked *
   - Email format: `name@domain.tld`
   - Pattern/length rules: BD mobile `01[3-9]XXXXXXXX`, name 3–60 letters, symptoms at least 10 characters, password strength (8+ characters, upper, lower, number, symbol), file type and size (PDF/JPG/PNG, max 2 MB)
   - Cross-field rules:
     - Confirm Password must match Password
     - Appointment date must be after date of birth
     - A follow-up visit needs at least 1 previous visit
     - Pediatrics is only for patients under 18
     - A time booked for today must still be in the future
     - No Friday bookings
3. **Error messages** appear under each field (not an alert box). Validation runs on blur and again while typing.
4. **Submit and Reset buttons.** A valid submit shows a success message with a reference number and a full summary of the entered data.

Extras: the Doctor dropdown depends on the chosen Department, `book.html?dept=dental` pre-selects the department from the Page 1 cards, a password strength meter, show/hide password, a character counter, and a progress sidebar.
