export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'staff'
  department?: string
  is_active: boolean
}

export interface AuthState {
  token: string | null
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
}

export type SOPCategory = 'admission' | 'discharge' | 'infection' | 'emergency' | 'clinical' | 'safety' | 'admin'
export type SOPStatus = 'processing' | 'active' | 'archived' | 'failed'

export interface SOP {
  id: number
  title: string
  category: SOPCategory
  department?: string
  version?: string
  author?: string
  description?: string
  file_name: string
  file_type: string
  file_size_kb?: number
  status: SOPStatus
  chunk_count: number
  search_count: number
  created_at: string
}

export interface SourceDocument {
  sop_id: number
  sop_title: string
  category: string
  chunk_text: string
  relevance_score: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  content: string
  steps?: string[]
  sources?: SourceDocument[]
  confidence?: number
  timestamp: Date
}

export interface AnalyticsOverview {
  total_sops: number
  total_queries: number
  total_users: number
  avg_confidence: number
}
