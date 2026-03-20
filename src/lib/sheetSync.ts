/**
 * Google Sheets sync via Apps Script web app.
 *
 * The Apps Script handles all Google Sheets API calls.
 * This module just calls the deployed web app URL.
 */

import type { TeamMember, Opportunity, DemandGen } from './types'

// Set via environment variable or hardcode after deployment
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''

export interface SheetState {
  team: TeamMember[]
  opportunities: Opportunity[]
  weeks: Record<string, Record<string, { plan: Record<string, number>; actual: Record<string, number> }>>
  demandGen: Record<string, DemandGen>
  lockIns: Array<{ weekLabel: string; timestamp: string; summary: string }>
  timestamp: string
}

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'offline'

function isConfigured(): boolean {
  return !!APPS_SCRIPT_URL
}

// ============== LOAD ==============

export async function loadFromSheet(): Promise<SheetState | null> {
  if (!isConfigured()) return null
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=load`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data as SheetState
  } catch (err) {
    console.warn('[SheetSync] Load failed:', err)
    return null
  }
}

// ============== SAVE ==============

async function post(body: Record<string, unknown>): Promise<boolean> {
  if (!isConfigured()) return false
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Apps Script requires text/plain for CORS
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return true
  } catch (err) {
    console.warn('[SheetSync] Save failed:', err)
    return false
  }
}

export async function saveTeamToSheet(team: TeamMember[]): Promise<boolean> {
  return post({ action: 'saveTeam', team })
}

export async function saveOpportunitiesToSheet(opportunities: Opportunity[]): Promise<boolean> {
  return post({ action: 'saveOpportunities', opportunities })
}

export async function saveWeekToSheet(
  weekId: string,
  weekLabel: string,
  allocations: Record<string, { plan: Record<string, number>; actual: Record<string, number> }>,
  team: TeamMember[],
): Promise<boolean> {
  return post({ action: 'saveWeek', weekId, weekLabel, allocations, team })
}

export async function saveDemandGenToSheet(weekId: string, demandGen: DemandGen): Promise<boolean> {
  return post({ action: 'saveDemandGen', weekId, demandGen })
}

export async function lockInToSheet(weekLabel: string, summary: string): Promise<boolean> {
  return post({ action: 'lockIn', weekLabel, summary })
}

// ============== DEBOUNCED SYNC ==============

let syncTimer: ReturnType<typeof setTimeout> | null = null
let pendingSync: (() => Promise<void>) | null = null
let statusCallback: ((status: SyncStatus) => void) | null = null

export function setSyncStatusCallback(cb: (status: SyncStatus) => void) {
  statusCallback = cb
}

function updateStatus(status: SyncStatus) {
  statusCallback?.(status)
}

export function debouncedSaveWeek(
  weekId: string,
  weekLabel: string,
  allocations: Record<string, { plan: Record<string, number>; actual: Record<string, number> }>,
  team: TeamMember[],
  demandGen: DemandGen,
) {
  if (!isConfigured()) return

  pendingSync = async () => {
    updateStatus('syncing')
    const [weekOk, dgOk] = await Promise.all([
      saveWeekToSheet(weekId, weekLabel, allocations, team),
      saveDemandGenToSheet(weekId, demandGen),
    ])
    updateStatus(weekOk && dgOk ? 'saved' : 'error')
  }

  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    if (pendingSync) {
      await pendingSync()
      pendingSync = null
    }
  }, 1000) // 1s debounce
}

export function isSheetConfigured(): boolean {
  return isConfigured()
}
