# CSDM Visualizer v2.1.0 — release acceptance record

User authorised v2.1 production promotion on 12 October 2026. This record reflects the available browser evidence and automated coverage; it does not claim tests not performed.

## Automated testing

- [x] CSDM 4 and CSDM 5 modelling/relationship regression tests, including v2.0 aliases
- [x] Object-level support/ownership rules and cardinality warnings
- [x] Assessment JSON round-trip and malformed input rejection
- [x] TypeScript compilation, local JS/CSS bundling and static CDN checks
- [x] PNG label rules and relationship export regression tests
- [x] CI green on release candidate; repeat CI after stable version/release-metadata commits

## Browser acceptance evidence

- [x] CSDM 5 sample analysed successfully: 3 rows, 3 core-complete, 100% readiness, zero exact duplicates
- [x] CSDM 5 Uses/Consumes selector reflected in the exported relationship diagram
- [x] CSDM 4 sample analysed successfully: 3 rows, 3 core-complete, 100% readiness, zero exact duplicates; CSDM 4 labels verified
- [x] v2.0 legacy CSV sample imported successfully using old headers: 3 core-complete rows, 96% readiness and Medium advisory about a Service Instance with two Business Applications
- [x] Missing application owner produced one Low finding and 98% readiness; in-progress remediation was saved and resumed
- [x] Invalid standalone assessment JSON rejected with 'Assessment JSON is not valid', without an application crash
- [x] CSV/JSON/Markdown/PNG functionality reviewed during v2.0/v2.1 acceptance; PNG relationship layouts specifically reviewed for both versions
- [x] Network panel: local site.css, reactflow.css and App.bundle.js returned 200/304, no application CDN requests visible; Grammarly browser extension traffic appeared separately
- [x] Mobile-width view displayed the responsive page without apparent page-wide layout breakage

## Known limits and non-blocking gaps

- [ ] Separate manual browser test of an invalid JSON import **while another assessment is active** (the isolated invalid import scenario passed; unit tests cover input rejection).
- [ ] Manual browser review of very large data sets, every filter combination and extensive object-specific ownership conflict cases (automated unit coverage exists for core scenarios).
- [ ] Fully eliminate interactive diagram edge/label crowding on complex multi-offering data. Labels are shortened and long PNG headings wrap, but dense relationship graphs can remain busy.
- [ ] Native multi-table ServiceNow list export ingestion and ServiceNow API integration; planned outside v2.1.

These limitations were recorded for subsequent maintenance and roadmap prioritisation. No claim of official ServiceNow CSDM certification is made.

## Promotion instructions

The user explicitly requested production release. Merge the tested branch to main after green CI, verify Pages deployment success against the merged SHA, and publish v2.1.0 only after a successful production deployment. Confirm the tag points to the production merge commit. If deployment or tag publication fails, report the failure accurately and remedy it without declaring success prematurely.
