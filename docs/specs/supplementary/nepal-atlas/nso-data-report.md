# NSO Data Report — Spec for the Nepal Atlas

**Status:** Draft for review, 2026-10-30. Not committed to any repository.
**Purpose:** Decide what Nepal Statistics Office (NSO) data can feed the
Nepal Atlas, in what form, and how to archive it reliably — without
building a PDF-transcription pipeline first, and without building the
atlas on a source that disappears.
**Atlas reference:** `docs/specs/games/nepal-atlas.md` in
`anuragsubedi/panipuri-minigames`, read directly from that repository
on 2026-10-30. That atlas spec is proposed, rank 2/8. Its v0.1 is
Political + Physical + Rivers & lakes; v0.2 adds People, Forests &
parks, Nepali toggle and quiz link; v0.3 adds Climate, Economy and
Farming.

## 1. Institutional context

The National Statistics Office (NSO) is an office of the Government of
Nepal, under the Office of the Prime Minister and Council of Ministers,
based at Thapathali, Kathmandu. Its website is https://nsonepal.gov.np/
and its contact address as listed on the National Data Portal is
info@cbs.gov.np, reflecting the former Central Bureau of Statistics
name still used in that portal's footer.

A named institutional lead for this work is Dhundi Raj Lamichhane,
Deputy Chief Statistician at the National Statistics Office. He is
named in the Nepal Statistical Year Book 2025 preface among the Deputy
Chief Statisticians thanked for guidance and supervision in data
collection, management and preparation of that edition. He is also the
lead identified for the Nepal Atlas project: he is from the atlas
author's hometown and is connected to the author's family on Facebook.
That connection is recorded here only at the professional level —
name, role and project relevance — with no personal details.

The lead matters for three practical reasons, not as a shortcut around
verification: (a) clarifying redistribution terms for NSO data before
any public archive is published; (b) confirming which portal or
release is the canonical source when a portal is down or a file is
only available as a PDF; and (c) confirming geographic definitions
and code mappings when a table uses names without codes.

## 2. Work plan — status at 2026-10-30

- Done: main NSO site scouted in English, step by step.
- Done: Nepal Atlas spec read directly from its repository.
- Done: National Data Portal (nationaldata.gov.np) scouted in depth.
- Done: write-access test to panipuri-minigames on a non-live branch
  (`musa-koala`, README dummy line only; the `live` branch unchanged).
- Failed, with a correction recorded in section 5: the NSO Data Portal
  at http://113.199.192.53:82/ refused to connect from a cloud browser
  and from a manual browser takeover, with a generic "can't be reached"
  message in both cases.
- Pending: a local-machine test of that IP portal (local Chromium or
  headless), or manual download of its files as a fallback.
- Pending: full inventory and tagging of promising datasets by
  geographic level and format.
- Pending: licence / redistribution check before republishing any
  NSO data.
- Pending: decision on the archive home — fresh GitHub repository,
  Kaggle mirror, or both.
- Pending: decision on where this spec itself should live, if anywhere
  in panipuri-minigames, and on which branch. No push to `live` is
  authorised by this document alone.

## 3. What the main NSO site offers

Main site: https://nsonepal.gov.np/
It loads quickly. Default language is Nepali; the top-right NEP/ENG
toggle switches it to English. English main menu: About Us, Statistics,
Existing Laws, Information Center, Statistics Portal, E-Service.

Statistics categories on the main site (12):
Population; Poverty, Living Standard & Labour Force; Social & Gender;
Environment; National Account; Price; Establishments; Agriculture;
Industrial; Trade; Province; District.

### 3.1 Raw tables exist, but only for some releases

The main site releases machine-readable tables alongside PDFs for
certain statistical releases. It is neither PDF-only everywhere nor
a general raw-data download site.

Verified examples:
- Manufacturing Production Index, Q4 FY 082/83: the release page lists
  an `.xlsx` file alongside PDF files. Its files are hosted on a
  separate media domain, giwmscdnone.gov.np, not on nsonepal.gov.np
  itself.
- Indices Q4 080/81 Excel page, dated 2024-09-22:
  https://nsonepal.gov.np/content/13322/indices-q4-080-81-excel/
  — carries an Agriculture Producer Price Index annual Excel file.

