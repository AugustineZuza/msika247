'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  Search, 
  Filter, 
  Phone, 
  Star, 
  Clock, 
  Check, 
  Send,
  MoreVertical,
  Archive,
  Trash2,
  User,
  Package,
  ArrowLeft
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

// Malawi-inspired color palette
const colors = {
  primary: '#006B3F',      // Deep Green
  accent: '#CE1126',       // Warm Red
  highlight: '#FCD116',    // Golden Yellow
  background: '#FAFAFA',   // Soft Off-White
  white: '#FFFFFF',
  darkGreen: '#004d2e',    // Darker green for accents
  lightGreen: '#e8f5e8'    // Very light green
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: 'BUYER' | 'SELLER'
  receiverId: string
  content: string
  createdAt: string
  isRead: boolean
  senderAvatar?: string
}

interface Conversation {
  id: string
  orderId?: string
  productId?: string
  status: string
  createdAt: string
  updatedAt: string
  product?: {
    id: string
    name: string
    image: string
  }
  order?: {
    id: string
    status: string
    total: number
  }
  otherUser: {
    id: string
    name: string
    image: string
  }
  lastMessage?: {
    id: string
    content: string
    type: string
    senderId: string
    createdAt: string
  }
  unreadCount: number
}

function MessagesContent() {
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    // Get conversationId from URL
    const conversationId = searchParams.get('conversationId')
    if (conversationId) {
      setSelectedConversation(conversationId)
      fetchMessages(conversationId)
    }
    fetchConversations()
  }, [searchParams])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true)
      const response = await fetch(`/api/messages?conversationId=${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation,
          content: newMessage.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        
        // Update conversation in list
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation 
            ? { ...conv, lastMessage: data.message, updatedAt: data.message.createdAt }
            : conv
        ))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedConversationData = conversations.find(conv => conv.id === selectedConversation)

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-200px)]">
              <CardContent className="p-0">
                {/* Search */}
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                
                {/* Conversations */}
                <div className="overflow-y-auto h-[calc(100vh-280px)]">
                  {loading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                          <div className="w-10 h-10 bg-muted rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start a conversation from an order or product page</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                            selectedConversation === conversation.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedConversation(conversation.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                              {conversation.otherUser.image ? (
                                <img 
                                  src={conversation.otherUser.image} 
                                  alt={conversation.otherUser.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-5 h-5" style={{ color: colors.primary }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{conversation.otherUser.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(conversation.updatedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage?.content || 'No messages yet'}
                              </p>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversationData ? (
              <Card className="h-[calc(100vh-200px)] flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                          {selectedConversationData.otherUser.image ? (
                            <img 
                              src={selectedConversationData.otherUser.image} 
                              alt={selectedConversationData.otherUser.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5" style={{ color: colors.primary }} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{selectedConversationData.otherUser.name}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Star className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messagesLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 bg-muted rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-muted rounded w-3/4"></div>
                              <div className="h-3 bg-muted rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {messages.map((message, index) => (
                          <div key={message.id} className={`flex gap-3 ${message.senderRole === 'BUYER' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.senderRole === 'BUYER' ? 'bg-blue-100' : 'bg-green-100'
                            }`}>
                              {message.senderAvatar ? (
                                <img 
                                  src={message.senderAvatar} 
                                  alt={message.senderName}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4" style={{ color: colors.primary }} />
                              )}
                            </div>
                            <div className={`max-w-[70%] rounded-lg p-3 ${
                              message.senderRole === 'BUYER' ? 'bg-muted text-foreground' : 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                              <div className={`flex items-center gap-2 mt-1 text-xs ${
                                message.senderRole === 'BUYER' ? 'text-muted-foreground' : 'text-green-100'
                              }`}>
                                <Clock className="w-3 h-3" />
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <Button type="submit" disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[calc(100vh-200px)]">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground mb-6">
                      Choose a conversation from the left to start messaging
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  )
}

