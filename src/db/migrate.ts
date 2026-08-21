import type { CertFamily } from '@/content/schema'

/**
 * Legacy-data normalisation, kept deliberately pure and free of any Dexie
 * import so that the Dexie upgrade hook and `restoreBackup` can share it.
 *
 * That sharing is the point: without it, importing a backup taken before the
 * families refactor would write pre-refactor rows straight back into an
 * upgraded table, and the drill queue would quietly empty for anyone who
 * restored an old export.
 *
 * The mapping below is frozen history, not configuration. These two version ids
 * are the only ones that ever existed before content was tagged by family, so
 * this table never grows — a new exam version tags content by family from the
 * start and needs nothing here.
 */
const LEGACY_CERT_FAMILY: Record<string, CertFamily> = {
  'SAA-C03': 'saa',
  'DVA-C02': 'dva',
}

/** Cert ids stored on an old SRS row -> the families that row should carry. */
export function familiesFromLegacyCerts(certs: readonly unknown[]): CertFamily[] {
  const out = new Set<CertFamily>()
  for (const value of certs) {
    if (typeof value !== 'string') continue
    const family = LEGACY_CERT_FAMILY[value]
    if (family) out.add(family)
  }
  return [...out]
}

/**
 * Normalises one SRS row, whichever shape it arrives in. Idempotent: a row that
 * already carries `families` is returned unchanged, so this is safe to run over
 * a mixed backup.
 */
export function normaliseSrsRow<T extends Record<string, unknown>>(row: T): T {
  if (Array.isArray(row.families)) {
    if ('certs' in row) delete (row as Record<string, unknown>).certs
    return row
  }
  const legacy = Array.isArray(row.certs) ? row.certs : []
  ;(row as Record<string, unknown>).families = familiesFromLegacyCerts(legacy)
  delete (row as Record<string, unknown>).certs
  return row
}
