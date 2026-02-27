'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
import { Send, MessageCircle, X, Paperclip, Phone, Star, Clock, Check, RefreshCw } from 'lucide-react'

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

interface Chat {
  id: string
  participant1Id: string
  participant2Id: string
  productId?: string
  messages: Message[]
  updatedAt: string
}

interface EnhancedProductChatProps {
  productId: string
  sellerId: string
  sellerName: string
  sellerImage?: string
  isOnline?: boolean
  showChat?: boolean
  setShowChat?: (show: boolean) => void
}

export default function EnhancedProductChat({ 
  productId, 
  sellerId, 
  sellerName, 
  sellerImage,
  isOnline = false,
  showChat = false,
  setShowChat
}: EnhancedProductChatProps) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  console.log('EnhancedProductChat initialized:', {
    productId,
    sellerId,
    sellerName,
    hasSession: !!session?.user
  })

  useEffect(() => {
    if (showChat) {
      fetchMessages()
      // Set up polling to check for new messages every 5 seconds
      const interval = setInterval(() => {
        if (currentConversationId) {
          fetchMessagesForConversation(currentConversationId)
        }
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [showChat])

  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for seller:', sellerId, 'and product:', productId)
      
      // First, try to find existing conversation between this buyer and seller
      const listResponse = await fetch('/api/chat')
      if (listResponse.ok) {
        const listData = await listResponse.json()
        console.log('All conversations:', listData.conversations)
        
        // Find conversation between this buyer and seller
        const existingConversation = listData.conversations?.find((conv: any) => 
          (conv.buyerId === session?.user?.id && conv.sellerId === sellerId) ||
          (conv.sellerId === session?.user?.id && conv.buyerId === sellerId)
        )
        
        console.log('Found existing conversation:', existingConversation)
        
        if (existingConversation) {
          // Use existing conversation
          setCurrentConversationId(existingConversation.id)
          const messagesResponse = await fetch(`/api/chat/simple/${existingConversation.id}/messages`)
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json()
            setMessages(messagesData.messages || [])
            setUnreadCount(0)
            scrollToBottom()
            return
          }
        }
      }
      
      // If no existing conversation, create one
      console.log('No existing conversation found, creating new one')
      const conversationResponse = await fetch('/api/chat/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId: sellerId,
          productId: productId
        })
      })

      if (conversationResponse.ok) {
        const conversationData = await conversationResponse.json()
        console.log('New conversation created:', conversationData)
        
        // Store conversation ID for polling
        if (conversationData.conversation?.id) {
          setCurrentConversationId(conversationData.conversation.id)
        }
        
        // Fetch messages for this conversation (should be empty for new conversation)
        const messagesResponse = await fetch(`/api/chat/simple/${conversationData.conversation.id}/messages`)
        
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          setMessages(messagesData.messages || [])
          setUnreadCount(0)
          scrollToBottom()
          return
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages from API:', error)
    }
  }

  const fetchMessagesForConversation = async (conversationId: string) => {
    try {
      console.log('Polling for new messages in conversation:', conversationId)
      const messagesResponse = await fetch(`/api/chat/simple/${conversationId}/messages`)
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        const newMessages = messagesData.messages || []
        
        // Only update if we have new messages
        if (newMessages.length > messages.length) {
          console.log('Found new messages:', newMessages.length - messages.length)
          setMessages(newMessages)
          scrollToBottom()
        }
      }
    } catch (error) {
      console.error('Failed to poll messages:', error)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleRefreshMessages = async () => {
    if (currentConversationId) {
      await fetchMessagesForConversation(currentConversationId)
    } else {
      await fetchMessages()
    }
  }

  const handleFileUpload = () => {
    // Create file input element
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.multiple = false
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && session?.user) {
        await handleImageUpload(file)
      }
    }
    fileInput.click()
  }

  const handleImageUpload = async (file: File) => {
    setLoading(true)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      
      // TODO: Implement actual image upload API
      console.log('Image upload not yet implemented')
      setLoading(false)
    } catch (error) {
      console.error('Failed to upload image:', error)
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    console.log('Send button clicked!', { newMessage, session: session?.user })
    if (!newMessage.trim() || !session?.user) {
      console.log('Send blocked - no message or no session')
      return
    }

    setLoading(true)
    
    try {
      // Use the database API
      console.log('Sending to database API...')
      console.log('Request payload:', {
        sellerId: sellerId,
        productId: productId,
        content: newMessage.trim(),
        type: 'text'
      })
      
      const response = await fetch('/api/chat/simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellerId: sellerId,
          productId: productId,
          content: newMessage.trim(),
          type: 'text'
        })
      })

      console.log('Database API response status:', response.status)
      console.log('Database API response headers:', response.headers)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Message sent to database:', data)
        
        if (data.success && data.message) {
          setMessages(prev => [...prev, data.message])
          setNewMessage('')
          scrollToBottom()
          
          // Update conversation ID if returned
          if (data.conversationId) {
            setCurrentConversationId(data.conversationId)
          }
          
          setLoading(false)
          return
        } else {
          console.error('API returned success but no message:', data)
          alert(`Failed to send message: Invalid response from server`)
        }
      } else {
        console.error('Database API failed:', response.status)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error data:', errorData)
        alert(`Failed to send message: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Database API error:', error)
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (!showChat) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        {/* Floating Chat Button */}
        <Button
          onClick={() => setShowChat?.(true)}
          className="w-14 h-14 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 relative"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F97316] text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col">
      {/* Chat Header */}
      <div className="bg-[#2563EB] text-white p-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-full overflow-hidden">
                <img 
                  src={sellerImage || '/api/placeholder/40/40'} 
                  alt={sellerName}
                  className="w-full h-full object-cover"
                />
              </div>
              {isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#22C55E] rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <p className="font-semibold">{sellerName}</p>
              <p className="text-xs text-white/80">
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshMessages}
              className="text-white hover:bg-white/20 rounded-lg"
              title="Refresh messages"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 rounded-lg"
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat?.(false)}
              className="text-white hover:bg-white/20 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.senderId === session?.user?.id
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            <div className={`max-w-[80%] ${
              message.senderId === session?.user?.id
                ? 'bg-[#2563EB] text-white'
                : 'bg-white text-gray-900'
            } rounded-2xl p-3 shadow-md`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden">
                  <img 
                    src={message.sender.image || '/api/placeholder/24/24'} 
                    alt={message.sender.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs font-medium">
                  {message.sender.name}
                </span>
                <span className={`text-xs ${
                  message.senderId === session?.user?.id
                    ? 'text-white/70'
                    : 'text-gray-500'
                }`}>
                  {formatTime(message.createdAt)}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.type === 'image' && (
                    <div className="mt-2">
                      <img 
                        src={message.content} 
                        alt="Shared image" 
                        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(message.content, '_blank')}
                      />
                    </div>
                  )}
              {message.senderId === session?.user?.id && (
                <div className="flex items-center gap-1 mt-1">
                  <Check className="w-3 h-3 text-white/70" />
                  <span className="text-xs text-white/70">Read</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 rounded-2xl p-3 shadow-md">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">Seller is typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleFileUpload}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-[#2563EB] rounded-lg"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-sm"
            disabled={!session?.user}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !newMessage.trim() || !session?.user}
            className="bg-[#F97316] hover:bg-[#F97316]/90 text-white px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {!session?.user && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Please log in to send messages
          </p>
        )}
      </div>
    </div>
  )
}
