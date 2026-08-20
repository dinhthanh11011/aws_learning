'use client'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { DEFAULT_PROFILE } from '@/db'
import { getProfile } from '@/db/repo'
import { useEffect } from 'react'

/**
 * Live profile. Dexie's `useLiveQuery` re-renders on every write, so XP and
 * streak badges update the instant something is earned, anywhere in the app.
 */
export function useProfile() {
  const profile = useLiveQuery(() => db.profile.get('me'), [])
  useEffect(() => {
    // Create the row on first ever load.
    void getProfile()
  }, [])
  return profile ?? DEFAULT_PROFILE
}
