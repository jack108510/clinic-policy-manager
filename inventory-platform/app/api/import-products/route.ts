import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseProductFile } from '@/lib/utils/product-parser'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and is manager
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Read product file
    const filePath = path.join(process.cwd(), '..', '..', 'data', 'january-2025-products.txt')
    let fileContent: string
    
    try {
      fileContent = fs.readFileSync(filePath, 'utf-8')
    } catch (error) {
      // Try alternative path
      const altPath = path.join(process.cwd(), '..', 'data', 'january-2025-products.txt')
      fileContent = fs.readFileSync(altPath, 'utf-8')
    }

    // Parse products
    const products = await parseProductFile(fileContent)

    // Insert products (upsert based on WDDC item number)
    const insertPromises = products.map(product =>
      supabase
        .from('products')
        .upsert({
          wddc_item_number: product.wddc_item_number,
          name: product.name,
          size: product.size,
          category: product.category,
          supplier: product.supplier || 'WDDC',
        }, {
          onConflict: 'wddc_item_number'
        })
    )

    await Promise.all(insertPromises)

    return NextResponse.json({
      success: true,
      imported: products.length
    })
  } catch (error: any) {
    console.error('Error importing products:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import products' },
      { status: 500 }
    )
  }
}

