'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useSession } from 'next-auth/react'
import { Send, MessageCircle, X } from 'lucide-react'

interface Message {
  id: string
  content: string
  senderId: string
  chatId: string
  read: boolean
  createdAt: string
  sender: {
    name: string
  }
}

interface Chat {
  id: string
  participant1Id: string
  participant2Id: string
  productId?: string
  messages: Message[]
  updatedAt: string
}

interface ProductChatProps {
  productId: string
  sellerId: string
  sellerName: string
}

export default function ProductChat({ productId, sellerId, sellerName }: ProductChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Mock chat data for now - replace with actual API calls
  const mockChat: Chat = {
    id: 'mock-chat-id',
    participant1Id: sellerId,
    participant2Id: session?.user?.id || '',
    productId,
    messages: [
      {
        id: '1',
        content: 'Hello! I\'m interested in this product. Can you tell me more about it?',
        senderId: session?.user?.id || '',
        chatId: 'mock-chat-id',
        read: false,
        createdAt: new Date().toISOString(),
        sender: { name: session?.user?.name || 'Customer' }
      }
    ],
    updatedAt: new Date().toISOString()
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !session?.user) return

    setLoading(true)
    
    // Mock API call - replace with actual API
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: newMessage,
        senderId: session?.user?.id || '',
        chatId: mockChat.id,
        read: false,
        createdAt: new Date().toISOString(),
        sender: { name: session?.user?.name || 'Customer' }
      }

      setMessages(prev => [...prev, userMessage])
      setNewMessage('')
      setLoading(false)
    }, 1000)
  }

  return (
    <Card className="bg-white border-0 shadow-xl rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Chat with Seller</h3>
            <p className="text-sm text-gray-600">{sellerName}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4 h-96 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === session?.user?.id
                  ? 'justify-end'
                  : 'justify-start'
              } mb-4`}
            >
              <div className={`max-w-xs lg:max-w-md ${
                message.senderId === session?.user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              } rounded-2xl p-4 shadow-lg`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="font-medium text-sm">
                    {message.sender.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleString()}
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={!session?.user}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !newMessage.trim() || !session?.user}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
