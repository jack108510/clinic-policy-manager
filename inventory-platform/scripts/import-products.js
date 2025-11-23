/**
 * Standalone script to import products from january-2025-products.txt
 * Run with: node scripts/import-products.js
 * 
 * Requires:
 * - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment or .env.local
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Product parser (simplified version)
function parseProductLine(line) {
  const trimmed = line.trim()
  if (!trimmed) return null

  const parts = trimmed.split(/\s+/)
  if (parts.length < 2) return null

  let wddcItemNumber = ''
  let nameStartIndex = 0

  // Find WDDC item number (8-12 digits)
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (/^\d{8,12}$/.test(part)) {
      wddcItemNumber = part
      nameStartIndex = i + 1
      break
    }
  }

  if (!wddcItemNumber) {
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(parts[i]) && parts[i].length >= 6) {
        wddcItemNumber = parts[i]
        nameStartIndex = i + 1
        break
      }
    }
  }

  if (!wddcItemNumber) return null

  const nameParts = parts.slice(nameStartIndex)
  const fullName = nameParts.join(' ')

  if (!fullName) return null

  // Extract size
  let size
  let name = fullName
  const dashPattern = /\s+-\s+([\d.]+(?:ml|kg|lb|oz|gm|g|L|each|pk|box|can|dose|IU|pieces?|/[\d.]+(?:ml|kg|lb|oz|gm|g|L)))/i
  const dashMatch = fullName.match(dashPattern)
  if (dashMatch) {
    size = dashMatch[1].trim()
    name = fullName.replace(dashPattern, '').trim()
  }

  // Infer category
  let category
  const nameLower = name.toLowerCase()
  if (nameLower.includes('injection') || nameLower.includes('inject') || nameLower.includes('vaccine') || nameLower.includes('bacterin')) {
    category = 'Medications'
  } else if (nameLower.includes('food') || nameLower.includes('treat') || nameLower.includes('diet')) {
    category = 'Food & Nutrition'
  } else if (nameLower.includes('litter') || nameLower.includes('waste')) {
    category = 'Litter & Waste'
  } else if (nameLower.includes('bottle') || nameLower.includes('container') || nameLower.includes('cap')) {
    category = 'Supplies'
  } else if (nameLower.includes('bandage') || nameLower.includes('ointment') || nameLower.includes('wash')) {
    category = 'Medical Supplies'
  } else if (nameLower.includes('filter') || nameLower.includes('aquarium')) {
    category = 'Aquarium Supplies'
  } else {
    category = 'General'
  }

  return {
    wddc_item_number: wddcItemNumber,
    name: name || fullName,
    size,
    category,
    supplier: 'WDDC',
  }
}

async function importProducts() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    console.error('Set them in .env.local or as environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Find product file
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'data', 'january-2025-products.txt'),
    path.join(__dirname, '..', 'data', 'january-2025-products.txt'),
    path.join(process.cwd(), 'data', 'january-2025-products.txt'),
  ]

  let filePath = null
  let fileContent = null

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        filePath = p
        fileContent = fs.readFileSync(p, 'utf-8')
        break
      }
    } catch (error) {
      // Continue to next path
    }
  }

  if (!fileContent) {
    console.error('❌ Could not find january-2025-products.txt')
    console.error('Tried paths:', possiblePaths)
    process.exit(1)
  }

  console.log(`✅ Found product file: ${filePath}`)

  // Parse products
  const lines = fileContent.split('\n')
  const products = []
  for (const line of lines) {
    const product = parseProductLine(line)
    if (product) {
      products.push(product)
    }
  }

  console.log(`📦 Parsed ${products.length} products`)

  // Import in batches
  const batchSize = 100
  let imported = 0
  let errors = 0

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    
    const { data, error } = await supabase
      .from('products')
      .upsert(batch, {
        onConflict: 'wddc_item_number',
      })
      .select()

    if (error) {
      console.error(`❌ Error importing batch ${i / batchSize + 1}:`, error.message)
      errors++
    } else {
      imported += batch.length
      console.log(`✅ Imported batch ${i / batchSize + 1} (${imported}/${products.length})`)
    }
  }

  console.log(`\n✨ Import complete!`)
  console.log(`   Imported: ${imported}`)
  console.log(`   Errors: ${errors}`)
}

importProducts().catch(console.error)

