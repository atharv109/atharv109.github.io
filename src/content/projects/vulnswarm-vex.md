---
title: VulnSwarm-VEX
tagline: Most vulnerability alerts are noise. I wanted to know which ones actually matter.
stack:
  - Python
  - Z3
  - OSV
  - VEX
metrics:
  - label: "91.7%"
    value: 91.7% agreement with ground truth across 14 benchmark apps and 2,705 hydration queries.
links: []
order: 1
---

## Highlights

Problem: Dependency vulnerability scanners flood teams with advisories; LLM triage is non-deterministic and hard to audit.

Solution: Built a deterministic pipeline that turns OSV advisories into VEX-style verdicts using Z3-backed evidence and confined LLM reviewer notes.

Impact: 91.7% agreement with ground truth across 14 benchmark apps and 2,705 hydration queries.

## Story

Role: Research / Lead Developer
Timeframe: 2026

## Stack

Python, Z3, OSV, VEX