Not found on the main site in this scout:
- No CSV version of any release found.
- No API documentation and no dedicated download section found.
- The E-Service menu was not expanded in this scout, so it is
  unchecked, not proven absent.

### 3.2 Flagship publications: PDF only, on their pages

- Nepal Statistical Year Book 2025:
  https://nsonepal.gov.np/content/13516/nepal-statistical-year-book-2025/
  Dated 2026-10-27 on the site. Embedded PDF viewer only. A targeted
  search of the page found no xlsx / xls / Excel / download link, so
  no XLSX/CSV version of its tables is offered alongside the PDF on
  this page. The viewer counter reads 1/544, confirming the 544-page
  figure. The site page itself carries no text stating the biennial /
  edition / table-count description. That description comes from
  inside the PDF preface, which states it is a biennial publication
  since 1987, the present edition is the 20th in the series, and it
  contains 215 statistical tables covering 20 thematic areas. The
  site page and the PDF preface are therefore two different sources
  and should be cited separately. The 544-page PDF loads very slowly
  in the embedded viewer; that is a large-file viewer issue, not
  evidence that the whole site is slow.
- Quarterly Statistical Bulletin and Compendium of Environment
  Statistics Nepal 2026: also published as embedded PDFs, with no
  XLSX/CSV alongside found in this scout.
- Publications listing: Information Center → "Puplications" (spelling
  as on the site) → https://nsonepal.gov.np/category/puplications/
  Recent page-1 items include Water Supply and Sanitation Situation
  in Nepal, Year Book 2025, Quarterly Statistical Bulletin,
  Population Atlas of Nepal, Compendium of Environment Statistics
  Nepal 2026, and Profiling of Multidimensional Deprivation among
  Children in Nepal 2026. Site search also returned Year Book 2023
  (Nov 2024), consistent with a biennial pattern. A site search for
  "Excel" returned only the Indices-Q4-080-81-Excel page and a notice
  about an Excel code file for rural/urban classification.

Unresolved discrepancy, not assumed:
- An Input Price Index of Construction Materials (IPICS) page
  (2026-09-06) showed only an embedded PDF in English view, with no
  attachment links, even though a Nepali homepage notice for it was
  titled with "Excel Sheets". The Excel attachments may belong to a
  different quarterly notice. IPICS should not be cited as
  XLSX-available until that notice is found.

## 4. Statistics Portal destinations: availability, corrected

Captured from the main-site menu on 2026-10-30:

| Portal (menu label) | Destination | Result from a cloud browser |
|---|---|---|
| National Population Census 2021 Portal | https://censusresults.nsonepal.gov.np/ | Timed out, twice |
| Agriculture Census 2021/22 Portal | https://agricensusnepal.gov.np/ | Timed out |
| National Data Profile (NDP) | http://nationaldata.gov.np/ | Loads — see section 6 |
| Microdata Catalog | https://microdata.nsonepal.gov.np/index.php/home | Timed out |
| MICSDG DashBoard | http://103.69.124.159:84/micsdg/mics.html | Refused to connect |
| Data Nsonepal Portal | http://113.199.192.53:82/ | Refused to connect |

Correction to an earlier interpretation: the initial pattern — main
site loads, several subdomains and IP:port portals do not — was first
read as network / routing trouble specific to those destinations,
not a general NSO block, and not proof that they are down for
everyone. That reading is now qualified. At least some of these
portals also fail in a mobile Edge browser session in which the IP
Data Portal does work. That is stronger evidence that at least some
of them are genuinely down or unreachable in general, not merely
blocked from one cloud network. The exact per-portal position still
needs a per-portal check: which portals fail on which networks, on
which dates, should be recorded individually, not collapsed into a
single "portals are down" claim.

Only 1 of the 6 destinations was verified loading from the cloud
browser on 2026-10-30: National Data Profile at nationaldata.gov.np.

Google snippets found during portal searching claimed a Central Data
Portal offers official .xlsx/.csv datasheets. That claim is
UNVERIFIED, because those portals would not load. It should not be
used as evidence until a loaded page shows a dataset and a download
button.

