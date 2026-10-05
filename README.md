# FieldShift 360

**Season planning for smallholders in Godagari, Rajshahi (Barind Tract), Bangladesh.**
NASA Space Apps 2026, "Field Shift: Adapting Farms with NASA Data".

Each Rabi season a farmer has one question: *keep the same crop, keep it but change the timing, or move to a
different crop?* FieldShift 360 answers it from 25 seasons of NASA climate history, union-level soil, crop
needs and the farmer's own priorities. It also checks what the neighbours are planting (so everyone's harvest
doesn't hit the market in the same week), suggests the next crop in the rotation, and connects the farmer to
their union's sub-assistant agriculture officer (SAAO) and the upazila agriculture officer (UAO).

The app is bilingual (Bangla first, English toggle). Everything runs in the browser on dummy data; there is no
backend and no Python.

---

## Run

Needs Node 18 or newer.

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # engine tests (Node's built-in runner)
npm run build          # static site in dist/ (hash routing: works on Netlify, Vercel, GitHub Pages or any folder)
npm run build:single   # everything in one file: dist-single/index.html (open it straight from disk)
npm run preview        # serve dist/ locally
```

## Project name and branding: one place

The name, tagline, description, region and event line live in **`src/config/brand.js`**:

```js
export const PROJECT_NAME = 'FieldShift 360';
export const PROJECT_TAGLINE = { bn: '…', en: '…' };
export const PROJECT_DESCRIPTION = '…';
```

Everything reads from it: the logo wordmark, navbar, hero copy, login page, farmer and officer headers, footer,
the browser tab title, `<meta>` description and Open Graph tags (Vite fills `%PROJECT_NAME%` in `index.html` at
build time), and even the browser-storage key. Change it once, rebuild, and the whole app follows. If the name
has a space, the part after the last space is drawn in the accent colour in the logo.

## Images

The six supplied photos are in `src/assets/images/`, converted to WebP at 900 px and 1600 px widths (original
aspect ratios kept). `src/assets/images/index.js` exports them with their size, focal point and Bangla/English
alt text, and `src/components/Photo.jsx` renders them with `srcset`, `object-fit: cover` and the focal point,
lazy-loaded except the hero. No text is placed on top of a photo except where a soft gradient keeps it readable.

| Photo | Used in |
| --- | --- |
| `hero-aerial-dawn` (paddy fields and river at dawn) | Home hero |
| `drought-flood-split` (dry and flooded field) | Home "the weather has changed" section; planner step 2 (weather) |
| `land-parcels-aerial` (field plots from above) | Home "show us your field" section; My field page header; planner step 1 summary card |
| `seedlings-sunrise` (seedlings at sunrise) | Home recommendation section; farmer dashboard header; planner step 6 (next crop); Today alerts card |
| `satellite-patchwork` (satellite view of fields) | Home "where the data comes from" section background |
| `farmer-rice-field` (farmer in the paddy) | Home officer/community section; login page |

## Choosing a field on the map

`/farmer/farm` (and step 1 of the planner) has a working field picker (`src/components/LandPicker.jsx`):

- Search by village, union or sample farmer name, or type coordinates such as `24.47, 88.33`.
- Tap the map or drag the pin; "Pin to centre" and "My location" (browser geolocation) also work.
- Satellite or street map; the Godagari boundary is shown, and a pin outside it gets a warning.
- The nearest village and union are detected from the pin, and the union's soil is shown.
- Set field size (shortcuts for 10/33/66/100 decimal, shown in bigha too), last Rabi crop and water source.
- **This is my field** saves it. The farmer's union, soil, recommendation, price-drop check, officer lists and
  maps all update from the saved field. Undo is available.

All of this is dummy data stored in the browser (localStorage). **Restart the demo** in the footer or the
"More" menu clears it.

## Make the climate data real

The repo ships a **placeholder** climate file (synthetic, no trend, *not NASA data*). A red banner says so until it
is replaced. To load the real NASA POWER series:

```bash
npm run fetch:power                              # Godagari upazila centre, Oct 2000 to Dec 2025
npm run fetch:power -- --lat 24.47 --lon 88.40   # another point
npm run build                                    # every number recalculates from the real data
```

The script (`scripts/fetch-power.mjs`, plain Node, no login) downloads daily T2M_MAX, T2M_MIN and PRECTOTCORR and
writes `src/data/climate_godagari.json` with provenance marked REAL.

The older Python helpers in `pipeline/` (IMERG, SoilGrids, SRDI soil builder) are kept for reference only; the app
does not need them. Soil values stay marked "sample" until real SRDI figures are entered in
`src/data/soil_godagari.json`.

## Pages

| Area | Route | What it does |
| --- | --- | --- |
| Public | `/` | Hero with a live recommendation and the season ribbon in Bangla months; how it works; field picker; data sources; officer section |
| | `/login` | Pick a sample account (3 farmers, 4 union officers, 1 upazila officer). No OTP or password |
| Farmer | `/farmer` | Home: your next step, season ribbon, water today, price-drop risk, harvest countdown, tasks, alerts |
| | `/farmer/farm` | My field: map picker, plan and soil |
| | `/farmer/plan` | 7-step season plan: field, weather, soil, what matters to you, recommendation, next crop, price-drop check, confirm |
| | `/farmer/today` | Water advice in four colours, weather (live Open-Meteo or sample scenarios), field check |
| | `/farmer/doctor` | Leaf photo, top-3 guess (sample), send to the officer |
| | `/farmer/help` | Send a question or problem; officer replies and area advice |
| | `/farmer/harvest` | Harvest weeks, likely yield in maund, union harvest timing, record your harvest |
| Officer | `/officer` | Union overview: counts, area alerts, map, requests to look at first, tomato harvest by week |
| | `/officer/requests`, `/officer/requests/:id` | Requests inbox; reply, ask for photos, plan a visit, send up, mark resolved, next request |
| | `/officer/farmers`, `/officer/farmers/:id` | Farmer list with filters; each farmer's field, recommendation and past requests |
| | `/officer/map` | Map with layers: planned crops, open requests, problem clusters; map or satellite |
| | `/officer/alerts` | Problem clusters with editable advice to send; price-drop and dry-field alerts; what was sent up |
| | `/officer/planting` | Harvest by week per crop, tomato planting slots, land by crop, farmers not yet decided |
| | `/officer/supply` | Harvest timing by union (no buying, payments or price forecasts) |
| | `/officer/upazila` | Upazila officer: items sent up, union ranking, harvest curves, upazila-wide advice |

## What is real, rule-based, AI or sample

| Output | Label |
| --- | --- |
| Climate history and backtests | **REAL** after `npm run fetch:power` (placeholder before) |
| Soil profile | **Sample** until SRDI values are entered |
| Scores, Keep/Adjust/Shift, rotation, price-drop risk, water advice, harvest weeks | **Rule-based** (`src/engine/`) |
| Area problem clusters | **AI** (DBSCAN) on sample requests |
| Crop doctor | **Sample** (no trained model shipped) |
| Farmers, plans, requests, officers, prices, costs, normal supply | **Sample** (`src/data/demo.js`) |
| Today's weather | **REAL** from Open-Meteo when online, otherwise sample scenarios |

Crop thresholds in `src/engine/crops.js` are starting values for an agronomist or SAAO to check.

## 5-minute demo

1. **Home**: read the live recommendation and season ribbon, then **Work out my field**.
2. **My field**: search "Rishikul", drag the pin, set the size, **This is my field**. The union and soil change.
3. **Season plan**: weather then vs now, soil, choose **Earn more** (then **Use less water**, and watch the answer change).
4. **Recommendation**: open **Why?** for the score table. **Next crop**: the rotation on the Bangla-month ribbon.
5. **Price-drop check**: compare dates, then **Confirm**.
6. **Crop doctor**: try the sample, then **Send to my officer**.
7. **Officer view**: the new request is at the top; **Area alerts**: edit the advice, **Send to N farmers**, then **Tell the upazila officer**.
8. **Upazila office**: **Mark as seen**, check the union ranking, send upazila-wide advice.
9. Back to **Farmer, Help**: the advice has arrived (bell badge).

## Structure

```
src/config/brand.js   project name, tagline, description, region (the only place the name is written)
src/assets/images/    the six photos (WebP, 900w + 1600w) and index.js
src/engine/           climate, crops, decision, rotation, glut, harvest, water, cluster, world, dates, text (+ engine.test.js)
src/data/             climate_godagari.json, soil_godagari.json, demo.js (all dummy records)
src/store.jsx         app state (React context + reducer, saved to localStorage)
src/layouts/          PublicLayout, FarmerLayout, OfficerLayout
src/pages/            public/ (Home, Login), farmer/ (Dashboard, MyFarm, Plan + steps, Today, CropDoctor, Help, Harvest),
                      officer/ (Dashboard, Requests, RequestDetail, Farmers, AreaMap, Alerts, Planting, UpazilaSupply, shared)
src/components/       ui kit, Photo, LandPicker, MapView, SeasonRibbon, SupplyChart, Overlays (Why drawer, data info, toast), chrome, brand/
scripts/              fetch-power.mjs (NASA POWER download, Node)
```

Ready for a backend later: all reads go through `useStore()` and all changes are reducer actions
(`setField`, `confirmPlan`, `addRequest`, `updateRequest`, `addAdvisory`, `escalate`, `recordHarvest`, `reset`).
Swapping `src/data/demo.js` and the reducer's side effects for API calls does not touch the pages.

Stack: React 19, Vite 6, Tailwind CSS 4, React Router 7 (hash routing), Recharts, Leaflet / react-leaflet, lucide-react.

## Limitations

- All farmers, requests, prices and officers are dummy data; saved changes live only in this browser.
- Climate is a placeholder until `npm run fetch:power` is run with internet access to NASA POWER.
- Map tiles (OpenStreetMap, Esri satellite) and fonts need internet; without it the map is blank but pins and fields still work.
- Crop doctor shows a fixed sample result; no image model is shipped.
- Not built: OTP login, SMS/IVR, payments, marketplace, native apps, drawing field boundaries as polygons, ML yield prediction.
