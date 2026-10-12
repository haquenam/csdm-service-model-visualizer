# CSDM Service Model Visualizer

**An independent, open-source CSDM architecture and data quality workbench** for ServiceNow architects, enterprise architects and governance teams. Created by Enamul Haque.

**Current release: v2.1.0**  
**Live application:** https://haquenam.github.io/csdm-service-model-visualizer/  
**What's changed:** [v2.1.0 release notes](docs/RELEASE_NOTES_2.1.md)  
**Prepare a CSV:** [ServiceNow import preparation guide](docs/IMPORT_PREPARATION.md)  
**Relationship contract:** [v2 model notes](docs/V2_RELEASE_PLAN.md)

## What you can do

- Select **CSDM 4** or **CSDM 5** and use the appropriate terminology, templates and relationship labels.
- Choose **Uses::Used by** or **Consumes::Consumed by** for the CSDM 5 Business Application–Service Instance relationship; CSDM 4 uses Consumes. Some ServiceNow product areas have different relationship conventions.
- Inspect four model perspectives: **End-to-end**, **Application**, **Service Delivery** and **Service Consumption**.
- Check relationships between Business Applications, Application Services/Service Instances, Technical/Technology Management Services and Offerings, plus optional Business Services and Business Service Offerings.
- Validate incomplete core mappings, ownership and support gaps, conflicting records, questionable Business Application–Service Instance associations and exact duplicate rows.
- Filter by environment, criticality and free text. Inspect an interactive graph with clearly distinguished CMDB relationships and parent references.
- Download the architecture diagram as PNG or export remediation CSV, JSON and Markdown.
- **Save Assessment / Resume Assessment**: preserve the analysed records, model version, relationship mode and remediation statuses in a downloadable local JSON file.

The Visualizer is a reference and review aid, **not a ServiceNow-certified CSDM assessment**.

## Quick start

1. Select CSDM 4 or CSDM 5. If using CSDM 5, select the applicable relationship mode.
2. Click **Download v4 template** or **Download v5 template**, or prepare a compatible CSV following the [import guide](docs/IMPORT_PREPARATION.md).
3. Click **Choose CSV** and **Run analysis**.
4. Review the findings and the relationship graph. Update remediation statuses if needed.
5. Export reports or click **Save assessment** to retain progress. Later, use **Resume assessment** to reopen the saved JSON.

The tool works on a **single structured CSV representing relationship paths**, not direct ServiceNow API integration or automatic joins across multiple native table exports. You can repeat a Service Instance across different offering relationships without creating duplicate CIs or triggering an exact-row duplicate. A Service Instance associated with multiple Business Applications may, however, be reported as a modelling question for review.

## CSDM 4 and 5 mapping

| Concept | CSDM 4 display label | CSDM 5 display label |
| --- | --- | --- |
| Operational instance | Application Service | Service Instance |
| Technology service | Technical Service | Technology Management Service |
| Technology offering | Technical Service Offering | Technology Management Service Offering |
| Consumer service | Business Service | Business Service |
| Consumer offering | Business Service Offering | Business Service Offering |
| Default Business Application relation | Consumes::Consumed by | Uses::Used by (configurable) |

The CSDM 5 compatibility selector also permits Consumes::Consumed by when appropriate for particular ServiceNow capabilities, such as some Enterprise Architecture Workspace scenarios. **Changing this setting does not update a ServiceNow instance.**

## Preparing input data

Version 5 templates use:

- `business_application`
- `service_instance`
- `technology_management_service`
- `technology_management_service_offering`

Version 4 templates use `business_application`, `application_service`, `technical_service` and `technical_service_offering`.

Additional optional columns represent Business Service and Business Service Offering, environment and criticality, object-specific owner/support attributes, and entity `sys_id` identifiers. The old `support_group` column remains an **offering-level fallback**; it does not establish the Service Instance support group. Existing v1 and v2.0 headers such as `technology_management_offering`, `business_offering` and `technical_management_service` are recognised as input aliases.

See [Preparing CSDM data for the Visualizer](docs/IMPORT_PREPARATION.md) for the complete template contract and preparation guidance.

## Advisory readiness score

```text
Score = max(0, round(100 - 100 * (8*H + 4*M + 2*L) / (32*N)))
```

Here H, M and L are counts of High, Medium and Low findings, and N is the number of imported rows. A three-row extract with one Medium finding scores approximately **96%**. The model is intentionally simple and depends on what was included in the imported extract; it is not a certification or authoritative CMDB quality metric.

## Privacy and dependency security

The release performs analysis within the browser and has **no application backend, database or ServiceNow API connection**. The JavaScript and CSS dependencies are bundled locally with the deployed site; the application does not need third-party runtime library CDNs.

**Use synthetic or suitably anonymised data only. Do not upload production, customer, confidential, regulated or personal data.** Assessment sessions and reports are written locally to the user's device; statuses are not automatically preserved unless an assessment session is saved.

## Development

Node.js 22 and npm are recommended.

```bash
git clone https://github.com/haquenam/csdm-service-model-visualizer.git
cd csdm-service-model-visualizer
npm ci
npm test
npm run dev
```

`npm test` compiles the model, bundles the browser application and runs the regression tests. `npm run dev` builds the static site and starts a local preview server. GitHub Pages deployments are built by GitHub Actions from `main`.

| Component | Implementation |
| --- | --- |
| Client | TypeScript and React |
| Relationship graphs | React Flow |
| CSV parsing | PapaParse |
| Styling | Tailwind CSS |
| Build | TypeScript, esbuild, Tailwind CLI |
| Hosting | GitHub Pages |
| Backend | None |

## Roadmap

| Version | Scope | Status |
| --- | --- | --- |
| v1.1 | Severity-based validation and recommendations | Released |
| v1.2 | CSV templates and field guidance | Released |
| v2.0 | CSDM 4/5 modelling, multiple views, remediation and PNG export | Released |
| v2.1 | Object-specific governance, model integrity, relationship compatibility, save/resume, local libraries | Released |
| v2.2 (proposed) | Native multi-table ServiceNow list-export adapters and joined relationship records | Future |
| Later | Larger graph navigation, governed persistent remediation and optional AI assistance | Future |

## Licence and attribution

MIT licensed. See [LICENSE](LICENSE). Independent educational tool, not affiliated with, sponsored by or endorsed by ServiceNow.

**Author:** Enamul Haque  
[GitHub](https://github.com/haquenam)
