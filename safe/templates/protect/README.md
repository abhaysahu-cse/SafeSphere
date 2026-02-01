Table of contents

Purpose

Modules overview

Repository structure (protect folder)

Templates, static assets & naming conventions

Django integration — views & urls examples

How to add a new module (step-by-step)

Checklist & local behaviour (checklist, drill planner, localStorage)

Git workflow & safe merging (recommended)

Common problems & troubleshooting

Accessibility, translations & best practices

Deployment notes

Credits & sources

Purpose

The protect section provides modules to prepare, respond and recover for households, farms and communities (flood, cyclone, heatwave, drought, fire, earthquake, and training/drills). Each module is a self-contained page (no sidebar) that includes:

Ordered guidance (Before / During / After)

Posters, videos and images placeholders

Checklist modal (offline-first — localStorage)

Interactive pieces: drag/drop practice, drill planner, quiz

Printable templates

This README explains where everything lives and how to extend it safely.

Modules overview

(Current modules implemented or planned in this area)

Farmers

protect/farmers/flood.html (+ css/js pair)

protect/farmers/cyclone.html

protect/farmers/drought.html

protect/farmers/heatwave.html

protect/farmers/… (other livelihoods topics)

Households

protect/households/flood.html

protect/households/cyclone.html

protect/households/heatwave.html

protect/households/fire.html

protect/households/earthquake.html

Schools

protect/schools/drills.html

protect/schools/evacuation.html

protect/schools/audit.html

protect/schools/supplies.html

protect/schools/psychosocial.html

protect/schools/convert-to-shelter.html

Community

protect/community/shelters.html

protect/community/evacuation_routes.html

protect/community/seed_banks.html

protect/community/rescue_tools.html

protect/community/wash.html

protect/community/drills.html

Top-level

protect/index.html or protect/learn.html (overview / landing for Protect section)

protect/community.html, protect/farmers.html, protect/households.html, protect/schools.html (dashboard cards)

Repository structure (protect folder)

Example tree (only top-level / relevant files):

safe/templates/protect/
├── community/
│   ├── shelters.html
│   ├── evacuation.html
│   ├── seed_banks.html
│   ├── rescue_tools.html
│   ├── wash.html
│   └── drills.html
├── farmers/
│   ├── flood.html
│   ├── cyclone.html
│   ├── heatwave.html
│   └── drought.html
├── households/
│   ├── flood.html
│   ├── cyclone.html
│   ├── heatwave.html
│   ├── fire.html
│   └── earthquake.html
├── schools/
│   ├── drills.html
│   ├── evacuation.html
│   ├── audit.html
│   ├── supplies.html
│   └── convert_to_shelter.html
├── index.html
├── farmers.html
├── households.html
├── community.html
└── schools.html


Static assets (recommended organization):

safe/static/
├── css/
│   ├── protect-farmers-flood.css
│   ├── protect-households-flood.css
│   └── schools-drills.css
├── js/
│   ├── protect-farmers-flood.js
│   ├── protect-households-flood.js
│   └── schools-drills.js
├── image/
│   └── protect/
│       ├── farmers/
│       │   ├── flood_poster.jpg
│       │   └── news_1.jpg
│       ├── households/
│       └── schools/
└── video/
    └── schools/
        └── drill_demo.mp4


Important: Keep consistent folder names and lowercase filenames separated by hyphens. Example: protect-farmers-flood.js, protect-households-flood.css.

Templates, static assets & naming conventions

Templates use Django {% load static %} and refer to assets like:

<link rel="stylesheet" href="{% static 'css/protect-farmers-flood.css' %}">
<script src="{% static 'js/protect-farmers-flood.js' %}"></script>
<img src="{% static 'image/protect/farmers/flood_poster.jpg' %}">


Place module-specific CSS/JS in static/css/ and static/js/. Keep global styles in static/css/styles.css.

Use poster attributes on <video> for thumbnails.

Use progressive enhancement: pages render meaningful content even when JS/CSS fails (include <noscript> blocks).

Django integration — views.py and urls.py examples

views (safe/views.py) — simple function-based views:

from django.shortcuts import render

def protect_farmers_flood(request):
    return render(request, 'protect/farmers/flood.html')

def protect_households_flood(request):
    return render(request, 'protect/households/flood.html')

def protect_schools_drills(request):
    return render(request, 'protect/schools/drills.html')

# add functions for each module following the pattern


urls (safespera/urls.py or safe/urls.py):

from django.urls import path
from safe import views

urlpatterns = [
    path('protect/farmers/flood/', views.protect_farmers_flood, name='protect_farmers_flood'),
    path('protect/households/flood/', views.protect_households_flood, name='protect_households_flood'),
    path('protect/schools/drills/', views.protect_schools_drills, name='protect_schools_drills'),
    # ... other module routes
]


Sidebar / dashboard linking
Use the name from URL patterns to link (recommended):

<a href="{% url 'protect_farmers_flood' %}">Flood — Farmers</a>

How to add a new module (step-by-step)

Create branch

git checkout -b feature/protect-<module-name>


Add template

safe/templates/protect/<area>/<module>.html

