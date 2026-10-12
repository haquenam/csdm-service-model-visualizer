# CSDM Visualizer v2.1: browser acceptance and release gate

Status: DEVELOPMENT BRANCH. Do not merge without explicit user approval.

## Automated gates

- [x] CSDM 4 and CSDM 5 rule/model regression tests, including v2.0 legacy CSV aliases
- [x] Object-specific support and ownership validation
- [x] BA-to-Service Instance cardinality review (warning, not unconditional rejection)
- [x] Assessment session round-trip, input validation, preservation of statuses
- [x] TypeScript build, local vendor bundling, minified Tailwind CSS and React Flow CSS
- [ ] Final CI result for the latest branch head verified

## Browser acceptance in Codespaces

- [ ] Select CSDM 5: verify Service Instance, Technology Management Service, Technology Management Service Offering and Business Service Offering labels
- [ ] Select CSDM 4: Application Service, Technical Service and Technical Service Offering
- [ ] In CSDM 5 switch BA link between Uses::Used by and Consumes::Consumed by; confirm graph and PNG show selected mode
- [ ] Load a legacy v2.0 sample with technology_management_offering and business_offering headers
- [ ] Load new v2.1 CSV template; check distinct support groups on Service Instance and Offering
- [ ] Create a synthetic conflicting support group and missing support group; inspect findings
- [ ] Create two Business Applications associated with the same Service Instance; verify advisory warning
- [ ] Remove an owner, change the finding to In progress and Save assessment; close tab, reopen, Resume assessment; verify status is restored
- [ ] Try an invalid JSON session and confirm useful error and no unexpected state change
- [ ] Export JSON/CSV/Markdown and PNG; inspect contents and diagram relationship routing
- [ ] Use browser DevTools Network panel: no requests to unpkg, jsdelivr or tailwind CDN; all scripts and styles from the site itself
- [ ] Test responsive layout, filtered graph, truncation warnings and a larger synthetic file
- [ ] Confirm public v2.0 remains unaffected until authorised merge and deployed v2.1 becomes available only after a successful Pages workflow

## Critical documentation constraints

1. The readiness score is advisory; it is not CSDM certification.
2. The tool processes **one flattened structured CSV**. Multiple native ServiceNow table exports cannot be ingested automatically.
3. The legacy support_group is **only** an offering-level fallback; never infer that it establishes an instance's support group.
4. Switching a relationship label affects the diagram and export context, not actual ServiceNow configuration.
5. CSDM 5 Use/Consume rules may differ between products (especially EA Workspace).
6. Session restoration is a local JSON file operation, not a backend or persistent cloud account.
7. Use synthetic or suitably anonymised data only.

## Release decision

The implementation may be described as a v2.1 preview when CI passes. Do not merge PR #8, tag v2.1.0, or announce production until the browser acceptance list is reviewed with the user.
