# Capture brief — NSO data for the Nepal Atlas

This brief is for a local capture session (local computer, local browser
or headless browser). It is not a live source for the atlas.

## IP Data Portal (http://113.199.192.53:82/)

Record first whether it loads at all, on what network, and on what date.
If it does not load, record the exact error page and stop treating it
as a live source.

If it loads, capture, in order:
1. Home dashboard: total sectors, exactly as listed.
2. Per sector: dataset title, year/coverage, download URL, format
   (XLSX / CSV / other), and file size.
3. Per dataset, one sample: geographic columns — national, province,
   district, or local level — and whether a code column is present.
4. Keep raw files untouched. Record source URL and retrieval date
   for every file in inventory-template.csv.

## National Data Portal (http://nationaldata.gov.np/)

Use the URL drill-down, which is verified working:
Province (/Province/Index/{id}) -> District (/District/Index/{id})
-> Local Level (/LocalLevel/Index/{id}) -> Ward (/Ward/Index/{id}).
Each level shows a Data Summary with direct Download links, no login.
Downloads are HTML tables saved as .xls, not binary Excel and not CSV:
parse the HTML table to CSV and record that conversion in the manifest.
Names are shown without HDX pcodes; the numbers in the drill-down URLs
are the portal's own internal IDs, not pcodes. Map by name to HDX
pcodes and record the mapping.

## Rules for every capture

- Do not record a dataset as XLSX/CSV available from a search snippet
  or a screenshot alone — only from a loaded page or a locally
  checked downloaded file.
- Do not publish captured data publicly before the NSO licence /
  redistribution check in nso-data-report.md, section 8, step 3.
- Do not use the atlas, GitHub raw, or Kaggle as a runtime source:
  the atlas ships a small derived stats.json keyed by pcode.
