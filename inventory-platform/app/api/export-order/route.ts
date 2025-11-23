import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const cartId = searchParams.get('cartId')

    if (!cartId) {
      return NextResponse.json({ error: 'Cart ID required' }, { status: 400 })
    }

    // Get cart items with products
    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products (*)
      `)
      .eq('cart_id', cartId)
      .eq('status', 'approved')

    if (error) throw error

    // Get cart info
    const { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('id', cartId)
      .single()

    // Group by supplier
    const bySupplier: Record<string, any[]> = {}
    
    cartItems?.forEach(item => {
      const supplier = item.products?.supplier || 'WDDC'
      if (!bySupplier[supplier]) {
        bySupplier[supplier] = []
      }
      bySupplier[supplier].push({
        'Item #': item.products?.wddc_item_number || '',
        'Product Name': item.products?.name || '',
        'Size': item.products?.size || '',
        'Quantity': item.approved_quantity || item.quantity,
        'Category': item.products?.category || '',
      })
    })

    // Create workbook with multiple sheets (one per supplier)
    const workbook = XLSX.utils.book_new()

    // Summary sheet
    const summaryData = [
      ['Order Summary'],
      ['Cart ID', cartId],
      ['Clinic', cart?.clinic || 'Unknown'],
      ['Submitted', cart?.submitted_at ? new Date(cart.submitted_at).toLocaleString() : ''],
      [''],
      ['Supplier', 'Items Count'],
      ...Object.keys(bySupplier).map(supplier => [
        supplier,
        bySupplier[supplier].length
      ])
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    // One sheet per supplier
    Object.keys(bySupplier).forEach(supplier => {
      const sheetData = [
        ['Item #', 'Product Name', 'Size', 'Quantity', 'Category'],
        ...bySupplier[supplier].map(item => [
          item['Item #'],
          item['Product Name'],
          item['Size'],
          item['Quantity'],
          item['Category']
        ])
      ]
      const sheet = XLSX.utils.aoa_to_sheet(sheetData)
      // Clean supplier name for sheet name (Excel has limitations)
      const sheetName = supplier.substring(0, 31).replace(/[\\\/\?\*\[\]]/g, '_')
      XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
    })

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Return as download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="order-${cartId}.xlsx"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export order' },
      { status: 500 }
    )
  }
}

