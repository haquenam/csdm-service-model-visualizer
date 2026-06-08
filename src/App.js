"use strict";
const SEVERITY_STYLES = {
    High: 'border-red-200 bg-red-50 text-red-800 ring-red-100',
    Medium: 'border-amber-200 bg-amber-50 text-amber-800 ring-amber-100',
    Low: 'border-blue-200 bg-blue-50 text-blue-800 ring-blue-100',
};
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
const getPriorityIssues = (summary) => [
    {
        name: 'Missing service instance',
        severity: 'High',
        count: summary.missingServiceInstance,
        action: 'Confirm or create the correct service instance before service model review.',
    },
    {
        name: 'Duplicate service instance',
        severity: 'High',
        count: summary.duplicateServiceInstances,
        action: 'Review naming and ownership to confirm whether records represent the same service instance or separate service instances.',
    },
    {
        name: 'Missing technical service offering',
        severity: 'Medium',
        count: summary.missingTechnicalServiceOffering,
        action: 'Define the technical service offering or support model before downstream governance.',
    },
    {
        name: 'Missing support group',
        severity: 'Medium',
        count: summary.missingSupportGroup,
        action: 'Assign the operational support group responsible for service ownership and support.',
    },
    {
        name: 'Missing application owner',
        severity: 'Low',
        count: summary.missingOwner,
        action: 'Confirm the accountable application owner before formal review.',
    },
].filter((issue) => issue.count > 0);
const priorityIssuesToMarkdown = (issues) => issues.length === 0
    ? 'No priority validation issues detected.'
    : [
        '| Issue | Severity | Count | Recommended action |',
        '| --- | --- | --- | --- |',
        ...issues.map((issue) => `| ${issue.name} | ${issue.severity} | ${issue.count} | ${issue.action} |`),
    ].join('\n');
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
const parseCsvFile = (file, setRecords, setError, onSuccess) => {
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
            onSuccess?.();
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

## Priority Issues

${priorityIssuesToMarkdown(getPriorityIssues(summary))}

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
const SeverityBadge = ({ severity }) => h('span', {
    className: `inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${SEVERITY_STYLES[severity]}`,
}, severity);
const PriorityIssuesPanel = ({ issues }) => h('div', { className: 'mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm', key: 'priority-issues' }, [
    h('div', { className: 'border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6', key: 'head' }, [
        h('p', { className: 'text-sm font-semibold uppercase tracking-wide text-steel', key: 'eyebrow' }, 'Validation prioritisation'),
        h('h2', { className: 'mt-1 text-xl font-semibold text-navy', key: 'title' }, 'Priority Issues'),
        h('p', { className: 'mt-1 text-sm text-slate-600', key: 'desc' }, 'Detected validation gaps are ordered by enterprise review urgency with severity, volume and recommended next action.'),
    ]),
    issues.length === 0
        ? h('div', { className: 'px-4 py-6 text-sm font-medium text-emerald-800 sm:px-6', key: 'empty' }, 'No priority validation issues detected. Continue reviewing the relationship diagram and parsed records for model accuracy.')
        : h('div', { className: 'overflow-x-auto', key: 'tablewrap' }, h('table', { className: 'min-w-full divide-y divide-slate-200 text-sm', key: 'table' }, [
            h('thead', { className: 'bg-white', key: 'head' }, h('tr', {}, [
                h('th', { className: 'whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700 sm:px-6', key: 'issue' }, 'Issue name'),
                h('th', { className: 'whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700', key: 'severity' }, 'Severity'),
                h('th', { className: 'whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700', key: 'count' }, 'Count'),
                h('th', { className: 'min-w-[320px] px-4 py-3 text-left font-semibold text-slate-700 sm:pr-6', key: 'action' }, 'Recommended action'),
            ])),
            h('tbody', { className: 'divide-y divide-slate-100 bg-white', key: 'body' }, issues.map((issue) => h('tr', { className: issue.severity === 'High' ? 'bg-red-50/40' : '', key: issue.name }, [
                h('td', { className: 'whitespace-nowrap px-4 py-4 font-semibold text-navy sm:px-6', key: 'name' }, issue.name),
                h('td', { className: 'whitespace-nowrap px-4 py-4', key: 'severity' }, h(SeverityBadge, { severity: issue.severity })),
                h('td', { className: 'whitespace-nowrap px-4 py-4 text-lg font-semibold text-slate-900', key: 'count' }, issue.count),
                h('td', { className: 'px-4 py-4 leading-6 text-slate-700 sm:pr-6', key: 'action' }, issue.action),
            ]))),
        ])),
]);
const App = () => {
    const [records, setRecords] = useState([]);
    const [error, setError] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [hasAnalysisRun, setHasAnalysisRun] = useState(false);
    const [uploadInputKey, setUploadInputKey] = useState(0);
    const summary = useMemo(() => calculateSummary(records), [records]);
    const diagram = useMemo(() => createDiagram(records), [records]);
    const priorityIssues = useMemo(() => getPriorityIssues(summary), [summary]);
    const uploadButtonClass = 'inline-flex cursor-pointer items-center justify-center rounded-lg border border-navy bg-navy px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-500';
    const uploadButtonStyle = { backgroundColor: '#0f2544', color: '#ffffff' };
    const secondaryButtonClass = 'inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50';
    const workflowStepClass = 'rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm';
    const handleUpload = (event) => {
        const input = event.target;
        const file = input.files?.[0] ?? null;
        setSelectedFile(file);
        setRecords([]);
        setHasAnalysisRun(false);
        setError('');
    };
    const handleRunAnalysis = () => {
        if (!selectedFile) {
            setError('Select a CSV file before running analysis.');
            return;
        }
        parseCsvFile(selectedFile, setRecords, (message) => {
            setError(message);
            setHasAnalysisRun(false);
        }, () => setHasAnalysisRun(true));
    };
    const handleClearUploadedData = () => {
        setSelectedFile(null);
        setRecords([]);
        setError('');
        setHasAnalysisRun(false);
        setUploadInputKey((current) => current + 1);
    };
    return h('main', { className: 'min-h-screen bg-gradient-to-b from-slate-50 to-white' }, [
        h('section', { className: 'border-b border-slate-200 bg-white', key: 'hero' }, h('div', { className: 'mx-auto max-w-7xl px-6 py-10 lg:px-8' }, [
            h('div', { className: 'inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800', key: 'eyebrow' }, 'Browser-only architecture review workspace'),
            h('div', { className: 'mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center', key: 'grid' }, [
                h('div', { key: 'copy' }, [
                    h('h1', { className: 'text-4xl font-semibold tracking-tight text-navy md:text-6xl', key: 'title' }, 'CSDM Service Model Visualizer'),
                    h('p', { className: 'mt-5 max-w-3xl text-lg leading-8 text-slate-600', key: 'desc' }, 'Review how Business Applications connect through Service Instances, Technical Management Services and Technical Service Offerings. The CSV workflow is staged so architects can select a file, confirm it, then run analysis intentionally.'),
                    h('div', { className: 'mt-7 grid gap-3 sm:grid-cols-4', key: 'steps' }, [
                        h('div', { className: workflowStepClass, key: 'upload-step' }, '1. Upload CSV'),
                        h('div', { className: workflowStepClass, key: 'selected-step' }, '2. Selected file'),
                        h('div', { className: workflowStepClass, key: 'run-step' }, '3. Run Analysis'),
                        h('div', { className: workflowStepClass, key: 'review-step' }, '4. Review Results'),
                    ]),
                ]),
                h('div', { className: 'rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm', key: 'panel' }, [
                    h('p', { className: 'text-sm font-semibold uppercase tracking-wide text-steel', key: 'summarylabel' }, 'Executive Summary'),
                    h('p', { className: 'mt-4 text-5xl font-semibold text-navy', key: 'score' }, `${summary.readinessScore}%`),
                    h('p', { className: 'mt-2 text-sm text-slate-600', key: 'scorecopy' }, hasAnalysisRun ? 'CSDM readiness score based on required data completeness, owner and support coverage, service instance integrity and offering alignment.' : 'Select a CSV in the upload workspace and click Run Analysis to calculate the CSDM readiness score.'),
                    h('div', { className: 'mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900', key: 'status' }, hasAnalysisRun ? 'Analysis complete. Review the validation summary, relationship diagram, parsed records and export options below.' : 'Waiting for analysis. No uploaded CSV has been parsed yet.'),
                ]),
            ]),
        ])),
        h('section', { className: 'mx-auto max-w-7xl px-6 py-8 lg:px-8', key: 'content' }, [
            error ? h('div', { className: 'mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800', key: 'error' }, error) : null,
            h('div', { className: 'mb-6 rounded-2xl border border-blue-200 bg-white p-6 shadow-sm ring-1 ring-blue-100', key: 'uploadarea' }, [
                h('div', { className: 'grid gap-6 lg:grid-cols-[1fr_360px]', key: 'workspace' }, [
                    h('div', { key: 'text' }, [
                        h('p', { className: 'text-sm font-semibold uppercase tracking-wide text-blue-800', key: 'label' }, 'CSV upload area'),
                        h('h2', { className: 'mt-1 text-2xl font-semibold text-navy', key: 'title' }, 'Controlled review workspace'),
                        h('p', { className: 'mt-2 max-w-3xl text-sm text-slate-600', key: 'desc' }, 'Choose a CSV file with the required CSDM columns. The app will show the selected file name first and will not parse or analyse it until you click Run Analysis.'),
                        h('div', { className: 'mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-950', key: 'privacy' }, 'Files are processed locally in your browser. This tool does not intentionally upload your CSV to GitHub, store it in this repository, or send it to a backend server. Do not use confidential, customer, production, personal, regulated or sensitive data.'),
                        h('div', { className: 'mt-5 flex flex-wrap gap-3', key: 'sample-actions' }, [
                            h('button', { className: secondaryButtonClass, onClick: () => downloadText('csdm-sample.csv', recordsToCsv(SAMPLE_RECORDS), 'text/csv'), key: 'sample' }, 'Download sample CSV template'),
                            hasAnalysisRun ? h('button', { className: secondaryButtonClass, onClick: handleClearUploadedData, key: 'clear' }, 'Clear uploaded data') : null,
                        ]),
                    ]),
                    h('div', { className: 'rounded-2xl border border-slate-200 bg-slate-50 p-4', key: 'controls' }, [
                        h('div', { className: 'flex flex-col gap-3', key: 'control-stack' }, [
                            h('label', { className: uploadButtonClass, htmlFor: 'main-csv-upload', key: 'upload', style: uploadButtonStyle }, ['Upload CSV', h('input', { id: 'main-csv-upload', key: uploadInputKey, type: 'file', accept: '.csv,text/csv', className: 'sr-only', 'aria-label': 'Upload CSV file', onChange: handleUpload })]),
                            h('div', { className: 'rounded-xl border border-slate-200 bg-white p-4', key: 'selected' }, [
                                h('p', { className: 'text-xs font-semibold uppercase tracking-wide text-slate-500', key: 'label' }, 'Selected file'),
                                h('p', { className: `mt-2 break-words text-sm font-semibold ${selectedFile ? 'text-navy' : 'text-slate-500'}`, key: 'name' }, selectedFile ? selectedFile.name : 'No CSV selected'),
                            ]),
                            h('button', { className: 'inline-flex items-center justify-center rounded-lg border border-navy bg-navy px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50', disabled: !selectedFile, onClick: handleRunAnalysis, key: 'run', style: uploadButtonStyle }, 'Run Analysis'),
                        ]),
                    ]),
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
                        h('button', { className: 'rounded-md bg-steel px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50', disabled: records.length === 0, onClick: () => downloadText('csdm-report.json', JSON.stringify({ summary, records }, null, 2), 'application/json'), key: 'json' }, 'JSON'),
                        h('button', { className: 'rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50', disabled: records.length === 0, onClick: () => downloadText('csdm-report.md', generateMarkdownReport(records, summary), 'text/markdown'), key: 'md' }, 'Markdown'),
                    ]),
                ]),
            ]),
            hasAnalysisRun ? h(PriorityIssuesPanel, { issues: priorityIssues, key: 'prioritypanel' }) : null,
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
                    h('p', { className: 'text-sm text-slate-500', key: 'desc' }, hasAnalysisRun ? 'Validated browser-side only. No backend, database or authentication is used.' : 'Run analysis after selecting a CSV to populate parsed records.'),
                ]),
                h('div', { className: 'overflow-x-auto', key: 'scroll' }, records.length === 0 ? h('div', { className: 'px-4 py-8 text-sm font-medium text-slate-500', key: 'empty' }, 'No parsed CSV records yet.') : h('table', { className: 'min-w-full divide-y divide-slate-200 text-sm', key: 'table' }, [
                    h('thead', { className: 'bg-slate-50', key: 'head' }, h('tr', {}, REQUIRED_COLUMNS.map((column) => h('th', { className: 'whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-700', key: column }, column.replace(/_/g, ' '))))),
                    h('tbody', { className: 'divide-y divide-slate-100 bg-white', key: 'body' }, records.map((record, index) => h('tr', { key: index, className: rowIsValid(record) ? '' : 'bg-amber-50' }, REQUIRED_COLUMNS.map((column) => h('td', { className: 'whitespace-nowrap px-4 py-3 text-slate-700', key: column }, record[column] || h('span', { className: 'font-semibold text-amber-700' }, 'Missing'))))))
                ])),
            ]),
        ]),
        h('footer', { className: 'border-t border-slate-200 bg-white px-6 py-6 text-center text-sm text-slate-500', key: 'footer' }, [
            'CSDM Service Model Visualizer · Built by Enamul Haque · ',
            h('a', {
                href: 'https://www.linkedin.com/in/haquenam/',
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'font-medium text-blue-700 underline-offset-4 hover:text-blue-800 hover:underline',
                key: 'linkedin',
            }, 'LinkedIn'),
        ]),
    ]);
};
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