Follow existing page layout: topbar, grid, main content, sidecard, checklist modal.

Add CSS & JS

static/css/protect-<area>-<module>.css

static/js/protect-<area>-<module>.js

Keep JS focused (checklist, localStorage keys unique).

Add static assets (images/videos) to static/image/protect/... and static/video/....

Add view & url

Add a function in safe/views.py and a URL entry.

Test locally

python manage.py runserver


Open the URL, verify checklist save, quiz, DnD, print.

Commit & push

git add .
git commit -m "protect: add <module> module (templates/css/js)"
git push origin feature/protect-<module-name>


Open PR, request review and resolve conflicts.

Checklist & local behaviour

Checklist modal uses localStorage keys. Use a unique key like:
safesphere_<area>_<module>_check_v1

Drill planner / quiz store progress using unique keys to avoid collisions.

When adding JS, expose minimal global functions (if needed) using a window. prefix documented in the JS file header.

Follow the same UI pattern: #checklistModal modal markup, .tabs-inner for checklist tabs, .checklist-content to inject HTML.

Git workflow & safe merging (recommended)

Because multiple developers work on main and feature branches, follow this process to avoid losing work:

Before pulling others' work

Commit all local changes.

Create a backup branch:

git checkout -b backup-before-merge
git push origin backup-before-merge


Fetch remote branches:

git fetch origin


To safely merge origin/module (example) into your main

git checkout main
git pull origin main          # ensure local main up-to-date
git fetch origin
git merge origin/module       # or git merge origin/module
# Resolve conflicts in the editor; when you see "Waiting for your editor to close the file..." ensure you save and exit the merge commit message editor.
git add <resolved-files>
git commit
git push origin main


If conflicts are risky, use a feature branch

git checkout -b merge-module-into-main
git merge origin/module
# fix conflicts
git commit
git push origin merge-module-into-main
# create PR to merge into main (preferred to allow review)


Alternative: rebase (careful with public branches)
If you prefer linear history:

git checkout feature-branch
git fetch origin
git rebase origin/main
# resolve conflicts, continue rebase
git push --force-with-lease


Important: coordinate with your teammate before force-pushing.

CRLF warning fix
If Git warns about CRLF/LF conversions, consider adding a .gitattributes to the repo root:

* text=auto
*.sh eol=lf
*.py eol=lf


This helps keep newline handling consistent across Windows/macOS/Linux.

Common problems & troubleshooting

CSS/JS not loading in template

Ensure {% load static %} present.

Check URLs physically by opening http://127.0.0.1:8000/static/css/... in browser.

Confirm STATICFILES_DIRS/STATIC_ROOT configured correctly.

File name mismatch

Filenames are case-sensitive on Linux servers; use kebab-case and consistent names.

Modal or JS functions undefined

Ensure the JS file is in static/js/ and the <script> tag uses {% static %} and loads after DOM or uses DOMContentLoaded.

Merge conflict 'editor waiting'

Git opened an editor for commit message. Save & close editor (in VSCode: close tab; in Vim: :wq) to continue.

Local changes lost after merge

If PUSH overwrote work, check backup-before-merge branch (we recommended creating it) or git reflog to find lost commits.

Accessibility, translations & best practices

Use semantic headings, ARIA attributes on modals and role="dialog", aria-labelledby.

All images must include alt text.

Provide transcripts/captions for videos — include a link to a .vtt file later.

For i18n: wrap user-facing strings with {% trans "..." %} when needed and run makemessages.

Make printable templates (clean page CSS @media print) for checklists and evacuation maps for offline distribution.

Deployment notes

Before deployment to production:

Run python manage.py collectstatic.

Minify CSS/JS (optional).

Ensure static file server (nginx) configured with /static/ path.

Test pages without dev server to ensure static resolved.

For low-bandwidth environments:

Use compressed images (webp/jpg) and short low-res MP4s.

Consider a lightweight fallback without video for mobile.

Example views.py block (copy/paste)
# safe/views.py

from django.shortcuts import render

# Farmers
def protect_farmers_flood(request):
    return render(request, 'protect/farmers/flood.html')

# Households
def protect_households_flood(request):
    return render(request, 'protect/households/flood.html')

# Schools
def protect_schools_drills(request):
    return render(request, 'protect/schools/drills.html')

# Community
def protect_community_shelters(request):
    return render(request, 'protect/community/shelters.html')

# ... add similar functions for each module

Contributing & adding content

Add textual content in the templates — keep content modular and consistent with the "Before/During/After" structure. Use headings and checklists.

Add images & posters to static/image/protect/<area>/. Use descriptive filenames like flood_poster_village1.jpg.

Add videos to static/video/ and use <video controls poster="{% static 'image/...' %}">.

Keep JS small and module-scoped; prefer storing all module JS in one file per module and use namespaced localStorage keys.

Credits & sources

This Protect section is assembled from project discussions and commonly accepted disaster preparedness practices. For later publication or official resources, cross-check with local NDMA, IFRC, UNESCO (Comprehensive School Safety) and Ministry of Education / Agriculture guidance for country-specific rules and contact numbers