'use client'

import { Plus, Minus, X, Send } from 'lucide-react'

interface CartProps {
  cart: any
  items: any[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onSubmit: () => void
}

export default function Cart({ cart, items, onUpdateQuantity, onRemoveItem, onSubmit }: CartProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const canSubmit = cart?.status === 'draft' && items.length > 0

  if (!cart) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Loading cart...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow sticky top-4">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">Cart</h2>
        <p className="text-sm text-gray-500 mt-1">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Your cart is empty</p>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {item.products?.name || 'Unknown Product'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Item #: {item.products?.wddc_item_number}
                    </p>
                    {item.products?.size && (
                      <p className="text-xs text-gray-500">Size: {item.products.size}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="ml-2 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded border border-gray-300 hover:bg-gray-50"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  {item.estimated_cost && (
                    <span className="text-sm text-gray-600">
                      ${(item.estimated_cost * item.quantity).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Send className="w-4 h-4" />
            Submit for Approval
          </button>
          {cart.status !== 'draft' && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Status: {cart.status}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

