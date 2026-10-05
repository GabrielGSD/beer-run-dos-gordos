export const ACTIVE_WAITLIST_STATUSES = ['waiting', 'called']

export function isActiveWaitlistEntry(entry) {
  return ACTIVE_WAITLIST_STATUSES.includes(entry.status)
}
