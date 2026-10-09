EGG INC. VIRTUE FARM OPTIMIZER — PC EDITION

GET STARTED
1. Extract the entire ZIP.
2. Double-click Start-Virtue-Optimizer.cmd to open the app in your browser.
3. On Account, enter your Egg Inc. ID in the sidebar and press Enter, or use
   Load Farm to open a saved farm or JSON game backup. Load Plan in the page
   header restores a saved plan and opens its Purchase Timeline.
4. Continue to Virtue Farm to review upgrades, research, gear, fuel, and flights.
5. Continue to Planning to set your TE target, route, sleep hours, and missions.
   Review How It Works and its assumptions, then select Find Fastest Plan.

The local helper runs in the background for account loading and updates. No
visible command window needs to stay open. Opening the launcher again reuses
the running installation. For troubleshooting, run:
  Start-Virtue-Optimizer.cmd --console
Ctrl+C stops that diagnostic run. Background startup errors appear in a dialog.

You can also open index.html for offline use with manual inputs or JSON files.
No installation, admin rights, Python, or Node is required. Use current Edge
or Chrome. Account loading and updates require the CMD launcher.

INPUTS AND ACCOUNT LOADING
The app opens with an empty farm. Enable Edit Account Manually or Edit Farm
Manually to enter or correct values. Account holds permanent bonuses and TE
progress. Virtue Farm holds current upgrades, research, artifacts, fuel, and
flights. Planning holds the target, route, timing, sleep hours, and missions.

Account loading reads Egg Inc.'s unofficial backup endpoint through the local
helper. It makes no game changes. Review the backup timestamp. If an active
Virtue farm is found, loading refreshes its upgrades, gems, equipped gear, and
plan start time. Otherwise, account bonuses load while your starting farm and
start time are retained. Planning settings are retained in both cases.

Imported fields lock after loading; planning settings remain editable.
An active ULTRA Pro subscription sets Video Doubler to Active (2x). Other
subscription states keep your existing setting. Existing flight fuel has already
been deducted from tank stock. Pending TE is calculated from lifetime deliveries.
The sidebar remembers your Egg Inc. ID locally; saved farm files omit it.
Use JSON backup import or manual inputs if account loading is unavailable.

Game numbers accept scientific notation and case-sensitive suffixes:
  1q = 1e15; 1Q = 1e18.
Common Research shows each item's next and remaining cost at current discounts
and sale prices; the remaining cost excludes tier prerequisites.

TARGET AND ROUTES
Target Total Truth Eggs means claimed + pending TE across all five Virtues.
New targets default to claimed TE + 40, up to 490, until you enter your own.
Pending TE can be claimed at ascension and do not improve earnings during this
run. The plan ends when the target and required launches are complete.
Ascension and rebuilding afterward are outside its duration.

Automatically Determine Truth Egg Allocation lets the planner choose the TE
split. Uncheck it to enter optional minimum final totals per Virtue. These are
claimed + pending totals, not extra TE to earn. Rechecking retains your entries.

Automatic Planning compares routes, upgrade revisits, purchases, waits, and
weekly events within Maximum New Shifts. The default ceiling is 12; the planner
can finish with fewer. User Selected Sequence preserves your entered order,
up to 30 new shifts, and can finish early once the goal and missions are complete.

C = Curiosity: common research.
K = Kindness: vehicles and Hyperloop cars.
I = Integrity: habitats.
R = Resilience: silos.
H = Humility: artifact changes and ship launches.

A shift switches Virtues, resets gems, and spends Soul Eggs based on remaining
Soul Eggs and previous switches. The current Virtue is added to a custom
sequence when needed. The last C is delivery-only: research requires an earlier
C visit. A route with only one C uses its existing research. Other final visits
can include useful upgrades, gear changes, and required launches.

On research visits, earnings-first orders are compared with existing orders.
Inactive capacity, such as unused vehicle slots or extra train-car limits, can
wait until departure. Research needed to unlock earnings can still come earlier.
Each reordered plan pays its costs and obeys sleep, offline breaks, and sales.

SLEEP, WAITING, AND TIMEZONES
No Game Interactions During Sleep is checked for new farms and after Start from
Scratch. Sleep Start defaults to 23:00 and Wake Time to 07:00. Adjust these times
or uncheck the option. Loaded files retain saved sleep settings. Older files
without a schedule keep sleep disabled so their timelines can replay.

Purchases, shifts, gear changes, fuel setup, ship collection, and launches wait
until you are awake. Ship travel and ongoing fuel transfers continue. Earnings,
delivery, and farm-produced fuel continue while silos have coverage. Sleep uses
offline earnings even with Online Only selected. Refill silos before bed;
production pauses when coverage runs out and resumes at wake time.

Awake waits assume routine silo refills; these check-ins are not counted as
earning breaks. Maintain the selected Video Doubler. Automatic Online + Offline
compares online waits and offline breaks. Online Only uses online earnings
outside sleep, without a running-chicken bonus. Minimum Offline Break applies
to voluntary offline earning breaks, with a minimum of 1 minute.
Seconds per Switch and Seconds per Purchase account for interaction time.
Calibration multipliers adjust earnings and common-research costs.

Plan Start (PC Local Time) uses your PC clock. Sleep & Display Timezone controls
sleep hours and displayed plan dates; Automatic uses your PC timezone. Sleep
follows daylight saving changes. A target reached during covered sleep can be
claimed when you are awake.

