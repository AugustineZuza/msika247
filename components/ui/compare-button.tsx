'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/use-toast'
import { 
  GitCompare, 
  Plus, 
  Check, 
  X, 
  ArrowRight 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompareButtonProps {
  productId: string
  productName: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  showText?: boolean
  onCompare?: (productIds: string[]) => void
}

export function CompareButton({ 
  productId, 
  productName, 
  className = '',
  variant = 'outline',
  size = 'sm',
  showText = false,
  onCompare
}: CompareButtonProps) {
  const [isInCompare, setIsInCompare] = useState(false)
  const [compareList, setCompareList] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCompareList()
  }, [])

  const loadCompareList = () => {
    try {
      const saved = localStorage.getItem('compareProducts')
      const list = saved ? JSON.parse(saved) : []
      setCompareList(list)
      setIsInCompare(list.includes(productId))
    } catch (error) {
      console.error('Failed to load compare list:', error)
    }
  }

  const toggleCompare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setLoading(true)

    try {
      let newList = [...compareList]

      if (isInCompare) {
        // Remove from compare list
        newList = newList.filter(id => id !== productId)
        setIsInCompare(false)
        toast({
          title: "Removed from Comparison",
          description: `${productName} removed from comparison`
        })
      } else {
        // Add to compare list
        if (newList.length >= 4) {
          toast({
            title: "Comparison Limit Reached",
            description: "You can compare maximum 4 products at once",
            variant: "destructive"
          })
          setLoading(false)
          return
        }

        newList.push(productId)
        setIsInCompare(true)
        toast({
          title: "Added to Comparison",
          description: `${productName} added to comparison`
        })

        // Check if we should redirect to compare page
        if (newList.length >= 2) {
          setTimeout(() => {
            toast({
              title: "Ready to Compare",
              description: "Click 'Compare Now' to see side-by-side comparison",
              action: (
                <Button 
                  size="sm" 
                  onClick={() => window.location.href = `/compare?ids=${newList.join(',')}`}
                >
                  Compare Now
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )
            })
          }, 1000)
        }
      }

      // Save to localStorage
      localStorage.setItem('compareProducts', JSON.stringify(newList))
      setCompareList(newList)

      // Callback
      if (onCompare) {
        onCompare(newList)
      }

    } catch (error) {
      console.error('Failed to toggle compare:', error)
      toast({
        title: "Error",
        description: "Failed to update comparison list",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const goToCompare = () => {
    if (compareList.length >= 2) {
      window.location.href = `/compare?ids=${compareList.join(',')}`
    }
  }

  if (isInCompare) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size={size}
          onClick={toggleCompare}
          disabled={loading}
          className={cn(
            "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
            className
          )}
        >
          <Check className="w-4 h-4" />
          {showText && <span className="ml-1 text-sm">Added</span>}
        </Button>
        
        {compareList.length >= 2 && (
          <Button
            variant="default"
            size={size}
            onClick={goToCompare}
            className="bg-primary hover:bg-primary/90"
          >
            <GitCompare className="w-4 h-4" />
            {showText && <span className="ml-1 text-sm">Compare</span>}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleCompare}
      disabled={loading || compareList.length >= 4}
      className={cn(
        "transition-all duration-200",
        compareList.length >= 4 && "opacity-50 cursor-not-allowed",
        className
      )}
      title={compareList.length >= 4 ? "Maximum 4 products can be compared" : "Add to comparison"}
    >
      <GitCompare className="w-4 h-4" />
      {showText && (
        <span className="ml-2 text-sm">
          {compareList.length >= 4 ? 'Limit Reached' : 'Compare'}
        </span>
      )}
    </Button>
  )
}

// Compare Widget for showing current comparison status
export function CompareWidget({ className }: { className?: string }) {
  const [compareList, setCompareList] = useState<string[]>([])
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    loadCompareList()
  }, [])

  const loadCompareList = async () => {
    try {
      const saved = localStorage.getItem('compareProducts')
      const list = saved ? JSON.parse(saved) : []
      setCompareList(list)

      if (list.length > 0) {
        // Fetch product details
        const response = await fetch(`/api/compare?ids=${list.join(',')}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      }
    } catch (error) {
      console.error('Failed to load compare widget:', error)
    }
  }

  const removeFromCompare = (productId: string) => {
    const newList = compareList.filter(id => id !== productId)
    localStorage.setItem('compareProducts', JSON.stringify(newList))
    setCompareList(newList)
    setProducts(products.filter(p => p.id !== productId))
  }

  const clearAll = () => {
    localStorage.removeItem('compareProducts')
    setCompareList([])
    setProducts([])
  }

  if (compareList.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center">
          <GitCompare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No products to compare</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            Compare ({compareList.length}/4)
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-gray-500 hover:text-red-500"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-2">
          {products.slice(0, 3).map(product => (
            <div key={product.id} className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <img
                  src={product.images[0] || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="flex-1 truncate">{product.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFromCompare(product.id)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}

          {products.length > 3 && (
            <p className="text-xs text-gray-500 text-center">
              +{products.length - 3} more products
            </p>
          )}
        </div>

        {compareList.length >= 2 && (
          <Button
            size="sm"
            className="w-full mt-3 bg-primary hover:bg-primary/90"
            onClick={() => window.location.href = `/compare?ids=${compareList.join(',')}`}
          >
            <GitCompare className="w-3 h-3 mr-1" />
            Compare Now
          </Button>
        )}

        {compareList.length === 1 && (
          <p className="text-xs text-gray-500 text-center mt-3">
            Add 1 more product to compare
          </p>
        )}

        {compareList.length < 4 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => window.location.href = '/shop'}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Product
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
