# CSDM Service Model Visualizer

> **v2.1 development branch.** The live GitHub Pages application remains v2.0. Do not treat the new model, assessment session and locally bundled frontend as released until browser acceptance, CI checks and an explicit production merge.

## v2.1 changes awaiting acceptance

The release/v2.1.0 branch implements:

- CSDM 5 white-paper Service Offering labels, with backwards-compatible v2.0 header aliases.
- CSDM 5 **Uses::Used by** or **Consumes::Consumed by** relationship selection, with an EA Workspace compatibility explanation.
- Service Instance- and Offering-specific support groups and ownership fields; legacy support_group remains an offering fallback.
- Advisory findings for Service Instances mapped to multiple Business Applications, plus entity-specific owner/support conflicts.
- New synthetic sample reflecting one Business Application with multiple offerings rather than multiple Business Applications sharing one instance.
- **Save assessment** and **Resume assessment** using a validated local JSON session file; remediation statuses persist across sessions when exported.
- Explicit readiness-scoring formula and a three-row/one-Medium finding example in the interface.
- [ServiceNow import preparation guide](docs/IMPORT_PREPARATION.md), including reference mappings and boundaries of single-flat-CSV support.
- Bundled React, React Flow, PapaParse and Tailwind resources served from GitHub Pages; no frontend runtime CDNs.

See [v2.1 acceptance plan](docs/V21_ACCEPTANCE.md). Production v2.0 remains unchanged.


**An independent, browser-based CSDM architecture and data quality workbench.** Designed for architectural exploration, education and governance conversations. Created by Enamul Haque.

**Live application:** https://haquenam.github.io/csdm-service-model-visualizer/  
**Release notes:** [v2.0.0](docs/RELEASE_NOTES_2.0.md)  
**Detailed model contract:** [Version 2 model and acceptance notes](docs/V2_RELEASE_PLAN.md)

## What's new in v2.0

- Choose **CSDM 4** or **CSDM 5**. Labels, sample CSV headers and specified relationship semantics adjust to the selected version.
- Inspect **Application**, **Service Delivery**, **Service Consumption** or **End-to-end** graph perspectives.
- Inspect relationships by type: CMDB CI relationships (blue) and service/offerings parent references (grey dashed).
- Analyse a custom structured CSV with optional per-entity `sys_id` identifiers, legacy v1 header aliases and CSDM 4/5 naming variants.
- Detect missing core mappings, missing application owners/support groups, exact duplicate input rows, ambiguous identities, conflicting parents and owner conflicts.
- Filter by environment, criticality and search text. Review all findings and edit in-session remediation statuses.
- Download **remediation CSV**, **JSON**, **Markdown** and a labelled **PNG** architecture diagram.
- Exported end-to-end PNGs put Business Service consumption relationships in a separate labelled section, repeating referenced Service Instances *visually*, not creating new CIs.
- Run strict TypeScript compilation and automated regression tests through GitHub Actions.

## How to use

1. Select **CSDM 4** or **CSDM 5**.
2. Click **Download v4 template** or **Download v5 template** for safe synthetic sample data, or prepare a compatible structured CSV.
3. Choose the CSV. The file is processed **only after** clicking **Run analysis**.
4. Review the advisory readiness indicator, record completeness and prioritised findings.
5. Use the filters and four graph views to inspect different relationships.
6. Export a PNG or download remediation CSV, JSON and Markdown reports. Download the remediation CSV before leaving the page if you have changed statuses.

The sample includes a Service Instance used by two different Business Applications. This is a legitimate repeated entity reference, not a duplicate input row.

## CSDM version mapping

| Model concept | CSDM 4 | CSDM 5 |
| --- | --- | --- |
| Operational application instance | Application Service | Service Instance |
| Technology service | Technical Service | Technology Management Service |
| Technology offering | Technical Service Offering | Technology Management Offering |
| Consumer-facing offering | Business Service Offering | Business Offering |
| Business Application relationship (default for this tool) | Consumes::Consumed by | Uses::Used by |

