'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ProductSearch from './ProductSearch'
import Cart from './Cart'
import { ShoppingCart, LogOut, Search } from 'lucide-react'

export default function OrderingPage() {
  const [user, setUser] = useState<any>(null)
  const [cart, setCart] = useState<any>(null)
  const [cartItems, setCartItems] = useState<any[]>([])
  const [showCart, setShowCart] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadUser()
    loadCart()
  }, [])

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

  const loadCart = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get or create draft cart
    let { data: existingCart } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .single()

    if (!existingCart) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic')
        .eq('id', user.id)
        .single()

      const { data: newCart } = await supabase
        .from('carts')
        .insert([{
          user_id: user.id,
          clinic: profile?.clinic || 'Unknown',
          status: 'draft'
        }])
        .select()
        .single()

      existingCart = newCart
    }

    setCart(existingCart)

    // Load cart items
    if (existingCart) {
      const { data: items } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (*)
        `)
        .eq('cart_id', existingCart.id)

      setCartItems(items || [])
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const addToCart = async (product: any, quantity: number) => {
    if (!cart) return

    // Check if product already in cart
    const existingItem = cartItems.find(item => item.product_id === product.id)

    if (existingItem) {
      // Update quantity
      const { data } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)
        .select()
        .single()

      if (data) {
        setCartItems(cartItems.map(item => 
          item.id === existingItem.id ? { ...item, ...data } : item
        ))
      }
    } else {
      // Add new item
      const { data } = await supabase
        .from('cart_items')
        .insert([{
          cart_id: cart.id,
          product_id: product.id,
          quantity,
          requested_quantity: quantity
        }])
        .select(`
          *,
          products (*)
        `)
        .single()

      if (data) {
        setCartItems([...cartItems, data])
      }
    }
  }

  const updateCartItemQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeCartItem(itemId)
      return
    }

    const { data } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single()

    if (data) {
      setCartItems(cartItems.map(item => 
        item.id === itemId ? { ...item, ...data } : item
      ))
    }
  }

  const removeCartItem = async (itemId: string) => {
    await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    setCartItems(cartItems.filter(item => item.id !== itemId))
  }

  const submitCart = async () => {
    if (!cart || cartItems.length === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Update cart status
    const { error } = await supabase
      .from('carts')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', cart.id)

    if (error) {
      console.error('Error submitting cart:', error)
      return
    }

    // Create approval log
    await supabase
      .from('approvals')
      .insert([{
        cart_id: cart.id,
        action: 'submitted',
        performed_by: user.id
      }])

    alert('Cart submitted for approval!')
    loadCart() // Reload to get new draft cart
  }

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Inventory Ordering</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
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
          {/* Main content */}
          <div className={`lg:col-span-2 ${showCart ? 'hidden lg:block' : ''}`}>
            <ProductSearch onAddToCart={addToCart} />
          </div>

          {/* Cart sidebar */}
          <div className={`${showCart ? '' : 'hidden lg:block'}`}>
            <Cart
              cart={cart}
              items={cartItems}
              onUpdateQuantity={updateCartItemQuantity}
              onRemoveItem={removeCartItem}
              onSubmit={submitCart}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

