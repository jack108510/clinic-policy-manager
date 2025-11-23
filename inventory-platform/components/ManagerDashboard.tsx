'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Check, X, Edit, Download, RefreshCw } from 'lucide-react'

export default function ManagerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [carts, setCarts] = useState<any[]>([])
  const [selectedCart, setSelectedCart] = useState<any>(null)
  const [cartItems, setCartItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
    loadCarts()
  }, [])

  useEffect(() => {
    if (selectedCart) {
      loadCartItems(selectedCart.id)
    }
  }, [selectedCart])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setUser({ ...user, ...profile })
    }
  }

  const loadCarts = async () => {
    try {
      const { data, error } = await supabase
        .from('carts')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            email,
            clinic
          )
        `)
        .in('status', ['submitted', 'returned'])
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setCarts(data || [])
    } catch (error) {
      console.error('Error loading carts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCartItems = async (cartId: string) => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (*)
        `)
        .eq('cart_id', cartId)
        .order('created_at')

      if (error) throw error
      setCartItems(data || [])
    } catch (error) {
      console.error('Error loading cart items:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const approveItem = async (itemId: string, quantity: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !selectedCart) return

    try {
      // Update item
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({
          status: 'approved',
          approved_quantity: quantity
        })
        .eq('id', itemId)

      if (updateError) throw updateError

      // Log approval
      await supabase
        .from('approvals')
        .insert([{
          cart_id: selectedCart.id,
          cart_item_id: itemId,
          action: 'approved',
          performed_by: user.id,
          new_quantity: quantity
        }])

      loadCartItems(selectedCart.id)
    } catch (error) {
      console.error('Error approving item:', error)
      alert('Failed to approve item')
    }
  }

  const denyItem = async (itemId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !selectedCart) return

    try {
      // Update item
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ status: 'denied' })
        .eq('id', itemId)

      if (updateError) throw updateError

      // Log denial
      await supabase
        .from('approvals')
        .insert([{
          cart_id: selectedCart.id,
          cart_item_id: itemId,
          action: 'denied',
          performed_by: user.id
        }])

      loadCartItems(selectedCart.id)
    } catch (error) {
      console.error('Error denying item:', error)
      alert('Failed to deny item')
    }
  }

  const adjustQuantity = async (itemId: string, newQuantity: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !selectedCart) return

    const item = cartItems.find(i => i.id === itemId)
    if (!item) return

    try {
      // Update item
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({
          approved_quantity: newQuantity,
          quantity: newQuantity
        })
        .eq('id', itemId)

      if (updateError) throw updateError

      // Log adjustment
      await supabase
        .from('approvals')
        .insert([{
          cart_id: selectedCart.id,
          cart_item_id: itemId,
          action: 'quantity_adjusted',
          performed_by: user.id,
          previous_quantity: item.quantity,
          new_quantity: newQuantity
        }])

      loadCartItems(selectedCart.id)
    } catch (error) {
      console.error('Error adjusting quantity:', error)
      alert('Failed to adjust quantity')
    }
  }

  const returnCart = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !selectedCart) return

    try {
      // Update cart status
      const { error: updateError } = await supabase
        .from('carts')
        .update({ status: 'returned' })
        .eq('id', selectedCart.id)

      if (updateError) throw updateError

      // Log return
      await supabase
        .from('approvals')
        .insert([{
          cart_id: selectedCart.id,
          action: 'returned',
          performed_by: user.id,
          notes: 'Cart returned to staff for revisions'
        }])

      alert('Cart returned to staff')
      loadCarts()
      setSelectedCart(null)
    } catch (error) {
      console.error('Error returning cart:', error)
      alert('Failed to return cart')
    }
  }

  const approveCart = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !selectedCart) return

    // Check if all items are approved or denied
    const pendingItems = cartItems.filter(item => item.status === 'pending')
    if (pendingItems.length > 0) {
      alert('Please approve or deny all items before approving the cart')
      return
    }

    try {
      // Update cart status
      const { error: updateError } = await supabase
        .from('carts')
        .update({ status: 'approved' })
        .eq('id', selectedCart.id)

      if (updateError) throw updateError

      // Log approval
      await supabase
        .from('approvals')
        .insert([{
          cart_id: selectedCart.id,
          action: 'approved',
          performed_by: user.id,
          notes: 'Cart approved for ordering'
        }])

      alert('Cart approved for ordering!')
      loadCarts()
      setSelectedCart(null)
    } catch (error) {
      console.error('Error approving cart:', error)
      alert('Failed to approve cart')
    }
  }

  const exportOrder = async () => {
    if (!selectedCart) return

    try {
      const response = await fetch(`/api/export-order?cartId=${selectedCart.id}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `order-${selectedCart.id}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting order:', error)
      alert('Failed to export order')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {user?.full_name || user?.email}
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 hover:text-gray-900"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart list */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Submitted Carts</h2>
                <button
                  onClick={loadCarts}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
              <div className="divide-y max-h-[calc(100vh-200px)] overflow-y-auto">
                {carts.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No submitted carts
                  </div>
                ) : (
                  carts.map(cart => (
                    <button
                      key={cart.id}
                      onClick={() => setSelectedCart(cart)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedCart?.id === cart.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">
                        {cart.profiles?.full_name || cart.profiles?.email || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {cart.clinic || 'Unknown Clinic'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {cart.submitted_at ? new Date(cart.submitted_at).toLocaleDateString() : 'No date'}
                      </div>
                      <div className="text-xs mt-2">
                        <span className={`px-2 py-1 rounded ${
                          cart.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                          cart.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {cart.status}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Cart details */}
          <div className="lg:col-span-2">
            {selectedCart ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Cart Details</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Submitted by {selectedCart.profiles?.full_name || selectedCart.profiles?.email}
                      </p>
                    </div>
                    {selectedCart.status === 'approved' && (
                      <button
                        onClick={exportOrder}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        <Download className="w-4 h-4" />
                        Export Order
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {cartItems.map(item => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {item.products?.name || 'Unknown Product'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Item #: {item.products?.wddc_item_number}
                            </p>
                            {item.products?.size && (
                              <p className="text-sm text-gray-500">Size: {item.products.size}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            item.status === 'approved' ? 'bg-green-100 text-green-800' :
                            item.status === 'denied' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">
                              Requested: <span className="font-medium">{item.requested_quantity}</span>
                            </p>
                            {item.approved_quantity !== null && (
                              <p className="text-sm text-gray-600 mt-1">
                                Approved: <span className="font-medium">{item.approved_quantity}</span>
                              </p>
                            )}
                          </div>
                          {item.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                defaultValue={item.quantity}
                                onBlur={(e) => {
                                  const newQty = parseInt(e.target.value) || 0
                                  if (newQty !== item.quantity) {
                                    adjustQuantity(item.id, newQty)
                                  }
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Qty"
                              />
                              <button
                                onClick={() => approveItem(item.id, item.quantity)}
                                className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => denyItem(item.id)}
                                className="p-2 bg-red-600 text-white rounded hover:bg-red-700"
                                title="Deny"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {cartItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No items in this cart
                    </div>
                  )}

                  {cartItems.length > 0 && selectedCart.status !== 'approved' && (
                    <div className="mt-6 flex gap-4 pt-6 border-t">
                      <button
                        onClick={approveCart}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        <Check className="w-5 h-5" />
                        Approve Cart
                      </button>
                      <button
                        onClick={returnCart}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        <Edit className="w-5 h-5" />
                        Return for Revisions
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">Select a cart to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

