import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyse, createGraph, emptyRecord, expectedHeaders, formatCsvCell, parseRows,
  remediationCsv, relationships, standardSample, toCsv, LABELS,
} from '../dist/assets/model.js';

test('CSDM 4/5 labels and CMDB relationship types differ where required', () => {
  assert.equal(LABELS['4'].service_instance, 'Application Service');
  assert.equal(LABELS['5'].service_instance, 'Service Instance');
  assert.equal(LABELS['4'].technology_management_offering, 'Technical Service Offering');
  assert.equal(LABELS['5'].technology_management_offering, 'Technology Management Offering');
  assert.equal(relationships('4')[0].name, 'Consumes::Consumed by');
  assert.equal(relationships('5')[0].name, 'Uses::Used by');
  assert.equal(relationships('5')[1].relationType, 'Reference');
  assert.equal(relationships('5')[2].relationType, 'CMDB');
});

test('legacy v1 input headers map to canonical CSDM 5 fields', () => {
  const data = [{
    business_application: 'Payroll',
    service_instance: 'Payroll Prod',
    technical_management_service: 'Platform Support',
    technical_service_offering: 'Gold',
    application_owner: 'Tester', support_group: 'Ops', environment: 'Production', criticality: 'High',
  }];
  const rows = parseRows(data, Object.keys(data[0]), '5');
  assert.equal(rows[0].technology_management_service, 'Platform Support');
  assert.equal(rows[0].technology_management_offering, 'Gold');
  assert.equal(analyse(rows, '5').score, 100);
});

test('CSDM 4-specific headers are accepted', () => {
  const data = [{
    business_application: 'Billing', application_service: 'Billing Prod',
    technical_service: 'Hosting', technical_service_offering: 'Gold',
    business_service_offering: 'Billing service access', business_service: 'Customer Billing',
  }];
  const rows = parseRows(data, Object.keys(data[0]), '4');
  assert.equal(rows[0].service_instance, 'Billing Prod');
  assert.equal(rows[0].business_offering, 'Billing service access');
  assert.equal(expectedHeaders('4')[1], 'application_service');
});

test('repeated service instance in distinct relationships is not a duplicate', () => {
  const rows = standardSample();
  const result = analyse(rows, '5');
  assert.equal(result.duplicates, 0);
  assert.equal(result.counts.High, 0);
  const graph = createGraph(rows, '5', 'all');
  assert.equal(graph.edges.filter((e) => e.label === 'Uses::Used by').length, 3);
  assert.equal(graph.edges.filter((e) => e.label === 'Contains::Contained by').length, 2);
});

test('identical row and conflicting reference parents are reported individually', () => {
  const a = { ...emptyRecord(), business_application: 'Billing', service_instance: 'Billing Prod',
    technology_management_service: 'Hosting', technology_management_offering: 'Gold',
    application_owner: 'Owner', support_group: 'Ops' };
  const duplicate = { ...a };
  const conflicting = { ...a, technology_management_service: 'Another Hosting' };
  const result = analyse([a, duplicate, conflicting], '5');
  assert.equal(result.duplicates, 1);
  assert.ok(result.findings.some((f) => f.code === 'conflicting_parent'));
});

test('missing management service penalises the readiness indicator', () => {
  const a = { ...standardSample()[0], technology_management_service: '' };
  const result = analyse([a], '5');
  assert.ok(result.score < 100);
  assert.ok(result.findings.some((f) => f.code === 'missing_technology_management_service'));
});

test('stable sys_id separates same-name distinct entities and flags ambiguity', () => {
  const a = { ...standardSample()[0], service_instance_sys_id: '11111111111111111111111111111111' };
  const b = { ...standardSample()[0], service_instance_sys_id: '22222222222222222222222222222222' };
  const result = analyse([a, b], '5');
  assert.ok(result.findings.some((f) => f.code === 'ambiguous_name'));
  assert.equal(createGraph([a, b], '5', 'application').nodes.filter((n) => n.kind === 'service_instance').length, 2);
});

test('only business offerings with missing parents receive optional-domain findings', () => {
  const a = { ...standardSample()[0], business_offering: 'Consumer Access', business_service: '' };
  const b = { ...standardSample()[0], business_offering: '', business_service: '' };
  assert.ok(analyse([a], '5').findings.some((f) => f.code === 'missing_business_service'));
  assert.ok(!analyse([b], '5').findings.some((f) => f.code === 'missing_business_service'));
});

test('CSV escapes quotes, newlines and spreadsheet formula prefixes', () => {
  assert.equal(formatCsvCell('=SUM(A1)'), "'=SUM(A1)");
  assert.equal(formatCsvCell('a,b'), '"a,b"');
  assert.equal(formatCsvCell('A\nB'), '"A\nB"');
  const csv = remediationCsv([{ id: '1', code: 'missing_owner', severity: 'Low', row: 2,
    entity: '=BAD', currentValue: '', recommendation: 'Investigate', status: 'Open' }]);
  assert.ok(csv.includes("'=BAD"));
  assert.ok(toCsv(standardSample(), '5').includes('technology_management_offering'));
});

test('diagram limits are explicit and filtered views contain only relevant nodes', () => {
  const rows = Array.from({ length: 140 }, (_, i) => ({
    ...standardSample()[0], business_application: 'Application ' + i,
    service_instance: 'Instance ' + i,
  }));
  const full = createGraph(rows, '5', 'all', 50);
  assert.equal(full.truncated, true);
  assert.equal(full.nodes.length, 50);
  const subset = createGraph(rows.slice(0, 2), '5', 'application');
  assert.equal(subset.nodes.length, 4);
  assert.ok(subset.nodes.every((n) => ['business_application', 'service_instance'].includes(n.kind)));
});

test('unrecognisable CSV reports a useful error', () => {
  assert.throws(() => parseRows([{ made_up: 'irrelevant' }], ['made_up'], '5'), /Cannot map/);
});
