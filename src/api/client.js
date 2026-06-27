const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Health
  health: () => request('/health'),

  // Auth
  checkRecruiterPassword: (password) =>
    request('/auth/recruiter', { method: 'POST', body: JSON.stringify({ password }) }),

  // Candidates
  getCandidates: () => request('/candidates/'),
  getCandidate: (id) => request(`/candidates/${id}`),
  getResumeFileUrl: (id) => `${BASE}/candidates/${id}/resume-file`,
  clearCandidates: () =>
    fetch(`${BASE}/candidates/`, { method: 'DELETE' })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }))
          throw new Error(err.detail || `HTTP ${res.status}`)
        }
        return res.json()
      }),
  submitCandidate: (formData) =>
    fetch(`${BASE}/candidates/`, { method: 'POST', body: formData })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }))
          throw new Error(err.detail || `HTTP ${res.status}`)
        }
        return res.json()
      }),

  // Jobs
  getJob: (id) => request(`/jobs/${id}`),
  createJob: (data) => request('/jobs/', { method: 'POST', body: JSON.stringify(data) }),
  getRanked: (jobId) => request(`/jobs/${jobId}/rank`),
  // Returns {task_id} immediately — use getRankStatus to poll
  startRank: (jobId, description) =>
    request(`/jobs/${jobId}/rank`, {
      method: 'POST',
      body: JSON.stringify({ description }),
    }),
  getRankStatus: (jobId, taskId) => request(`/jobs/${jobId}/rank/status/${taskId}`),
  getFunnel: (jobId) => request(`/jobs/${jobId}/funnel`),
}
