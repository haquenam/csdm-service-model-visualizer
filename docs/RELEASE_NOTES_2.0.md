# CSDM Service Model Visualizer 2.0.0

Major release: a browser-based **CSDM architecture, validation and remediation workbench**, replacing the simplified v1 service-model explorer.

## Highlights

- **CSDM 4 / CSDM 5 selector:** version-specific terminology, example CSV templates and relationship labels.
- **Corrected model:** explicit relationships between Business Applications, Application Services/Service Instances, Technical/Technology Management Services and their Offerings; optional Business Services and Offerings for the Sell/Consume domain.
- **Improved validation:** distinguishes legitimate repeated instance references from exact duplicate rows; checks missing core mappings, owner/support gaps, identity ambiguity and parent conflicts. Readiness remains advisory.
- **Architecture explorer:** Application, Service Delivery, Service Consumption and End-to-end views with environment, criticality and text filters.
- **Actionable remediation:** in-session status tracking and remediation CSV, JSON and Markdown exports.
- **PNG diagrams:** downloadable labelled model with distinct technical and business-service consumption sections in the end-to-end export.
- **Backward compatibility:** supports the original v1 structured CSV headers as aliases, with optional entity `sys_id` fields.
- **Quality gates:** strict TypeScript build and 15 model/diagram regression tests, plus manual review of sample CSV parsing, analysis, relationship diagram and report exports.

## Known limitations

- This is a **flat structured CSV** utility, not an automatic importer for multiple ServiceNow CMDB tables or a ServiceNow API connector.
- The interactive diagram is limited to 120 displayed unique nodes and clearly indicates truncation.
- Remediation status edits are not stored after the browser session.
- The supported CSDM relationship subset is advisory; exceptions such as certain EA Workspace relationship usages require architecture review.
- Do not use confidential, customer, production, regulated or personal data. Use synthetic or suitably anonymised examples.

**Live site:** https://haquenam.github.io/csdm-service-model-visualizer/

**Repository:** https://github.com/haquenam/csdm-service-model-visualizer

Built by Enamul Haque. Independent educational workbench; not endorsed by or affiliated with ServiceNow.
