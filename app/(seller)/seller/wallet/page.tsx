'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Header } from '@/components/header'
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Building,
  CreditCard
} from 'lucide-react'

interface WalletTransaction {
  id: string
  type: string
  amount: number
  balance: number
  description: string
  reference?: string
  metadata?: any
  createdAt: string
}

interface PayoutRequest {
  id: string
  amount: number
  status: string
  paymentMethod: string
  paymentDetails?: any
  reference?: string
  adminNotes?: string
  createdAt: string
  processedAt?: string
}

export default function SellerWalletPage() {
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showPayoutDialog, setShowPayoutDialog] = useState(false)
  const [payoutForm, setPayoutForm] = useState({
    amount: '',
    paymentMethod: '',
    phoneNumber: '',
    bankName: '',
    accountNumber: '',
    accountName: ''
  })

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      const response = await fetch('/api/seller/wallet')
      if (response.ok) {
        const data = await response.json()
        setWallet(data.wallet)
        setTransactions(data.recentTransactions || [])
        setPayouts(data.recentPayoutRequests || [])
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const requestPayout = async () => {
    try {
      const paymentDetails = payoutForm.paymentMethod === 'bank_transfer' 
        ? {
            bankName: payoutForm.bankName,
            accountNumber: payoutForm.accountNumber,
            accountName: payoutForm.accountName
          }
        : {
            phoneNumber: payoutForm.phoneNumber
          }

      const response = await fetch('/api/seller/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(payoutForm.amount),
          paymentMethod: payoutForm.paymentMethod,
          paymentDetails
        }),
      })

      if (response.ok) {
        await fetchWalletData()
        setShowPayoutDialog(false)
        setPayoutForm({
          amount: '',
          paymentMethod: '',
          phoneNumber: '',
          bankName: '',
          accountNumber: '',
          accountName: ''
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to request payout')
      }
    } catch (error) {
      console.error('Error requesting payout:', error)
      alert('Failed to request payout')
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'EARNING':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'WITHDRAWAL':
        return <ArrowDownRight className="w-4 h-4 text-red-600" />
      case 'COMMISSION':
        return <XCircle className="w-4 h-4 text-orange-600" />
      default:
        return <Wallet className="w-4 h-4 text-gray-600" />
    }
  }

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-muted rounded-lg h-8 w-48 mb-6"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-muted rounded-lg h-48"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Wallet</h1>
          <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
            <DialogTrigger asChild>
              <Button disabled={!wallet || wallet.availableBalance <= 0}>
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Request Payout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (KSh)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({...payoutForm, amount: e.target.value})}
                    placeholder={`Available: KSh ${wallet?.availableBalance?.toLocaleString() || 0}`}
                    max={wallet?.availableBalance || 0}
                  />
                </div>
                
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={payoutForm.paymentMethod} onValueChange={(value) => setPayoutForm({...payoutForm, paymentMethod: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airtel_money">Airtel Money</SelectItem>
                      <SelectItem value="tnm_mpamba">TNM Mpamba</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {payoutForm.paymentMethod === 'bank_transfer' ? (
                  <>
                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={payoutForm.bankName}
                        onChange={(e) => setPayoutForm({...payoutForm, bankName: e.target.value})}
                        placeholder="Enter bank name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountName">Account Name</Label>
                      <Input
                        id="accountName"
                        value={payoutForm.accountName}
                        onChange={(e) => setPayoutForm({...payoutForm, accountName: e.target.value})}
                        placeholder="Enter account name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        value={payoutForm.accountNumber}
                        onChange={(e) => setPayoutForm({...payoutForm, accountNumber: e.target.value})}
                        placeholder="Enter account number"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={payoutForm.phoneNumber}
                      onChange={(e) => setPayoutForm({...payoutForm, phoneNumber: e.target.value})}
                      placeholder="Enter phone number (e.g., 09xxxxxxxx)"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={requestPayout}
                    disabled={!payoutForm.amount || !payoutForm.paymentMethod || 
                      (payoutForm.paymentMethod === 'bank_transfer' ? 
                        !payoutForm.bankName || !payoutForm.accountName || !payoutForm.accountNumber :
                        !payoutForm.phoneNumber)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Request Payout
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Wallet Balance Cards */}
        {wallet && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Available Balance</p>
                    <p className="text-2xl font-bold">KSh {wallet.availableBalance.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Pending Balance</p>
                    <p className="text-2xl font-bold">KSh {wallet.pendingBalance.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Earnings</p>
                    <p className="text-2xl font-bold">KSh {wallet.totalEarnings.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Withdrawn</p>
                    <p className="text-2xl font-bold">KSh {wallet.totalWithdrawn.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount > 0 ? '+' : ''}KSh {Math.abs(transaction.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: KSh {transaction.balance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payout Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Payout Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payout requests yet
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">KSh {payout.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {payout.paymentMethod.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getPayoutStatusColor(payout.status)}>
                          {payout.status}
                        </Badge>
                        {payout.reference && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Ref: {payout.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