## 5. The IP Data Portal: observations and why it cannot be a live source

Portal: http://113.199.192.53:82/
Dashboard as seen in an earlier mobile view: "National Census &
Socio-Economic Survey Repository", "Official Statistical Datasheets
in .XLSX and CSV", "TOTAL SECTORS 15", with sectors including
Agriculture, Education, Energy, Environment, Establishments, Health,
Industry and Labour. That dashboard description is screenshot
evidence only. Its datasets and formats have not been independently
verified from a loaded page, because the portal would not load again
in the attempts below.

Attempts, 2026-10-30:
- Cloud browser, three attempts including after a 60-second wait:
  refusal to connect. The HTTPS variant also refused, and port 80
  was unresponsive. No bot challenge and no login screen appeared,
  because the server never answered.
- Manual browser takeover, same day: the same generic "can't be
  reached" message as the cloud attempt. This rules out a simple HTTP
  warning as the cause: a plain HTTP site normally loads with a
  "Not Secure" label, not a refusal. A refusal means the server or
  the network did not answer at all on port 82.
- Port 82 is non-standard. Some networks and browsers block
  non-standard ports even when 80/443 work. An intermittent server,
  IP-range filtering, and a genuinely down server all remain possible
  explanations, and the mobile-Edge correction in section 4 shows
  that at least some NSO portals are genuinely failing elsewhere
  too. No single cause for this portal is proven by the attempts
  above alone.

Consequence for the atlas, regardless of cause: this portal must not
be used as a live source. If its data is used, it must first be
captured, reconciled and archived, then shipped to the atlas as a
small derived file (see section 8). A local-machine test (local
Chromium or headless) and, as a fallback, manual download of its
files, are the remaining routes to capture it.

## 6. National Data Portal: district-level supply, verified in depth

Portal: http://nationaldata.gov.np/ — title "National Data Profile" /
"National Data Portal-Nepal". Scouted in depth on 2026-10-30.
No sign-in, no commits. Two small sample downloads were taken only
to identify the download mechanism, and their contents were checked
locally afterwards.

### 6.1 Geographic drill-down by URL path — a key finding

The portal's geographic hierarchy works through stable URL paths,
and through a report filter, at four administrative levels plus
national level:

- Province: http://nationaldata.gov.np/Province/Index/{id}
  (example: /1 = Koshi)
- District: http://nationaldata.gov.np/District/Index/{id}
  (example: /111 = Jhapa)
- Local level (municipality / palika):
  http://nationaldata.gov.np/LocalLevel/Index/{id}
  (example: /11107 = Damak Municipality, with Ward 1–10 links)
- Ward: http://nationaldata.gov.np/Ward/Index/{id}
  (example: /729 = Damak Ward 1)

Each level shows a "{Name} Data Summary" with indicator tables, and
each table has its own direct Download link that works without login.
The drill-down was verified end to end from province to ward, not
only at national level.

Separately, per-indicator report pages
(/StaticReport with parameters for thematic group, sub-group,
indicator and area) offer a "Report filter" with geographic levels
National, Provinces, District, Local Level and Ward. That filter
exists in the interface, but on the one test tried it did not render
a results table after submitting (three attempts, District =
Bagmati / Kathmandu, indicator "Households and Population by sex
Ward wise"). The URL drill-down is therefore the verified route;
the StaticReport filter route is verified as present but not as
working on that test, and should be re-tested on a smaller indicator
before it is relied on.

### 6.2 Worked example: Jhapa district

Jhapa district (/District/Index/111) showed 11 district-level
tables, years 2021–2022, including "Population by Sex (Without
Institutional) (2021)" — Male 473,588, Female 519,208, Total
992,796 — plus Absentee Population by Sex and Reason of Absence
(2021), Number, Area and Land Use (2021), Number of Households by
Source of Drinking Water (2021), and Number of Livestocks (2021).
Whether "Show More" reveals more than those 11 Jhapa tables was not
checked, so 11 is a lower bound, not a total.

### 6.3 Download format — an important nuance

