'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Plus, Minus } from 'lucide-react'

interface ProductSearchProps {
  onAddToCart: (product: any, quantity: number) => void
}

export default function ProductSearch({ onAddToCart }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const supabase = createClient()

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [searchQuery, categoryFilter, products])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) throw error

      setProducts(data || [])
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data?.map(p => p.category).filter(Boolean) || []))
      setCategories(uniqueCategories.sort())
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(query)
        const itemMatch = p.wddc_item_number?.includes(query)
        return nameMatch || itemMatch
      })
    }

    setFilteredProducts(filtered)
  }

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta)
    }))
  }

  const handleAddToCart = (product: any) => {
    const quantity = quantities[product.id] || 1
    if (quantity > 0) {
      onAddToCart(product, quantity)
      setQuantities(prev => ({ ...prev, [product.id]: 0 }))
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by product name or item #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredProducts.length} of {products.length} products
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProducts.map(product => {
          const quantity = quantities[product.id] || 0
          return (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  {product.size && (
                    <p className="text-sm text-gray-500">Size: {product.size}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Item #</p>
                    <p className="text-sm font-mono text-gray-700">{product.wddc_item_number}</p>
                  </div>
                  {product.category && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Quantity controls */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(product.id, -1)}
                      disabled={quantity === 0}
                      className="p-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(product.id, 1)}
                      className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={quantity === 0}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No products found. Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  )
}

