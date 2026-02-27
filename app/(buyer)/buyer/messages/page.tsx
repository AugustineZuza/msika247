'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/header'
import { useSession } from 'next-auth/react'
import { MessageCircle, Send, ArrowLeft, User, RefreshCw } from 'lucide-react'

interface Message {
  id: string
  content: string
  senderId: string
  conversationId: string
  read: boolean
  createdAt: string
  type: 'text' | 'image'
  sender: {
    name: string
    image?: string
  }
}

interface Conversation {
  id: string
  participant1: { id: string; name: string } // seller
  participant2: { id: string; name: string } // buyer
  buyerId: string
  sellerId: string
  productId?: string
  updatedAt: string
  lastMessage?: Message
  unreadCount: number
}

export default function BuyerMessages() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      // Get current buyer user ID from session
      if (!session?.user) {
        console.error('No user session found')
        return
      }
      
      // Fetch all conversations
      const response = await fetch('/api/chat')
      const data = await response.json()
      
      console.log('All conversations from API:', data.conversations)
      console.log('Current user ID:', session.user.id)
      
      // Filter conversations where buyer is the buyer
      const buyerConversations = data.conversations?.filter((conv: any) => 
        conv.buyerId === session.user.id || conv.participant2?.id === session.user.id
      ) || []
      
      console.log('Filtered conversations for buyer:', buyerConversations)
      setConversations(buyerConversations)
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      console.log('Fetching messages for conversation:', conversationId)
      const response = await fetch(`/api/chat/simple/${conversationId}/messages`)
      const data = await response.json()
      console.log('Messages fetched:', data.messages)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.id)
  }

  const handleRefreshMessages = () => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      setSending(true)
      console.log('Buyer sending message:', {
        conversationId: selectedConversation.id,
        sellerId: selectedConversation.sellerId,
        content: newMessage.trim()
      })
      
      const response = await fetch('/api/chat/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: selectedConversation.sellerId, // Seller ID
          conversationId: selectedConversation.id, // Use existing conversation
          content: newMessage.trim()
        })
      })

      console.log('Buyer message response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Buyer message response data:', data)
        
        setNewMessage('')
        
        // Small delay to ensure message is saved before refreshing
        setTimeout(() => {
          fetchMessages(selectedConversation.id)
        }, 500)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Buyer message failed:', errorData)
        alert(`Failed to send message: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-2">Chat with sellers about products and orders</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Conversations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading conversations...</p>
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-sm">Start chatting with sellers from product pages</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => handleSelectConversation(conversation)}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                            selectedConversation?.id === conversation.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-accent/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4" />
                                <span className="font-medium text-sm">
                                  {conversation.participant1?.name || 'Seller'}
                                </span>
                              </div>
                              {conversation.productId && (
                                <Badge variant="secondary" className="text-xs">
                                  Product Inquiry
                                </Badge>
                              )}
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage?.content || 'No messages yet'}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">
                                {formatDate(conversation.updatedAt)}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {selectedConversation.participant1?.name || 'Seller'}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRefreshMessages}
                          className="text-muted-foreground hover:text-foreground"
                          title="Refresh messages"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedConversation(null)}
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      {messages.map((message) => {
                        console.log('Rendering message:', {
                          id: message.id,
                          senderId: message.senderId,
                          buyerId: selectedConversation.buyerId,
                          isBuyer: message.senderId === selectedConversation.buyerId,
                          content: message.content
                        })
                        
                        return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.senderId === selectedConversation.buyerId ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div className={`max-w-[70%] ${
                            message.senderId === selectedConversation.buyerId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          } rounded-lg p-3`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium">
                                {message.sender.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(message.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  </CardContent>
                  
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={sending || !newMessage.trim()}
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="h-[600px] flex items-center justify-center">
                  <CardContent className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground">Choose a conversation from the left to start messaging</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
