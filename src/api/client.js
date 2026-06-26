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

  // Candidates
  getCandidates: () => request('/candidates/'),
  getCandidate: (id) => request(`/candidates/${id}`),
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
  runRank: (jobId, description) =>
    request(`/jobs/${jobId}/rank`, {
      method: 'POST',
      body: JSON.stringify({ description }),
    }),
  getFunnel: (jobId) => request(`/jobs/${jobId}/funnel`),
}