No format is named anywhere in the portal UI. There is no "XLSX",
"CSV", "PDF" or "Excel" text on any page checked. Every summary table
shows a "Metadata" button and a "Download" link, and download is
direct with no login prompt.

The two sample files, checked locally after download, are both HTML
documents, despite the .xls filename:
- 6.1 KB sample, Absentee Population by Sex and Reason of Absence
  (2021), national summary: an HTML table, national totals Male
  1,799,675, Female 390,917.
- 874-byte sample, Number of Nepalese with labor permit abroad for
  employment (2022), Jhapa district page: an HTML table, Female
  4,027, Male 15,679.

Consequence for the pipeline: these should not be treated as binary
Excel files and not as CSV. Excel will open an HTML table saved as
.xls, but a reliable atlas pipeline must parse the HTML table and
convert it to CSV itself, recording that conversion in the archive
manifest. That is a small, standard parsing step — far smaller than
a PDF-transcription pipeline — and it should be the pilot parser.

### 6.4 Indicator catalog (summary)

Menus: Home, Resources, Capacity, Geography and Nature, Development
Potentiality, Others, SDG. Homepage has a clickable map of the 7
provinces (Koshi, Madhesh, Lumbini, Bagmati, Gandaki, Karnali,
Sudurpashchim), an indicator search box, and "National Data Summary"
tables with year labels 2021, 2022 and 2023 observed. Searching
"Population" returned Absentee Population, Population by Occupation,
Population by level of education, and Population by Literacy Status,
all 2021.

Counts by menu, as enumerated in the scout:
Resources 52, Capacity 84, Geography and Nature 5, Development
Potentiality 1, Others 7, plus 17 SDG goal tiles.

Atlas-relevant groups inside that catalog include, in the portal's
own wording: Population (24 indicators, including Population by Sex,
by Caste/Ethnicity, by Mother tongue, by Literacy Status, by level
of education, by disability, by Rural/Urban, by Five Years Age Group
and by Single Year of Age); House and Households (13, including
drinking water, toilet facilities, cooking fuel, lighting, house
foundation and outer wall, female ownership, remittances);
Education (13, including enrolment, dropout, teacher ratios and
out-of-school children); Health (11, including health institutions,
health manpower, vaccination, maternal health and doctor/nurse
ratios); Agriculture, Livestock and Poultry (8, including land use,
holdings by tenure, and livestock numbers); National Account (5,
including provincial GDP growth and gross value added by industry);
Wellbeing (11, including literacy rates at National, Province and
Local levels, and life expectancy at birth, National); and
Transportation (proportion of population within 2 km of an
all-season road).

That catalog maps directly to atlas People (v0.2) and, in part, to
Economy and Farming (v0.3). It does not by itself prove every
indicator is available at district level — the drill-down pages are
the test, indicator by indicator, in the inventory step.

### 6.5 Codes, metadata, and what did not work

- Codes: province, district, local-level and ward names are shown as
  plain text. No numeric codes and no HDX-style pcodes were visible
  on any page checked. The numbers in the drill-down URLs (province
  1, district 111, local level 11107, ward 729) are the portal's own
  internal IDs, not HDX pcodes. They must not be used as pcodes.
  Pcode mapping for the atlas must therefore be by name matching to
  the HDX boundary list, with manual checks for name variants, and
  the mapping must be recorded in the archive manifest.
- Metadata: each table has a Metadata button opening a modal with
  rows for Data Source, Definition and Methodology. For the tested
  indicator those rows were empty. No NSO/CBS source line appears on
  the tables themselves; attribution is only via the site header /
  footer and the "National Population and Housing Census 2021" link.
  That makes the licence / source check in section 7 more important,
  not less.
- No API, developer docs, or data dictionary link was found. No
  charts were observed; tables only.
- Unresolved, not assumed: (a) the StaticReport filter rendering
  failure described in section 6.1; (b) Advance Search's cascading
  Thematic-areas dropdown did not populate after sector selection;
  (c) the full district table count beyond the 11 shown for Jhapa.
- Responsiveness: no bot checks, captchas, logins or blocks were
  encountered on this portal, and it was responsive throughout — in
  sharp contrast to the IP:port portals in sections 4 and 5. That
  makes nationaldata.gov.np, not the IP portal, the current best
  working source for district-level NSO indicators, pending the
  local test of the IP portal.

