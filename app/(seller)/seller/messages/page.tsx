'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/header'
import { MessageCircle, Send, ArrowLeft, User, RefreshCw } from 'lucide-react'

// Malawi Market Branding Colors
const colors = {
  primary: '#006B3F',      // Malawi Green
  accent: '#CE1126',        // Malawi Red
  highlight: '#FCD116',     // Malawi Yellow
  lightGreen: '#e8f5e8',    // Light Green
  darkGreen: '#0a4d2e',      // Dark Green
  white: '#FFFFFF',           // White
  gray: '#6B7280',          // Gray
  lightGray: '#F3F4F6'      // Light Gray
}

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
  participant1: { id: string; name: string } // buyer
  participant2: { id: string; name: string } // seller
  buyerId: string
  sellerId: string
  productId?: string
  updatedAt: string
  lastMessage?: Message
  unreadCount: number
}

export default function SellerMessages() {
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
      // Get current seller user ID
      const sellerResponse = await fetch('/api/seller/stats')
      const sellerData = await sellerResponse.json()
      
      if (!sellerData.seller) {
        console.error('Seller not found')
        return
      }
      
      // Fetch conversations where seller is participant
      const response = await fetch('/api/chat')
      const data = await response.json()
      
      console.log('All conversations from API:', data.conversations)
      console.log('Seller data:', sellerData.seller)
      
      // Filter conversations where seller is the seller
      const sellerConversations = data.conversations?.filter((conv: any) => 
        conv.sellerId === sellerData.seller.userId
      ) || []
      
      console.log('Filtered conversations for seller:', sellerConversations)
      setConversations(sellerConversations)
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
      console.log('Seller sending message:', {
        conversationId: selectedConversation.id,
        conversationDetails: {
          id: selectedConversation.id,
          buyerId: selectedConversation.buyerId,
          sellerId: selectedConversation.sellerId,
          participant1: selectedConversation.participant1,
          participant2: selectedConversation.participant2
        },
        sellerId: selectedConversation.sellerId,
        content: newMessage.trim()
      })
      
      const response = await fetch('/api/chat/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: selectedConversation.sellerId, // Seller ID (API will figure out the recipient)
          conversationId: selectedConversation.id, // Use existing conversation
          content: newMessage.trim()
        })
      })

      console.log('Seller message response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Seller message response data:', data)
        
        setNewMessage('')
        
        // Small delay to ensure message is saved before refreshing
        setTimeout(() => {
          fetchMessages(selectedConversation.id)
        }, 500)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Seller message failed:', errorData)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="text-center">Loading messages...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] border-r-2 border-gray-200 rounded-r-none">
              <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-lg font-semibold">Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 overflow-y-auto h-[520px]">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-sm">When customers send you messages, they'll appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-green-50 ${
                          selectedConversation?.id === conversation.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-border hover:bg-green-50 hover:border-green-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4" />
                              <span className="font-medium text-sm">
                                {conversation.participant1?.name || 'Customer'}
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
              <Card className="h-[600px] flex flex-col border-l-0 border-2 border-gray-200 rounded-l-none shadow-lg">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {selectedConversation.participant1?.name || 'Customer'}
                        </h3>
                        <p className="text-sm text-gray-500">Online</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefreshMessages}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        title="Refresh messages"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedConversation(null)}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                  <div className="space-y-4">
                    {messages.map((message, index) => {
                      const isSeller = message.senderId === selectedConversation.sellerId
                      const showDate = index === 0 || 
                        new Date(message.createdAt).toDateString() !== new Date(messages[index - 1]?.createdAt).toDateString()
                      
                      return (
                        <div key={message.id}>
                          {/* Date Separator */}
                          {showDate && (
                            <div className="flex items-center justify-center my-4">
                              <div className="px-3 py-1 bg-gray-100 rounded-full">
                                <span className="text-xs text-gray-600 font-medium">
                                  {new Date(message.createdAt).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          {/* Message */}
                          <div className={`flex gap-3 mb-4 ${
                            isSeller ? 'justify-end' : 'justify-start'
                          }`}>
                            {!isSeller && (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.lightGreen }}>
                                <User className="w-4 h-4" style={{ color: colors.primary }} />
                              </div>
                            )}
                            
                            <div className={`max-w-[70%] ${
                              isSeller ? 'text-right' : 'text-left'
                            }`}>
                              <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                                isSeller 
                                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white ml-auto' 
                                  : 'bg-gray-100 text-gray-900'
                              }`} style={isSeller ? { backgroundColor: colors.primary } : {}}>
                                <div className={`flex items-center gap-2 mb-1 text-xs ${
                                  isSeller ? 'text-green-100' : 'text-gray-600'
                                }`}>
                                  <span className="font-medium">
                                    {message.sender.name}
                                  </span>
                                  <span>
                                    {new Date(message.createdAt).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className={`text-sm leading-relaxed ${
                                  isSeller ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {message.content}
                                </p>
                              </div>
                              
                              {/* Message Status */}
                              {isSeller && (
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                  <span className="text-xs text-gray-500">Delivered</span>
                                </div>
                              )}
                            </div>
                            
                            {isSeller && (
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.primary }}>
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || !newMessage.trim()}
                      size="sm"
                      className="px-6 py-3 rounded-xl text-white font-medium shadow-sm hover:shadow-md transition-shadow"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {sending ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-center mt-2">
                    <p className="text-xs text-gray-500">
                      Press Enter to send • Messages are encrypted
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center border-0 shadow-lg">
                <CardContent className="text-center p-8">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: colors.lightGreen }}>
                    <MessageCircle className="w-10 h-10" style={{ color: colors.primary }} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600 max-w-sm">
                    Choose a conversation from the left to start messaging with customers
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
