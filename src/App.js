"use strict";
const REQUIRED_COLUMNS = [
    'business_application',
    'service_instance',
    'technical_management_service',
    'technical_service_offering',
    'application_owner',
    'support_group',
    'environment',
    'criticality',
];
const SAMPLE_RECORDS = [
    {
        business_application: 'Customer Portal',
        service_instance: 'Customer Portal - Production',
        technical_management_service: 'Web Application Management',
        technical_service_offering: 'Managed Web Application - Gold',
        application_owner: 'Avery Chen',
        support_group: 'Digital Experience Support',
        environment: 'Production',
        criticality: 'High',
    },
    {
        business_application: 'Order Management',
        service_instance: 'Order Management - Production',
        technical_management_service: 'Commerce Platform Management',
        technical_service_offering: 'Commerce Platform - Platinum',
        application_owner: 'Morgan Patel',
        support_group: 'Commerce Operations',
        environment: 'Production',
        criticality: 'Critical',
    },
    {
        business_application: 'Employee Knowledge Base',
        service_instance: 'Employee KB - UAT',
        technical_management_service: 'Knowledge Platform Management',
        technical_service_offering: 'Knowledge Platform - Standard',
        application_owner: 'Jordan Smith',
        support_group: 'IT Collaboration Services',
        environment: 'UAT',
        criticality: 'Medium',
    },
];
const h = React.createElement;
const { useMemo, useState } = React;
const { ReactFlow: FlowCanvas, Background, Controls, MiniMap } = ReactFlow;
const normalize = (value) => String(value ?? '').trim();
const rowIsValid = (row) => REQUIRED_COLUMNS.every((column) => normalize(row[column]));
const calculateSummary = (records) => {
    const serviceCounts = records.reduce((acc, record) => {
        const serviceInstance = normalize(record.service_instance).toLowerCase();
        if (serviceInstance)
            acc[serviceInstance] = (acc[serviceInstance] ?? 0) + 1;
        return acc;
    }, {});
    const duplicateServiceInstances = Object.values(serviceCounts).filter((count) => count > 1).length;
    const missingOwner = records.filter((record) => !normalize(record.application_owner)).length;
    const missingSupportGroup = records.filter((record) => !normalize(record.support_group)).length;
    const missingServiceInstance = records.filter((record) => !normalize(record.service_instance)).length;
    const missingTechnicalServiceOffering = records.filter((record) => !normalize(record.technical_service_offering)).length;
    const validRecords = records.filter(rowIsValid).length;
    const totalRecords = records.length;
    const issueCount = missingOwner + missingSupportGroup + missingServiceInstance + missingTechnicalServiceOffering + duplicateServiceInstances;
    const maxIssues = Math.max(totalRecords * 4, 1);
    const readinessScore = totalRecords === 0 ? 0 : Math.max(0, Math.round(((maxIssues - issueCount) / maxIssues) * 100));
    return {
        totalRecords,
        validRecords,
        missingOwner,
        missingSupportGroup,
        missingServiceInstance,
        missingTechnicalServiceOffering,
        duplicateServiceInstances,
        readinessScore,
    };
};
const csvEscape = (value) => {
    if (/[",\n]/.test(value))
        return `"${value.replace(/"/g, '""')}"`;
    return value;
};
const recordsToCsv = (records) => [
    REQUIRED_COLUMNS.join(','),
    ...records.map((record) => REQUIRED_COLUMNS.map((column) => csvEscape(record[column])).join(',')),
].join('\n');
const downloadText = (filename, text, mimeType) => {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
};
const parseCsvFile = (file, setRecords, setError) => {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
            const headers = result.meta.fields ?? [];
            const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
            if (missingColumns.length > 0) {
                setError(`Missing required column${missingColumns.length > 1 ? 's' : ''}: ${missingColumns.join(', ')}`);
                setRecords([]);
                return;
            }
            const parsedRecords = result.data.map((row) => REQUIRED_COLUMNS.reduce((record, column) => {
                record[column] = normalize(row[column]);
                return record;
            }, {}));
            setRecords(parsedRecords);
            setError('');
        },
        error: (error) => setError(error.message),
    });
};
const compactLabel = (label, max = 30) => label.length > max ? `${label.slice(0, max - 1)}…` : label;
const createDiagram = (records) => {
    const unique = new Map();
    const edges = [];
    const columns = [
        { key: 'business_application', type: 'Business Application', x: 0 },
        { key: 'service_instance', type: 'Service Instance', x: 320 },
        { key: 'technical_management_service', type: 'Technical Management Service', x: 640 },
        { key: 'technical_service_offering', type: 'Technical Service Offering', x: 980 },
    ];
    records.slice(0, 35).forEach((record, rowIndex) => {
        columns.forEach((column) => {
            const value = normalize(record[column.key]);
            if (!value)
                return;
            const id = `${column.key}:${value}`;
            if (!unique.has(id)) {
                unique.set(id, { id, label: value, type: column.type, x: column.x, y: 0 });
            }
        });
        for (let i = 0; i < columns.length - 1; i += 1) {
            const sourceValue = normalize(record[columns[i].key]);
            const targetValue = normalize(record[columns[i + 1].key]);
            if (sourceValue && targetValue) {
                const source = `${columns[i].key}:${sourceValue}`;
                const target = `${columns[i + 1].key}:${targetValue}`;
                const id = `${source}->${target}`;
                if (!edges.some((edge) => edge.id === id))
                    edges.push({ id, source, target, animated: false, style: { stroke: '#315a7d' } });
            }
        }
    });
    const typeRows = new Map();
    const nodes = Array.from(unique.values()).map((node) => {
        const row = typeRows.get(node.type) ?? 0;
        typeRows.set(node.type, row + 1);
        return {
            id: node.id,
            type: 'default',
            data: { label: `${node.type}\n${compactLabel(node.label)}` },
            position: { x: node.x, y: 60 + row * 110 },
            style: {
                background: node.type === 'Service Instance' ? '#e0f2fe' : '#ffffff',
                border: '1px solid #93a4b8',
                borderRadius: '10px',
                color: '#0f2544',
                fontSize: '12px',
                padding: 8,
                width: 220,
            },
        };
    });
    return { nodes, edges };
};
const generateMarkdownReport = (records, summary) => `# CSDM Service Model Visualizer Report

## Executive Summary

- CSDM readiness score: ${summary.readinessScore}%
- Total records: ${summary.totalRecords}
- Valid records: ${summary.validRecords}
- Records missing owner: ${summary.missingOwner}
- Records missing support group: ${summary.missingSupportGroup}
- Records missing service instance: ${summary.missingServiceInstance}
- Records missing technical service offering: ${summary.missingTechnicalServiceOffering}
- Duplicate service instances: ${summary.duplicateServiceInstances}

## Scope

This browser-generated report maps Business Application to Service Instance to Technical Management Service to Technical Service Offering.

## Records

| Business Application | Service Instance | Technical Management Service | Technical Service Offering | Owner | Support Group | Environment | Criticality |
| --- | --- | --- | --- | --- | --- | --- | --- |
${records.map((record) => `| ${REQUIRED_COLUMNS.map((column) => record[column] || '—').join(' | ')} |`).join('\n')}

## Disclaimer

This tool is for educational and architecture review purposes only. Do not upload confidential, customer, production, personal, regulated or sensitive data.
`;
const StatCard = ({ label, value, tone }) => h('div', { className: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm' }, [
    h('p', { className: 'text-sm text-slate-500', key: 'label' }, label),
    h('p', { className: `mt-2 text-3xl font-semibold ${tone ?? 'text-navy'}`, key: 'value' }, value),
]);
const App = () => {
    const [records, setRecords] = useState(SAMPLE_RECORDS);
    const [error, setError] = useState('');
    const summary = useMemo(() => calculateSummary(records), [records]);
    const diagram = useMemo(() => createDiagram(records), [records]);
    const handleUpload = (event) => {
        const input = event.target;
        const file = input.files?.[0];
        if (file)
            parseCsvFile(file, setRecords, setError);
    };
    return h('main', { className: 'min-h-screen bg-gradient-to-b from-slate-50 to-white' }, [
        h('section', { className: 'border-b border-slate-200 bg-white', key: 'hero' }, h('div', { className: 'mx-auto max-w-7xl px-6 py-10 lg:px-8' }, [
            h('div', { className: 'inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800', key: 'eyebrow' }, 'Browser-only architecture review workspace'),
            h('div', { className: 'mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center', key: 'grid' }, [
                h('div', { key: 'copy' }, [
                    h('h1', { className: 'text-4xl font-semibold tracking-tight text-navy md:text-6xl', key: 'title' }, 'CSDM Service Model Visualizer'),
                    h('p', { className: 'mt-5 max-w-3xl text-lg leading-8 text-slate-600', key: 'desc' }, 'Upload a CSV and review how Business Applications connect through Service Instances, Technical Management Services and Technical Service Offerings. Designed for ServiceNow architects, enterprise architects and platform governance conversations.'),
                    h('div', { className: 'mt-7 flex flex-wrap gap-3', key: 'actions' }, [
                        h('label', { className: 'cursor-pointer rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800', key: 'upload' }, ['Upload CSV', h('input', { type: 'file', accept: '.csv,text/csv', className: 'hidden', onChange: handleUpload, key: 'input' })]),
                        h('button', { className: 'rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50', onClick: () => downloadText('csdm-sample.csv', recordsToCsv(SAMPLE_RECORDS), 'text/csv'), key: 'sample' }, 'Download sample CSV'),
                    ]),
                ]),
                h('div', { className: 'rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm', key: 'panel' }, [
                    h('p', { className: 'text-sm font-semibold uppercase tracking-wide text-steel', key: 'summarylabel' }, 'Executive Summary'),
                    h('p', { className: 'mt-4 text-5xl font-semibold text-navy', key: 'score' }, `${summary.readinessScore}%`),
                    h('p', { className: 'mt-2 text-sm text-slate-600', key: 'scorecopy' }, 'CSDM readiness score based on required data completeness, owner and support coverage, service instance integrity and offering alignment.'),
                    h('div', { className: 'mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900', key: 'disclaimer' }, 'This tool is for educational and architecture review purposes only. Do not upload confidential, customer, production, personal, regulated or sensitive data.'),
                ]),
            ]),
        ])),
        h('section', { className: 'mx-auto max-w-7xl px-6 py-8 lg:px-8', key: 'content' }, [
            error ? h('div', { className: 'mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800', key: 'error' }, error) : null,
            h('div', { className: 'mb-6 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 p-6', key: 'uploadarea' }, [
                h('div', { className: 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between', key: 'wrap' }, [
                    h('div', { key: 'text' }, [
                        h('p', { className: 'text-sm font-semibold uppercase tracking-wide text-blue-800', key: 'label' }, 'CSV upload area'),
                        h('h2', { className: 'mt-1 text-2xl font-semibold text-navy', key: 'title' }, 'Load a CSDM service model CSV'),
                        h('p', { className: 'mt-2 max-w-3xl text-sm text-slate-600', key: 'desc' }, 'Choose a CSV file with the required CSDM columns. Parsing and validation run locally in your browser only.'),
                    ]),
                    h('label', { className: 'inline-flex cursor-pointer items-center justify-center rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800', key: 'upload' }, ['Select CSV file', h('input', { type: 'file', accept: '.csv,text/csv', className: 'hidden', onChange: handleUpload, key: 'input' })]),
                ]),
            ]),
            h('div', { className: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4', key: 'stats' }, [
                h(StatCard, { label: 'Total records', value: summary.totalRecords, key: 'total' }),
                h(StatCard, { label: 'Valid records', value: summary.validRecords, tone: 'text-emerald-700', key: 'valid' }),
                h(StatCard, { label: 'Missing owners', value: summary.missingOwner, tone: 'text-amber-700', key: 'owners' }),
                h(StatCard, { label: 'Duplicate service instances', value: summary.duplicateServiceInstances, tone: 'text-red-700', key: 'dupes' }),
            ]),
            h('div', { className: 'mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4', key: 'morestats' }, [
                h(StatCard, { label: 'Missing support group', value: summary.missingSupportGroup, key: 'support' }),
                h(StatCard, { label: 'Missing service instance', value: summary.missingServiceInstance, key: 'si' }),
                h(StatCard, { label: 'Missing technical service offering', value: summary.missingTechnicalServiceOffering, key: 'tso' }),
                h('div', { className: 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm', key: 'exports' }, [
                    h('p', { className: 'text-sm text-slate-500', key: 'label' }, 'Export reports'),
                    h('div', { className: 'mt-3 flex gap-2', key: 'buttons' }, [
                        h('button', { className: 'rounded-md bg-steel px-3 py-2 text-xs font-semibold text-white', onClick: () => downloadText('csdm-report.json', JSON.stringify({ summary, records }, null, 2), 'application/json'), key: 'json' }, 'JSON'),
                        h('button', { className: 'rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700', onClick: () => downloadText('csdm-report.md', generateMarkdownReport(records, summary), 'text/markdown'), key: 'md' }, 'Markdown'),
                    ]),
                ]),
            ]),
            h('div', { className: 'mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm', key: 'diagramwrap' }, [
                h('div', { className: 'mb-4 flex items-center justify-between', key: 'heading' }, [
                    h('div', { key: 'copy' }, [
                        h('h2', { className: 'text-xl font-semibold text-navy', key: 'title' }, 'CSDM relationship diagram'),
                        h('p', { className: 'text-sm text-slate-500', key: 'desc' }, 'Business Application → Service Instance → Technical Management Service → Technical Service Offering'),
                    ]),
                ]),
                h('div', { className: 'h-[520px] rounded-xl border border-slate-200 bg-slate-50', key: 'flow' }, h(FlowCanvas, { nodes: diagram.nodes, edges: diagram.edges, fitView: true }, [h(Background, { key: 'bg' }), h(Controls, { key: 'controls' }), h(MiniMap, { key: 'map' })])),
            ]),
            h('div', { className: 'mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm', key: 'tablewrap' }, [
                h('div', { className: 'border-b border-slate-200 px-4 py-4', key: 'tablehead' }, [
                    h('h2', { className: 'text-xl font-semibold text-navy', key: 'title' }, 'Parsed CSV records'),
                    h('p', { className: 'text-sm text-slate-500', key: 'desc' }, 'Validated browser-side only. No backend, database or authentication is used.'),
                ]),
                h('div', { className: 'overflow-x-auto', key: 'scroll' }, h('table', { className: 'min-w-full divide-y divide-slate-200 text-sm' }, [
                    h('thead', { className: 'bg-slate-50', key: 'head' }, h('tr', {}, REQUIRED_COLUMNS.map((column) => h('th', { className: 'whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700', key: column }, column.replace(/_/g, ' '))))),
                    h('tbody', { className: 'divide-y divide-slate-100 bg-white', key: 'body' }, records.map((record, index) => h('tr', { key: index, className: rowIsValid(record) ? '' : 'bg-amber-50' }, REQUIRED_COLUMNS.map((column) => h('td', { className: 'whitespace-nowrap px-4 py-3 text-slate-700', key: column }, record[column] || h('span', { className: 'font-semibold text-amber-700' }, 'Missing'))))))
                ])),
            ]),
        ]),
        h('footer', { className: 'border-t border-slate-200 bg-white px-6 py-6 text-center text-sm text-slate-500', key: 'footer' }, 'CSDM Service Model Visualizer · Browser-only public static application'),
    ]);
};
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
