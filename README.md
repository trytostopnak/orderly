# Orderly

A calmer desk for a busy kitchen. Turn a pasted customer message into a reviewed bakery order and a combined preparation list.

## Run it

No build, package installation, database or API key is needed.

```bash
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Keep the server running. Opening index.html directly as a file may block JavaScript modules.

The public app is https://orderly-bakery-workbench.ablecod4.chatgpt.site.

## Project deliverables

| Deliverable | Link |
| --- | --- |
| Live project | [Open Orderly](https://orderly-bakery-workbench.ablecod4.chatgpt.site/) |
| GitHub repository | [trytostopnak/orderly](https://github.com/trytostopnak/orderly) |
| Demo video | [90-second MP4](dist/demo.mp4) |
| Case study | [Five-page PDF](dist/case-study.pdf) |
| Optional n8n workflow | [Workflow JSON](workflows/Orderly_n8n_Workflow.json) |

The video is a captioned animated walkthrough built from actual parser output and fictional orders. It is not a browser screen recording. [Optional captions](docs/Orderly_Demo_Captions.srt) are included. The case study documents the implementation, checks, limits and customer-validation plan.

## A one-minute demonstration

1. Choose **Clear order** in Message desk, then **Create order draft**.
2. Confirm the message date, customer, due date, time and quantities. Six choco chip cookies at INR 65 and four brownies at INR 90 total INR 750.
3. Tick the review checkbox and save. Open the order to copy a reply draft.
4. Change its status to Baking, then inspect Kitchen prep.
5. Try **Missing details** to see uncertainty and dietary/change flags. Nothing is automatically sent or accepted.

## Included features

- English product matching using an editable menu and aliases.
- Quantities, dozens, relative dates, explicit dates, time and pickup/delivery extraction.
- Missing-detail, changed-request and dietary flags with mandatory manual review.
- Per-piece INR prices and totals; delivery fees and taxes excluded.
- Order statuses, search, kitchen aggregation, reply draft and print layout.
- CSV export with spreadsheet-formula protection, JSON backup/restore and fictional sample data.
- Responsive layouts, labelled inputs, keyboard-accessible native dialogs, reduced-motion support.

## Honest scope

This prototype uses deterministic local text rules, **not a language model**. It does not connect to WhatsApp, send messages, take payments, guarantee dietary suitability or synchronize between devices. Unusual phrasing, amendments, mixed languages, bundles and products outside the menu require manual checking. Saved orders have price snapshots. Their content cannot currently be edited after saving; delete and recreate an incorrect order. Menu updates affect new drafts.

Data is held in this browser's localStorage. Shared browser profiles can see the same local data. Clearing browser storage removes it. Export a backup first. The hosting provider still serves the page and may handle standard access logs. The application itself does not send message text to a server.

The app's fictional sample orders are visibly marked. No interviews, signed LOIs, customers, revenue or measured customer time savings are claimed.

## Verify

Node.js 20 or newer:

```bash
npm test
npm run check
```

Fourteen core checks passed at handoff. The n8n Code-node JavaScript was executed with a local input shim and returned the expected INR 750 sample total. Import/execution inside a real n8n instance remains unverified. Full browser interaction and screenshot testing were unavailable in this session; test the hosted review version before judging or collecting real orders.

## Files

- `dist/`: complete browser app.
- `tests/core.test.mjs`: order logic checks.
- `workflows/Orderly_n8n_Workflow.json`: optional n8n manual workflow.
- `docs/Sample_Workflow_Output.json`: actual output from the embedded workflow code.
- `docs/GTM_Execution_Kit.md`: interviews, evidence logs, check-ins, pilot interest form and the 14-day plan.
- `docs/Pitch_and_Demo_Script.md`: six pitch sections and a 90-second demonstration plan.
- `docs/Submission_Status.md`: deliverables and remaining work.

## Optional n8n workflow

Import `workflows/Orderly_n8n_Workflow.json` through **Import from File**. The three nodes are Manual Trigger, Message input, and Parse and flag for review. Open Message input to replace the fictional text and its `referenceDate` (ISO YYYY-MM-DD). Execute manually and inspect the output. The code returns `reviewRequired: true` for every draft. It never sends a reply or writes a customer record. Review an incomplete confirmation draft before using it.

The app does not depend on n8n. Hosting or running n8n may have its own cost.

Primary references consulted 10 October 2026:
- https://docs.n8n.io/workflows/export-import/
- https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/

## Next development step

Interview bakers before expanding. If their real messages require language-model extraction, add it behind an explicit server endpoint with output validation, consent, cost controls and the existing manual review step. Do not rename this prototype as AI-powered without implementing and testing that change.
