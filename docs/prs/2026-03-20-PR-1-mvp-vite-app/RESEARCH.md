# PR #1: MVP Vite App — Research

**Created**: 2026-03-20
**Author**: @robertta

## Requirements Analysis

**Source**: Co-founder weekly sync (Mar 18, 2026) + 6 design iterations in Magic Patterns + CFO financial model analysis.

### Core Problem
Two co-founders (Robert + Jonathan) need a weekly meeting tool to:
1. Allocate their scarce hours (~115h/wk combined) across 10 opportunities
2. See the projected impact of allocation decisions in real-time
3. Track week-over-week drift and hold each other accountable
4. Lock in decisions with a shareable summary

### Design Reference
- **Magic Patterns v5.4** (final): https://www.magicpatterns.com/c/iutywzsbzqlueqndkk2xna
- **Live preview**: https://project-brilliant-parrot-971.magicpatterns.app
- **Artifact ID**: `ca031a64-f419-481a-81a0-076995ae0561` (10 files)

### Key Design Decisions (from 6 iterations)
1. **Single screen, no scrolling** — everything fits on 1440x900
2. **Table-first, not visualization-first** — "The table is the product; the orbit is the logo"
3. **Direct number inputs** — typing is faster than steppers or sliders
4. **Constraint engine** — auto-balance redistributes when over capacity (outer ring first)
5. **Plan ↔ Actuals toggle** — same table, different data mode
6. **Dynamic team and opportunities** — add/remove/rename without code changes
7. **localStorage persistence** — data survives refresh
8. **Quick command bar** — `/` opens, type `robert +5 builder` to shift hours

### Concentric Ring Model
| Ring | Color | Purpose | Examples |
|------|-------|---------|----------|
| Inner | Forest Green `#6b785e` | Repeatable Product (dog food → PMF → PLG) | Clarity Growth, Clarity Builder |
| Middle | Lighter Green `#95a888` | Platform Services (cash + platform equity) | Dayforce, Mystica Clarity Features |
| Outer | Muted Gray `#6b7280` | Pure Services & Demand Gen (cash only) | Mystica Maintenance, Intapp, SEO, Podcast |

## Current State Analysis

No app exists yet. This is a greenfield build porting 10 Magic Patterns files to a Vite + React + TypeScript project.

## Dependencies and Risks

- **Zero external dependencies** beyond React, Vite, Tailwind, lucide-react
- **Risk: adoption** — tool must feel faster than a spreadsheet or founders won't use it
- **Risk: data loss** — localStorage is browser-specific; JSON export is the backup
- **Mitigation**: Ship fast, test in real meeting (Mar 24), iterate from feedback