The graph distinguishes **CMDB relationships** from **parent references**. The CSDM 5 Business Application relationship can have documented Enterprise Architecture Workspace exceptions; the version selector is **not** a platform migration or an assertion of complete CSDM compliance.

## Input contract

The versioned template has four core entity fields:

- `business_application`
- `application_service` (CSDM 4) or `service_instance` (CSDM 5)
- `technical_service` (CSDM 4) or `technology_management_service` (CSDM 5)
- `technical_service_offering` (CSDM 4) or `technology_management_offering` (CSDM 5)

Optional relationship fields: Business Service and Business Offering / Business Service Offering. Other fields describe application owner, service owner, support group, environment, criticality and optional per-entity `sys_id` values.

The original v1 columns `technical_management_service` and `technical_service_offering` remain accepted as aliases. The parser can interpret compatible flat CSV headers. It **does not** automatically join several native ServiceNow list exports or load CMDB relation tables.

## Validation and readiness

The indicator is based on evidence from the uploaded rows, *not* a ServiceNow-certified CSDM maturity assessment. Weighted penalties use **High = 8, Medium = 4, Low = 2**, divided by a maximum of four high-weight findings per input row; the score is floored at zero. Missing optional consumer-domain objects are not automatically defects.

Duplicate logic distinguishes **exactly repeated rows** from valid repeated entity references. When stable `sys_id` fields are supplied, identity conflicts and name ambiguity receive separate findings.

## Security and data safety

CSV processing takes place inside your browser without a backend, authentication, database or ServiceNow API connection. The project does not intentionally transmit uploaded data to GitHub or any server. Browser resources are served from public CDNs.

**Use only synthetic or suitably anonymised data. Do not use client, production, confidential, personal, regulated or sensitive records.** Exported reports are saved locally, and remediation-status edits are not persisted after the session.

This is an independent educational tool, not an official ServiceNow product and not affiliated with, endorsed by or sponsored by ServiceNow. Do not use its outputs as production import approval, CMDB certification or regulatory evidence.

## Scale and known boundaries

- A single structured flat CSV is supported; native multi-file ServiceNow imports and live integration are out of scope.
- The interactive diagram shows at most **120 unique nodes** and signals when it is truncated. Filter the dataset to inspect other entities.
- PNG exports reflect the selected view and visible graph. Large diagrams may need narrower filtering.
- Remediation statuses remain in the current browser session until exported.
- CSDM terminology/relationships are supported for the documented subset only. Additional domains and platform-specific conventions require qualified architecture review.

## Development

Requirements: Node.js 22 and npm.

```bash
git clone https://github.com/haquenam/csdm-service-model-visualizer.git
cd csdm-service-model-visualizer
npm ci
npm test
npm run dev
```

`npm test` compiles TypeScript and runs the Node.js model tests. `npm run dev` serves the built static site (its port is shown by the running server).

| Layer | Implementation |
| --- | --- |
| Client | React, TypeScript, JavaScript |
| Diagram | React Flow |
| CSV import | PapaParse |
| Styling | Tailwind CSS |
| Hosting | GitHub Pages via GitHub Actions |
| Backend | None |

## Roadmap

| Delivery | Status |
| --- | --- |
| v1.1: validation severity and recommendations | Completed |
| v1.2: CSV template guidance | Completed |
| v2.0: CSDM 4/5 views, model validation and remediation workbench | Released |
| v2.1: governance, model accuracy, assessment continuity, local frontend resources | In development |
| v2.2: native ServiceNow multi-table export preparation and adapters | Planned |
| Native multi-table ServiceNow adapters | Future |
| Hierarchical grouping for large graph datasets | Future |
| Persistent collaboration, AI recommendations and scoped ServiceNow app | Future |

## Licence

MIT. See [LICENSE](LICENSE).

**Author:** Enamul Haque  
[LinkedIn](https://www.linkedin.com/in/haquenam/) · [GitHub](https://github.com/haquenam)
