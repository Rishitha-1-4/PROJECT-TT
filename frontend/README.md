# Frontend - Smart Vehicle Maintenance Platform

This directory contains all client-facing UI components, layouts, responsive stylesheets, and browser JavaScript scripts.

## Directory Structure

```text
frontend/
├── views/                    # HTML5 Views & Pages
│   ├── index.html            # Landing page (hero, features, workflow, footer)
│   ├── login.html            # Sign-in authentication form
│   ├── register.html         # User registration form
│   ├── dashboard.html        # Main dashboard with live KPI cards & Chart.js graph
│   ├── vehicles.html         # Multi-vehicle garage management & modal forms
│   ├── vehicle-details.html  # Vehicle health status assessment & history
│   ├── services.html         # Maintenance history, search & invoice details
│   ├── reminders.html        # Maintenance task reminders & status tabs
│   ├── problems.html         # Automotive problem knowledge base & safety alerts
│   ├── reports.html          # Financial analytics, Chart.js charts & printable reports
│   └── profile.html          # User profile settings & password changes
└── public/
    ├── css/
    │   └── style.css         # Automotive dark navy & blue theme + print media styles
    ├── js/
    │   ├── app-utils.js      # Shared toast notifications, modals & formatters
    │   ├── auth.js           # Client-side login & register validation logic
    │   ├── dashboard.js      # Dashboard data fetching & Chart.js rendering
    │   ├── vehicles.js       # Vehicle garage CRUD & modal operations
    │   ├── services.js       # Service history filtering, sorting & table rendering
    │   ├── reminders.js      # Task reminders, presets & email dispatch test
    │   ├── problems.js       # Knowledge base live search & category filters
    │   └── reports.js        # Analytics charts (bar + doughnut) & printable table
    └── images/               # Illustrations and static assets
```

## Key Technologies
- **HTML5 & CSS3:** Semantic markup and modern styling.
- **Bootstrap 5 & Bootstrap Icons:** Mobile-responsive grid, modals, navigation, and badges.
- **Chart.js:** Monthly spending bar charts and vehicle expense doughnut charts.
- **Vanilla JavaScript (ES6+):** Clean, lightweight client architecture without heavy framework overhead.