Weekly events always use Pacific Time (America/Los_Angeles), following PST/PDT:
- Monday 09:00 to Tuesday 09:00: 2x earnings.
- Friday 09:00 to Saturday 09:00: common-research cost x0.30 (70% off).
Selecting another sleep/display timezone does not move the events.

SHIPS AND FUEL
Plan missions separately for H1 and H2, the first and second Humility visits.
The planner includes costs, fueling, existing flights, and three shared mission
slots. Non-Humility fuel is collected before each visit, or reserved early for
H2 when the route has no later refill visit. Follow the listed diversion,
transfer, and tank-limit steps. Full diversion produces fuel instead of gems
or delivered eggs. Humility fuel is produced during the visit alongside tank
transfers. Returns during sleep wait for collection while awake. All required
ships must launch; their final returns do not delay plan completion.
Mission rewards, future gear, and special duration events are excluded.
Planning shows required non-Humility tank space, including reserved H2 fuel.
Surplus starting fuel may need to be discarded to make room.

TIMELINE, SAVE, AND EXPORT
Purchase Timeline shows up to three complete plans with different shift counts,
ordered by finish time. The fastest found is selected first. Each choice has
its own summary, gear, Quick Guide, purchase details, and walkthrough export.
Other cards show the extra time and shift difference from the fastest plan.
Stop & Keep Best retains complete alternatives found before stopping.

Open a shift for grouped purchases, research level ranges in game order, and
wait durations and resume times. Sleep and empty-silo time are included. Short
online waits stay within purchase groups. Full Breakdown shows individual
actions; Expand All opens every layer. Summary rates are the highest modeled
rates reached in that visit, not averages. Shipping capacity can exceed actual
delivery: delivered eggs use the lower of laying and shipping capacity.
Rates are before fuel diversion and empty-silo pauses. Final delivered egg
rate shows the farm's rate at completion. Displayed plan dates include years.

Save Farm keeps the inputs from all three pages. Save Plan also keeps every
alternative and the selected timeline. Load Plan restores its inputs, selected
alternative, and Purchase Timeline after validating every alternative by replay.
Invalid files retain your current inputs and timeline. Load Farm also accepts
plan files. Export Walkthrough opens a PDF; use Save PDF or browser controls to save
or print it. Start from Scratch resets inputs and the timeline; Undo Reset
restores them during the current session. Exported files remain available.

Changing inputs requires a new search. Existing timelines use their saved
inputs. Verified results can be retained on identical reruns. An earnings-only
improvement to starting gear can propose an old purchase order, which must be
paid and replayed with the new gear. Other changes invalidate old candidates.
Start Next Ascension prepares a new farm at the prior finish time with no added
downtime; adjust the date/time if you ascend later.

MODEL AND SEARCH LIMITS
Delivered eggs are limited by the lower of laying and shipping capacity.
Earnings use delivery, egg value, and earnings bonuses. Fuel diversion reduces
the eggs available for delivery and income.

Habs are treated as full immediately. Below about 100 claimed TE, chicken fill
time can make predictions too optimistic. Epic Research, Colleggtibles, and
claimed TE are fixed inputs. Pending TE do not improve earnings. Lifetime
deliveries use at least the milestone implied by claimed TE.

Automatic gear uses owned Virtue artifacts and stones. Manual sets are used as
entered. Gear changes require Humility. Future finds and socketing/removal costs
are excluded. Equip the starting gear shown in the app before following a plan.
A fresh farm has the free Coop, Trike, and one silo. The planner can compare paid
silo upgrades on Resilience for sleep coverage and extra refill comfort.
Running-chicken bonuses, boosts, drones, gifts, and mission rewards are excluded.

The bounded search returns the fastest complete plans found within its time
budget, not a mathematically proven global optimum. A failed search does not
prove the goal impossible. Every displayed plan is replayed to verify
affordability, prerequisites, permissions, switch costs, sleep, fuel, launches,
and the TE target against the model. See the current AUDIT-v*.md for evidence
and model limits, and RELEASE-NOTES.md for release history.

UPDATES
Use Update App -> Update & Restart. Finish or stop searches and account imports
first. Downloads are verified; inputs, timeline, saved files, and browser
settings are preserved. The app reopens at the same local address. Failed
installation or startup restores the previous app. Published releases already
point to the public GitHub repository; no GitHub password or token is needed.
Public v0.x installations can update to v1.0 normally. If you use an early
internal build numbered above the current public release, extract the current
ZIP manually; automatic updates never downgrade. Direct index.html use remains
offline.

DATA AND DEVELOPMENT
Game data is pinned to Wasmegg commit:
  a089580df4cc6cce8a2f5a9a7dcf86583a2c216d
https://github.com/wasmegg-carpet/egg
The independent audit uses Wasmegg source commit:
  9c2c0e4e7e5ac8bbf179f423f9fdb9a960993e67
Third-party licenses and artwork credits are bundled with the app.

Developers use npm ci and npm run build to generate app.js and worker-source.js.
Run checks appropriate to the change. npm run package builds a verified ZIP;
Node and Python are development tools, not requirements for normal app use.
See README.md, AGENTS.md, and GitHub-Setup.md for development and release steps.
