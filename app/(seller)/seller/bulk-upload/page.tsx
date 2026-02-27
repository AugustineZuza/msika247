'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Loader2,
  Package,
  TrendingUp
} from 'lucide-react'

interface BulkProduct {
  name: string
  description: string
  price: number
  stock: number
  category: string
  sku?: string
  images?: string[]
  tags?: string[]
}

interface UploadResult {
  success: boolean
  product?: BulkProduct
  error?: string
  index: number
}

export default function BulkUpload() {
  const { data: session } = useSession()
  const router = useRouter()
  const [csvData, setCsvData] = useState<BulkProduct[]>([])
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    fetchCategories()
  }, [session])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.map((cat: any) => cat.name))
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim())
    
    const products: BulkProduct[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const product: any = {}
      
      headers.forEach((header, index) => {
        const value = values[index]
        switch (header.toLowerCase()) {
          case 'name':
            product.name = value
            break
          case 'description':
            product.description = value
            break
          case 'price':
            product.price = parseFloat(value) || 0
            break
          case 'stock':
            product.stock = parseInt(value) || 0
            break
          case 'category':
            product.category = value
            break
          case 'sku':
            product.sku = value
            break
          case 'images':
            product.images = value ? value.split(';') : []
            break
          case 'tags':
            product.tags = value ? value.split(';') : []
            break
        }
      })
      
      if (product.name && product.price !== undefined && product.stock !== undefined) {
        products.push(product)
      }
    }
    
    setCsvData(products)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleBulkUpload = async () => {
    if (csvData.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadResults([])

    const results: UploadResult[] = []

    // First, get available categories to map category names to IDs
    let categoryMap: Record<string, string> = {}
    try {
      const categoriesResponse = await fetch('/api/categories')
      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json()
        categoryMap = categories.reduce((map: Record<string, string>, cat: any) => {
          map[cat.name.toLowerCase()] = cat.id
          return map
        }, {})
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }

    for (let i = 0; i < csvData.length; i++) {
      const product = csvData[i]
      
      try {
        // Map category name to ID, or use the first available category
        const categoryName = product.category?.trim().toLowerCase() || 'general'
        let categoryId = categoryMap[categoryName]
        
        // If no matching category, use the first available one
        if (!categoryId && Object.keys(categoryMap).length > 0) {
          categoryId = Object.values(categoryMap)[0]
        }
        
        // If still no category, skip this product or create a default
        if (!categoryId) {
          console.warn(`No category found for "${categoryName}", skipping product`)
          results.push({
            success: false,
            product,
            error: 'Category not found',
            index: i + 1
          })
          setUploadProgress(((i + 1) / csvData.length) * 100)
          continue
        }
        
        const response = await fetch('/api/seller/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...product,
            categoryId: categoryId,
          }),
        })

        if (response.ok) {
          results.push({
            success: true,
            product,
            index: i + 1
          })
        } else {
          const error = await response.json()
          results.push({
            success: false,
            product,
            error: error.error || 'Upload failed',
            index: i + 1
          })
        }
      } catch (error) {
        results.push({
          success: false,
          product,
          error: 'Network error',
          index: i + 1
        })
      }

      setUploadProgress(((i + 1) / csvData.length) * 100)
    }

    setUploadResults(results)
    setIsUploading(false)
  }

  const downloadTemplate = () => {
    const template = `name,description,price,stock,category,sku,images,tags
Sample Product 1,"This is a sample product description",29.99,100,electronics,SKU001,"image1.jpg;image2.jpg","tag1;tag2"
Sample Product 2,"Another sample product",19.99,50,clothing,SKU002,"image3.jpg","fashion;summer"`
    
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-upload-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const successfulUploads = uploadResults.filter(r => r.success).length
  const failedUploads = uploadResults.filter(r => !r.success).length

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Product Upload</h1>
          <p className="text-gray-600 mt-2">Upload multiple products at once using CSV files</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products Ready</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{csvData.length}</div>
              <p className="text-xs text-muted-foreground">Ready to upload</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{successfulUploads}</div>
              <p className="text-xs text-muted-foreground">Uploaded successfully</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failedUploads}</div>
              <p className="text-xs text-muted-foreground">Upload failed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {uploadResults.length > 0 ? ((successfulUploads / uploadResults.length) * 100).toFixed(0) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Upload success rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>Upload a CSV file with product information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <Button onClick={downloadTemplate} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button onClick={() => document.getElementById('file-input')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                </div>

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">
                    {dragActive ? 'Drop your CSV file here' : 'Drag and drop your CSV file here'}
                  </p>
                  <p className="text-sm text-gray-500">
                    or click the button above to browse
                  </p>
                </div>

                {csvData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{csvData.length} products ready to upload</p>
                      <Button
                        onClick={handleBulkUpload}
                        disabled={isUploading}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading... {uploadProgress.toFixed(0)}%
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload All Products
                          </>
                        )}
                      </Button>
                    </div>
                    {isUploading && (
                      <Progress value={uploadProgress} className="w-full" />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Product Preview</CardTitle>
              <CardDescription>Preview of products to be uploaded</CardDescription>
            </CardHeader>
            <CardContent>
              {csvData.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {csvData.slice(0, 10).map((product, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Price:</span> ${product.price}
                        </div>
                        <div>
                          <span className="font-medium">Stock:</span> {product.stock}
                        </div>
                        <div>
                          <span className="font-medium">Category:</span> {product.category}
                        </div>
                        {product.sku && (
                          <div>
                            <span className="font-medium">SKU:</span> {product.sku}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {csvData.length > 10 && (
                    <p className="text-sm text-gray-500 text-center">
                      ... and {csvData.length - 10} more products
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No products loaded yet</p>
                  <p className="text-sm text-gray-400">Upload a CSV file to see preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {uploadResults.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Upload Results</CardTitle>
              <CardDescription>Results of the bulk upload operation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadResults.map((result) => (
                  <div
                    key={result.index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          Row {result.index}: {result.product?.name}
                        </p>
                        {!result.success && (
                          <p className="text-sm text-red-600">{result.error}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