## 7. How NSO data maps to the Nepal Atlas

Atlas constraints that decide whether a dataset is usable (from the
atlas spec):
- Boundaries already exist from Pin Drop: Survey Department / OCHA
  HDX 2024 official outline, provinces, 77 districts, 753 palikas,
  as one SVG with shared vertices, 113 KB gzipped, plus palika
  points, district HQs, landmarks, rivers and parks.
- Choropleths join by HDX pcodes. The atlas spec's tests require
  every stats row's pcode to exist in the boundaries, and every
  district / palika to have a value or an explicit "no data".
- Budgets: at most 2 MB per view at overview zoom, at most 40 MB for
  the whole atlas in the repo, at most 1 MB before first paint, first
  view usable within 3 seconds on a 3G-class connection, no network
  after a view's data loads.
- The atlas data tool idea is `build-stats.py`: CoD-PS CSV and census
  tables become `stats.json` keyed by pcode. NSO tables should feed
  that same shape, not be shipped raw into the atlas.

Mapping, by atlas phase:
- Political (v0.1, tap a district card: HQ, area, population,
  palikas): main-site Statistics categories Province and District,
  plus Census 2021 population by district, are the natural NSO
  inputs. National-only tables do not help here.
- People (v0.2, choropleths): population, density, growth, mother
  tongues and literacy by district, Census 2021. This is the highest
  NSO value in the atlas, and the atlas spec already flags Census
  2021 tables as "site not reachable from this cloud session, try
  from the user's machine". The local test and the nationaldata.gov.np
  drill-down are therefore the People-view tests, not side quests.
- Economy (v0.3): GDP by province (NSO provincial GDP is the only
  official GDP level in the atlas spec; district economy uses HDI
  and other indicators instead), plus district HDI from the Nepal
  Human Development Report (PDF tables in the atlas spec). Price /
  production indices in XLSX form are useful context, but they are
  not a district choropleth by themselves.
- Farming (v0.3): main crop by district. The atlas spec already warns
  this is district tables in PDF with hand extraction (MoALD
  "Statistical Information on Nepalese Agriculture"), and FAOSTAT
  is national only. NSO Agriculture Census 2021/22, if it loads
  locally, could replace or check that hand extraction — but only if
  it is at district level with a usable code.
- Climate, Forests & parks, Physical, Rivers & lakes: primarily
  WorldClim, WorldCover / Hansen, Terrarium DEM and OSM /
  HydroRIVERS in the atlas spec, not NSO. NSO Year Book chapters on
  Forest and Climate are useful as cross-checks and card text, not
  as the raster source.

Geographic tagging rule for the inventory:
- Tier A — District-ready: district name plus a code that maps
  cleanly to an HDX district pcode, or a name list that matches the
  77 districts exactly with no ambiguity.
- Tier B — Province-only: useful for province cards, province
  choropleths and context, not for district colouring.
- Tier C — National-only: useful for national context, trends and
  card text, not for maps.
- Tier D — PDF-only: Year Book and similar flagship tables. Usable
  only after transcription, with a source page reference per table,
  and only for a small pilot set at first (see section 8, step 4).

## 8. Explicit step-by-step plan

Step 1 — Finish the scout (no new guessing).
- 1a. Scout nationaldata.gov.np drill-down pages indicator by
  indicator, starting with People, to confirm which indicators are
  actually district-level, not only national-level.
- 1b. Local test of the IP Data Portal (local machine): record
  whether it loads, on what network, and capture the inventory in
  step 2. If it does not load locally either, stop treating it as a
  live source and use the HTTPS portals, the main site, and manual
  files.
- 1c. Re-check the IPICS Excel discrepancy: find the notice page
  that actually carries the Excel sheets, if it exists, before
  citing IPICS as XLSX-available.
- 1d. Record portal availability per portal, per network, per date,
  in the form used in section 4, rather than a single general claim
  about NSO portals being up or down.

