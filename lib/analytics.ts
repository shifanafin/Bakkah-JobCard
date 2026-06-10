import posthog from 'posthog-js'

function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  posthog.capture(event, props)
}

export const analytics = {
  // ── Track / public page ─────────────────────────────────
  jobSearched:        (query_type: 'job_number' | 'phone') =>
    capture('job_searched', { query_type }),
  jobFound:           (job_number: string, status: string) =>
    capture('job_found', { job_number, status }),
  jobNotFound:        (query_type: 'job_number' | 'phone') =>
    capture('job_not_found', { query_type }),
  feedbackSubmitted:  (job_number: string, rating: number) =>
    capture('feedback_submitted', { job_number, rating }),
  invoiceLinkClicked: (job_id: string) =>
    capture('invoice_link_clicked', { job_id }),

  // ── Invoice ────────────────────────────────────────────
  invoiceViewed:      (job_id: string, job_number: string) =>
    capture('invoice_viewed', { job_id, job_number }),
  invoicePrinted:     (job_id: string, job_number: string) =>
    capture('invoice_printed', { job_id, job_number }),

  // ── Workshop ───────────────────────────────────────────
  jobCardViewed:      (job_id: string, job_number: string, status: string) =>
    capture('job_card_viewed', { job_id, job_number, status }),
  jobStatusChanged:   (job_id: string, job_number: string, from_status: string, to_status: string) =>
    capture('job_status_changed', { job_id, job_number, from_status, to_status }),
  technicianAssigned: (job_id: string, job_number: string) =>
    capture('technician_assigned', { job_id, job_number }),
  jobCardCreated:     (job_id: string, job_type: string) =>
    capture('job_card_created', { job_id, job_type }),
  whatsappSent:       (job_id: string, job_number: string) =>
    capture('whatsapp_sent', { job_id, job_number }),

  // ── Auth ───────────────────────────────────────────────
  loginSuccess:       (role: string) =>
    capture('login_success', { role }),
  loginFailed:        () =>
    capture('login_failed'),
}
