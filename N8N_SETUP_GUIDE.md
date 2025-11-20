# n8n & PDF.co Integration Guide

This guide explains how to receive and process data from the Barcode Scanner tool in n8n workflows, including PDF.co integration.

## Data Format

The tool sends data in two formats depending on content:

### 1. With Order Forms (Binary Files)
When order forms (PDFs/images) are present, data is sent as **multipart/form-data**:

- **`data`**: JSON string containing scanned items, documents, photos metadata
- **`files[0]`, `files[1]`, etc.**: Binary file attachments (array format)
- **`file_0`, `file_1`**, etc.: Same files as individual fields (easier access)
- **`file_0_id`, `file_0_name`, `file_0_type`, `file_0_date`**: Metadata for each file
- **`orderFormsCount`**: Number of order forms

### 2. Without Order Forms
When no order forms are present, data is sent as **application/json**:

```json
{
  "timestamp": "2025-01-19T...",
  "scannedItems": [...],
  "uploadedDocuments": [...],
  "photos": [...],
  "orderForms": [...],
  "summary": {...}
}
```

## n8n Workflow Setup

### Step 1: Create Webhook Node

1. Add a **Webhook** node to your workflow
2. Configure:
   - **HTTP Method**: `POST`
   - **Response Mode**: "Respond When Last Node Finishes"
   - **Path**: Copy the path from your webhook URL (e.g., `/webhook-test/1cbe4a45-ae17-403c-a140-3c1f160f101c`)
3. Click **Execute Node** to get your webhook URL
4. Update the webhook URL in `barcode-scanner.html`:
   ```javascript
   const webhookUrl = 'http://localhost:5678/webhook-test/YOUR-WEBHOOK-ID';
   ```

### Step 2: Access the Data in n8n

#### For Binary Files (Order Forms):
```javascript
// Access files array
{{ $binary.files[0].data }}  // First file binary data
{{ $binary.files[1].data }}  // Second file binary data

// Or access individual file fields
{{ $binary.file_0.data }}     // First file
{{ $binary.file_1.data }}     // Second file

// Access file metadata
{{ $json.file_0_name }}       // File name
{{ $json.file_0_type }}       // File type (photo/file)
{{ $json.file_0_id }}         // File ID
{{ $json.file_0_date }}       // Upload date
```

#### For JSON Payload:
```javascript
// Parse the 'data' field (it's a JSON string)
// Use a "Code" node or "Function" node to parse:
const data = JSON.parse($json.data);
return { data };
```

Or use a **JSON Parse** node:
- **Field to Parse**: `data`
- **Output**: Parsed JSON object

### Step 3: Process with PDF.co

1. **Install PDF.co Node** (if not already installed):
   - Go to **Settings** > **Community Nodes**
   - Search for `n8n-nodes-pdfco`
   - Click **Install**

2. **Add PDF.co Credentials**:
   - Go to **Credentials** > **New** > **PDF.co API**
   - Enter your PDF.co API key
   - Save

3. **Add PDF.co Node**:
   - Add a **PDF.co** node after your Webhook/Parse nodes
   - Select the operation (e.g., "Extract Text from PDF", "Convert PDF to HTML")
   - In the **File** field, use:
     ```
     {{ $binary.files[0].data }}
     ```
   - Or for individual file access:
     ```
     {{ $binary.file_0.data }}
     ```

### Step 4: Example Workflow

```
Webhook
  ↓
Code Node (Parse JSON)
  ↓
Split In Batches (if multiple files)
  ↓
PDF.co (Extract Text/Process)
  ↓
Save to Database/Email/Slack/etc.
```

#### Code Node Example (Parse JSON):
```javascript
// Parse the 'data' field from webhook
const jsonData = JSON.parse($input.item.json.data);

// Return parsed data
return {
  json: {
    ...jsonData,
    // Add file references
    files: $input.item.binary.files || []
  }
};
```

## Processing Multiple Files

If you have multiple order forms, use a **Split In Batches** node:

1. Add **Split In Batches** node after parsing JSON
2. Set **Batch Size**: 1 (process one file at a time)
3. In PDF.co node, use:
   ```
   {{ $binary.files[$runIndex].data }}
   ```

## Accessing Scanned Items

After parsing the JSON data, access scanned items:

```javascript
{{ $json.scannedItems[0].itemNumber }}
{{ $json.scannedItems[0].name }}
{{ $json.scannedItems[0].quantity }}
```

## Testing

1. Upload/capture an order form in the Barcode Scanner tool
2. Click "Send All Data to Webhook"
3. Check n8n workflow execution to see received data
4. Verify files are accessible in binary format

## Troubleshooting

- **Files not appearing**: Check that webhook is set to receive `multipart/form-data`
- **JSON parsing error**: Use Code node to parse `data` field first
- **PDF.co error**: Verify file is being passed correctly: `{{ $binary.files[0].data }}`
- **CORS errors**: Ensure n8n webhook allows CORS (should work by default)

## Additional Resources

- [n8n Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [PDF.co n8n Integration](https://pdf.co/integrations/n8n)
- [PDF.co API Documentation](https://apidocs.pdf.co/)





