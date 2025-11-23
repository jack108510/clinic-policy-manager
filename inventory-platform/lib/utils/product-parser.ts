/**
 * Parses product data from january-2025-products.txt
 * Format appears to be: [optional_code] WDDC_ITEM_NUMBER PRODUCT_NAME_WITH_SIZE
 */

export interface ParsedProduct {
  wddc_item_number: string;
  name: string;
  size?: string;
  category?: string;
  supplier?: string;
}

export function parseProductLine(line: string): ParsedProduct | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Split by whitespace
  const parts = trimmed.split(/\s+/);
  
  if (parts.length < 2) return null;

  // Check if first part is a number (could be category code)
  // Last number before product name is typically the WDDC item number
  let wddcItemNumber = '';
  let nameStartIndex = 0;

  // Look for the WDDC item number (usually a long number)
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // WDDC item numbers are typically 8-12 digits
    if (/^\d{8,12}$/.test(part)) {
      wddcItemNumber = part;
      nameStartIndex = i + 1;
      break;
    }
  }

  // If no WDDC number found, try the last numeric part
  if (!wddcItemNumber) {
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(parts[i]) && parts[i].length >= 6) {
        wddcItemNumber = parts[i];
        nameStartIndex = i + 1;
        break;
      }
    }
  }

  if (!wddcItemNumber || nameStartIndex >= parts.length) {
    // Fallback: use first numeric part as WDDC number
    for (let i = 0; i < parts.length; i++) {
      if (/^\d+$/.test(parts[i])) {
        wddcItemNumber = parts[i];
        nameStartIndex = i + 1;
        break;
      }
    }
  }

  if (!wddcItemNumber) return null;

  // Extract product name (everything after WDDC number)
  const nameParts = parts.slice(nameStartIndex);
  const fullName = nameParts.join(' ');

  if (!fullName) return null;

  // Try to extract size from name (common patterns: "355ml", "3.6kg/8lb", "- 50ml")
  let size: string | undefined;
  let name = fullName;

  // Pattern: "PRODUCT NAME - SIZE"
  const dashPattern = /\s+-\s+([\d.]+(?:ml|kg|lb|oz|gm|g|L|each|pk|box|can|dose|IU|pieces?|/[\d.]+(?:ml|kg|lb|oz|gm|g|L)))/i;
  const dashMatch = fullName.match(dashPattern);
  if (dashMatch) {
    size = dashMatch[1].trim();
    name = fullName.replace(dashPattern, '').trim();
  }

  // Pattern: "PRODUCT NAME SIZE" (size at end)
  if (!size) {
    const endSizePattern = /\s+([\d.]+(?:ml|kg|lb|oz|gm|g|L|each|pk|box|can|dose|IU|pieces?|/[\d.]+(?:ml|kg|lb|oz|gm|g|L)))$/i;
    const endMatch = fullName.match(endSizePattern);
    if (endMatch) {
      size = endMatch[1].trim();
      name = fullName.replace(endSizePattern, '').trim();
    }
  }

  // Infer category from product name (basic heuristics)
  let category: string | undefined;
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('injection') || nameLower.includes('inject') || nameLower.includes('vaccine') || nameLower.includes('bacterin')) {
    category = 'Medications';
  } else if (nameLower.includes('food') || nameLower.includes('treat') || nameLower.includes('diet')) {
    category = 'Food & Nutrition';
  } else if (nameLower.includes('litter') || nameLower.includes('waste')) {
    category = 'Litter & Waste';
  } else if (nameLower.includes('bottle') || nameLower.includes('container') || nameLower.includes('cap')) {
    category = 'Supplies';
  } else if (nameLower.includes('bandage') || nameLower.includes('ointment') || nameLower.includes('wash')) {
    category = 'Medical Supplies';
  } else if (nameLower.includes('filter') || nameLower.includes('aquarium')) {
    category = 'Aquarium Supplies';
  } else {
    category = 'General';
  }

  return {
    wddc_item_number: wddcItemNumber,
    name: name || fullName,
    size,
    category,
    supplier: 'WDDC',
  };
}

export async function parseProductFile(fileContent: string): Promise<ParsedProduct[]> {
  const lines = fileContent.split('\n');
  const products: ParsedProduct[] = [];

  for (const line of lines) {
    const product = parseProductLine(line);
    if (product) {
      products.push(product);
    }
  }

  return products;
}

