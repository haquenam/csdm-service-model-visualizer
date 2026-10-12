import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyse, createGraph, emptyRecord, LABELS, HEADERS, expectedHeaders,
  standardSample, parseRows, relationships,
} from '../dist/assets/model.js';
import {
  buildSession, readSession, findingKey, SESSION_FORMAT,
} from '../dist/assets/session.js';

test('CSDM 5 labels, template headers and legacy aliases remain compatible', () => {
  assert.equal(LABELS['5'].technology_management_offering, 'Technology Management Service Offering');
  assert.equal(LABELS['5'].business_offering, 'Business Service Offering');
  assert.equal(HEADERS['5'].technology_management_offering, 'technology_management_service_offering');
  assert.equal(expectedHeaders('5').includes('service_instance_support_group'), true);
  const old = [{
    business_application: 'Example', service_instance: 'Example Prod',
    technology_management_service: 'Platform', technology_management_offering: 'Premium',
    business_offering: 'Access', support_group: 'Operations',
  }];
  const parsed = parseRows(old, Object.keys(old[0]), '5');
  assert.equal(parsed[0].technology_management_offering, 'Premium');
  assert.equal(parsed[0].business_offering, 'Access');
  assert.equal(parsed[0].service_instance_support_group, '');
  assert.ok(!analyse(parsed, '5').findings.some(f => f.code === 'missing_service_instance_support_group'));
});

test('CSDM 5 relationship mode is selectable while CSDM 4 remains consumes', () => {
  assert.equal(relationships('5', 'uses')[0].name, 'Uses::Used by');
  assert.equal(relationships('5', 'consumes')[0].name, 'Consumes::Consumed by');
  assert.equal(relationships('4', 'uses')[0].name, 'Consumes::Consumed by');
  assert.equal(createGraph(standardSample(), '5', 'application', 120, 'consumes')
    .edges.filter(e => e.label === 'Consumes::Consumed by').length, 2);
});

test('offering and instance support groups may differ without conflict', () => {
  const rows = standardSample();
  const result = analyse(rows, '5');
  assert.equal(result.duplicates, 0);
  assert.ok(!result.findings.some(f => f.code === 'conflicting_support_group'));
  assert.ok(!result.findings.some(f => f.code === 'multiple_business_applications'));
});

test('repeated service instance mapped to a different Business Application is flagged for review', () => {
  const a = standardSample()[0];
  const b = { ...a, business_application: 'Unrelated Business App',
    application_owner: 'Second Owner', technology_management_offering: 'Alternative' };
  const result = analyse([a, b], '5');
  assert.ok(result.findings.some(f => f.code === 'multiple_business_applications'));
  assert.equal(result.duplicates, 0);
});

test('conflicting support group on the same Service Instance is flagged', () => {
  const a = standardSample()[0];
  const b = { ...a, technology_management_offering: 'Another Offering',
    service_instance_support_group: 'Different Support' };
  const result = analyse([a, b], '5');
  assert.ok(result.findings.some(f => f.code === 'conflicting_support_group'));
});

test('instance-specific support gaps checked only where supplied as a modelled attribute', () => {
  const a = standardSample()[0];
  const b = { ...standardSample()[2], service_instance_support_group: '' };
  const result = analyse([a, b], '5');
  assert.ok(result.findings.some(f => f.code === 'missing_service_instance_support_group'));
});

test('save and resume preserves CSDM version, relationship selection, rows and remedial status', () => {
  const records = [{ ...standardSample()[0], application_owner: '' }];
  const findings = analyse(records, '5').findings.map(f =>
    ({ ...f, status: f.code === 'missing_application_owner' ? 'In progress' : 'Open' }));
  const saved = buildSession('5', 'consumes', records, findings);
  assert.equal(saved.format, SESSION_FORMAT);
  const loaded = readSession(JSON.stringify(saved));
  assert.equal(loaded.version, '5');
  assert.equal(loaded.mode, 'consumes');
  assert.equal(loaded.records[0].business_application, 'Customer Portal');
  const target = findings.find(f => f.code === 'missing_application_owner');
  assert.equal(loaded.statuses[findingKey(target)], 'In progress');
});

test('tampered, oversized, unknown or untrusted session JSON is rejected', () => {
  assert.throws(() => readSession('bad json'), /valid/);
  assert.throws(() => readSession('{}'), /supported/);
  assert.throws(() => readSession(' '.repeat(5000001)), /limit/);
  const saved = buildSession('5', 'uses', standardSample(), []);
  assert.throws(() => readSession(JSON.stringify({ ...saved, records: [{ business_application: 20 }] })),
    /Invalid value/);
  assert.throws(() => readSession(JSON.stringify({ ...saved, formatVersion: 99 })), /supported/);
});

test('session strips unknown statuses and extra unexpected record fields', () => {
  const saved = buildSession('5', 'uses', [standardSample()[0]], []);
  const loaded = readSession(JSON.stringify({
    ...saved, records: [{ ...saved.records[0], malicious_extra_field: 'ignored' }],
    statuses: { injected: 'Resolved' },
  }));
  assert.deepEqual(loaded.statuses, {});
  assert.equal(Object.keys(loaded.records[0]).includes('malicious_extra_field'), false);
});
