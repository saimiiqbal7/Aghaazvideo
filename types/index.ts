export type Checkpoint = {
  id: string
  timestamp: number        // seconds
  question: string
  options: string[]
  correctIndex: number
}

export type BlitzMessage = {
  id: string
  role: 'blitz' | 'user' | 'system'
  content: string
}