Step 2 — Inventory, with evidence per dataset.
For each candidate dataset, record: source page URL, release title
and date, original format (PDF / XLSX / HTML-table-as-XLS / web
table), geographic level, code column if any, year or fiscal year,
and retrieval date. A dataset should not be recorded as "XLSX
available" from a search snippet or a screenshot alone — only from
a loaded page showing the file link, or from a locally checked
downloaded file.

Step 3 — Licence and redistribution check, before any archive is
published.
- Check NSO terms on the main site and on each portal.
- If terms are unclear, ask the NSO institutional contact (see
  section 1) what may be republished, in what form, with what
  attribution. A public archive should not be published on an
  assumption.
- Government statistics are often reusable, but this spec does not
  assume that. Attribution must name NSO, the release, and the year.

Step 4 — Pilot, not a full PDF pipeline.
- A general PDF-to-CSV transcription pipeline should not be built
  first. That is a separate major task.
- Pilot with at most two Tier A / Tier B tables that are already in
  a machine-readable form (nationaldata.gov.np HTML-table downloads
  or main-site XLSX releases), or one small Year Book table
  transcribed by hand with page references, and prove the full
  chain: parse → pcode map → validate → shrink → atlas card /
  choropleth.
- Only expand the pilot if the pcode join rate and the size budget
  both pass. If a table cannot be pcode-mapped, it stays out of the
  map and may still be used as card text, clearly labelled.

Step 5 — Clean, map and validate.
- Normalise names and codes to HDX pcodes. Keep the original name
  and code alongside the mapped pcode, so a mismatch can be audited.
- Fiscal years in Nepal (e.g. 082/83) must be recorded as given,
  with the AD equivalent noted where it is known, never silently
  converted.
- Validation gates, mirroring the atlas spec tests:
  every stats row's pcode exists in the boundaries; every district /
  palika in the view has a value or an explicit "no data"; no silent
  dropping of rows; totals, where the source gives them, are checked
  against the sum of parts and any mismatch is flagged, not fixed.
- Keep raw files untouched in the archive (section 9). Cleaned files
  are derived, with the script or steps that produced them recorded.

Step 6 — Shrink for the atlas.
- Build the atlas `stats.json` keyed by pcode, with only the fields
  the views actually show. Check the size against the 2 MB / view
  and 40 MB total budgets before committing anything to
  panipuri-minigames.
- The atlas must not fetch live from NSO, from the IP portal, from
  GitHub raw, or from Kaggle at runtime. It ships the derived file.

Step 7 — Attribution and provenance in the atlas.
- Add NSO to the atlas "About this atlas" page, with release names
  and years, alongside the existing Survey Department / HDX, OSM,
  Natural Earth, Terrarium, WorldCover and WorldClim attributions.
- Every atlas view that uses NSO data should be traceable to a
  release in the archive manifest, not just to "NSO" in general.

Step 8 — Decide this spec's own home.
- This document is delivered for review. It is not committed yet.
  Possible homes, to be decided by the atlas author: a supplementary
  document in panipuri-minigames (for example under `docs/specs/`),
  on the `musa-koala` test branch, on a new branch, or kept outside
  the repo. No push to `live` is authorised by this document alone.

## 9. Archive plan — fresh GitHub repository or Kaggle dataset

Recommendation: GitHub as canonical, Kaggle as mirror, atlas
separate from both.

Fresh GitHub repository (canonical archive):
- Pros: versioned, citable by commit, works with the atlas build,
  can hold raw + cleaned files, a manifest, and the cleaning scripts.
  A separate repository keeps panipuri-minigames inside its 40 MB
  budget.
- Cons: needs the licence check in step 3 first; large XLSX files
  need care (GitHub file-size limits, and the atlas must not pull
  them at runtime).
- Suggested layout:
  - `raw/` — original files, untouched, with original filenames.
  - `cleaned/` — pcode-mapped CSVs, one per dataset, with a header
    note giving source, year and licence.
  - `manifest.csv` — one row per dataset: title, source URL, release
    date, retrieval date, original format, file size, checksum,
    geographic level, licence / terms note.
  - `README.md` — what this archive is, what it is not (it is not
    the atlas, and it is not an official NSO mirror unless NSO says
    so), and how to rebuild the cleaned files.
  - `atlas/stats.json` (derived only, or a build script that makes
    it) — only if the repository is also used as the atlas data
    build home; otherwise keep the atlas derivation in
    panipuri-minigames and reference the archive by commit.

