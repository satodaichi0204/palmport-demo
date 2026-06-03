# Palm Port — 業務統合プラットフォーム (Unified Operations)

A working web app for **Palm Port Pty Ltd** (Cairns QLD) that runs two businesses on one platform — **旅行業 (PDC, tourism)** and **清掃業 (JQC, cleaning)** — built around one idea:

> **⚡ 1回入力 → 自動反映** — enter a booking once and it flows automatically through every stage:
> **予約 → ロスター → 日報 → 請求 / XERO → 給与**

Pure HTML/CSS/JS — **no build step, no server**. Data is held in a shared client-side store and persisted to the browser (`localStorage`), so everything you enter on one page is immediately reflected on every other page.

## Pages / features

| # | Page | What it does |
|---|------|--------------|
| — | **ダッシュボード** Dashboard | Live KPIs (income, cost, margin, jobs, unassigned, outstanding), the 1-input flow, today's jobs |
| 1 | **予約入力** Bookings | Create / edit bookings. One entry creates the job that flows downstream. Inline new-customer. |
| 2 | **ロスター** Roster | Drag-and-drop staff × day grid (touch + mouse via SortableJS). Assigning updates daily + payroll instantly. |
| 3 | **日報** Daily Report | Per-day job completion — start/actual times, completion notes, cleaning photos. Completing feeds invoicing + payroll. |
| 4 | **請求 / XERO** Invoicing | Auto-group completed jobs by customer → generate invoices with **GST 10%**, send to XERO (mock), mark paid, CSV export. |
| 5 | **給与計算** Payroll | Auto-computes weekly wages from roster hours × pay rate, per-staff breakdown, CSV export for payroll software. |
| — | **スタッフ・権限** Staff & Access | Manage staff, roles, pay rates, contact, and per-screen access permissions; activate/deactivate. |
| — | **顧客** Customers | Client/agent directory with channel (LINE / WhatsApp), job count, and revenue to date. |
| — | **📱 スタッフ携帯画面** Mobile | Per-staff field view of today's jobs with GPS-start / complete actions that write back to the daily report. |

Toggle **旅行業 PDC / 清掃業 JQC** in the sidebar — each business has its own staff, customers, jobs, channels and theming.

## Run locally
Open `index.html` in a browser, or serve it: `npx serve .`
(Use **↺ デモデータ初期化** in the sidebar to reset to seed data.)

## Architecture (no build step)
| File | Purpose |
|------|---------|
| `index.html` | App shell — sidebar nav, topbar, view mount |
| `styles.css` | All styling (sidebar layout, tables, forms, modals, roster, mobile) |
| `js/store.js` | **Single source of truth** — seed data, localStorage persistence, pub/sub, all business logic |
| `js/components.js` | Shared helpers — formatters, job cards, modal, toast |
| `js/router.js` | Hash router; re-renders the active view whenever the store changes |
| `js/views/*.js` | One module per page (dashboard, bookings, roster, daily, invoicing, payroll, staff, customers, mobile) |
| `js/app.js` | Bootstrap — business toggle, nav, mobile launcher |

## Deploy
Connected to GitHub → Vercel. **Push to `main` auto-deploys** to production; pull requests get preview URLs.
Live: https://palmport-demo.vercel.app
