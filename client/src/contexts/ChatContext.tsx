import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

export interface ChatMessage {
  sender: string
  text: string
  timestamp: Date
}

interface ChatContextValue {
  messages: ChatMessage[]
  addMessage: (sender: string, text: string) => void
}

const ChatCtx = createContext<ChatContextValue | null>(null)

export function useChat() {
  const ctx = useContext(ChatCtx)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const addMessage = useCallback((sender: string, text: string) => {
    setMessages(prev => [...prev, { sender, text, timestamp: new Date() }])
  }, [])

  return (
    <ChatCtx.Provider value={{ messages, addMessage }}>
      {children}
    </ChatCtx.Provider>
  )
}