Kaggle dataset (mirror for discovery):
- Pros: discoverable, versioned datasets, good for structured CSVs,
  and a natural place for other people to find the cleaned tables.
- Cons: not a runtime source for the atlas (no network after a view
  loads), needs a Kaggle account and dataset metadata, and its
  licence field must match the actual NSO terms — a permissive
  licence should not be picked by default.
- Use it as a mirror of the cleaned CSVs only, with a link back to
  the GitHub repository as canonical, and the same manifest.

What not to do:
- Do not put the full raw archive into panipuri-minigames. It would
  break the atlas size budget and mix a data archive with a games
  repository.
- Do not publish NSO data publicly before the licence check.
- Do not present the IP portal's screenshot claim ("XLSX and CSV,
  15 sectors") as verified until a loaded page shows it. In this
  spec it is recorded as screenshot evidence, pending the local test.

## 10. Open questions

1. Priority: People (v0.2) first, or a small Economy / Farming pilot
   first? The scout suggests People has the clearest NSO payoff.
2. Year Book: pilot with one hand-transcribed table, or defer all
   Year Book tables until the machine-readable pilot passes?
3. Archive home: fresh GitHub repository name and owner, Kaggle
   mirror yes or no, and who owns the licence question with NSO?
4. Local capture: if the IP portal loads locally, which sectors
   first — Agriculture, Education, Health, or the full 15?
5. This spec's home: keep it outside the repository for now, or
   commit it as a supplementary document, and if so, on which branch?
6. Portal availability: which of the Census, Agriculture Census,
   Microdata and MICSDG portals fail on which networks, and are
   they down, moved, or only intermittently reachable?

## 11. Sources and verification status

- https://nsonepal.gov.np/ — verified loading, English toggle
  verified, 2026-10-30.
- https://nsonepal.gov.np/content/13516/nepal-statistical-year-book-2025/
  — verified PDF-only on the page, 544 pages via viewer counter,
  2026-10-30.
- https://nsonepal.gov.np/content/13322/indices-q4-080-81-excel/
  — verified XLSX example, 2024-09-22 page date, 2026-10-30.
- https://nsonepal.gov.np/category/puplications/ — verified
  publications listing, 2026-10-30.
- http://nationaldata.gov.np/ — verified loading and drill-down
  from province to ward, with direct HTML-table downloads, 2026-10-30.
  Sample downloads checked locally: HTML tables, not binary Excel,
  not CSV.
- https://censusresults.nsonepal.gov.np/ — timed out from a cloud
  browser, 2026-10-30; also reported failing in a mobile browser
  session in which the IP Data Portal worked, per the atlas author.
  Per-portal, per-network confirmation still needed (see section 4).
- https://agricensusnepal.gov.np/ — timed out from a cloud browser,
  2026-10-30; same per-portal qualification as above.
- https://microdata.nsonepal.gov.np/index.php/home — timed out from
  a cloud browser, 2026-10-30; same per-portal qualification.
- http://103.69.124.159:84/micsdg/mics.html — refused from a cloud
  browser, 2026-10-30; same per-portal qualification.
- http://113.199.192.53:82/ — refused from a cloud browser (three
  attempts) and "can't be reached" on a manual browser takeover,
  2026-10-30. Screenshot evidence of its dashboard exists from an
  earlier mobile view, but its datasets and formats are not yet
  independently verified.
- Atlas spec: `docs/specs/games/nepal-atlas.md`,
  panipuri-minigames, read directly from that repository, 2026-10-30.
- Institutional lead: Dhundi Raj Lamichhane, Deputy Chief
  Statistician, National Statistics Office — named in the Year Book
  2025 preface and identified as the atlas project's NSO lead.
- No sign-ins were made by the main-site or National Data Portal
  scouts. Format claims above are from observed pages or from
  locally checked downloaded files, except where marked screenshot
  evidence or unverified.
