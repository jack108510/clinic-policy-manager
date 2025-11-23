# Binary Data Persistence Fix

## Problem
Binary data (file dataUrls) for order forms was stored only in memory (JavaScript Map) and was lost on page reload. This meant:
- Files uploaded before a page reload lost their binary data
- Users had to re-upload files after every page reload
- Webhook sends only contained metadata, not actual binary file data

## Solution
Implemented IndexedDB persistence for binary data URLs.

### Changes Made
1. **Added IndexedDB functions** (`barcode-scanner.html`):
   - `initIndexedDB()` - Initializes IndexedDB database
   - `saveDataUrlToIndexedDB()` - Persists dataUrl when files are uploaded
   - `loadDataUrlsFromIndexedDB()` - Restores dataUrls on page load
   - `deleteDataUrlFromIndexedDB()` - Cleans up deleted files

2. **Updated file upload handler**:
   - Now saves dataUrl to both memory Map AND IndexedDB
   - Binary data persists across page reloads

3. **Updated `loadOrderForms()`**:
   - Loads dataUrls from IndexedDB on page initialization
   - Populates the Map with persisted binary data
   - Logs status of restored binary data

## Binary Data Transmission Method
Binary data is sent as **actual binary files using multipart/form-data (FormData with Blob objects)**.

### Implementation
1. Binary data (dataUrl) is converted to Blob objects using `dataURLtoBlob()`
2. Blob objects are added to FormData with field names:
   - Single file: `file` (n8n: `$binary.file`)
   - Multiple files: `files[0]`, `files[1]`, etc. (n8n: `$binary.files[0]`)
3. JSON metadata is sent as `data` field in FormData (n8n: `$json.data`)
4. FormData is sent as `multipart/form-data` (browser sets Content-Type with boundary)
5. n8n receives binary files in `$binary.file` or `$binary.files[]`

### IndexedDB Reload Fix
Added automatic reload from IndexedDB if Map is empty when sending, ensuring binary data is available even if async loading hasn't completed.

### Accessing in n8n
- Binary file: `{{ $binary.file }}` (single) or `{{ $binary.files[0] }}` (multiple)
- JSON metadata: `{{ $json.data }}` (parse to get orderForms metadata)
- File name: Available in FormData filename parameter
- File type: Available as MIME type in Blob

## Result
- ✅ Binary data now persists across page reloads
- ✅ Files uploaded once remain available for webhook sends
- ✅ Webhook sends include actual binary file data as multipart/form-data (Blob objects)
- ✅ Users no longer need to re-upload files after page reload
- ✅ Binary data accessible in n8n via `$binary.file` or `$binary.files[]`
- ✅ Automatic IndexedDB reload ensures data is available even if async loading hasn't completed
- ✅ FormData contains both binary files AND JSON metadata

## Date Fixed
November 22, 2025

## Location
`/Users/jack/clinic-policy-manager/barcode-scanner.html`

## Technical Details
- Uses IndexedDB (browser's built-in database) for persistence
- Stores dataUrls in `orderFormDataUrls` object store
- Database name: `inventoryTool`
- Data survives browser restarts and page reloads
- Binary data converted from dataUrl → Blob → FormData
- Sent as multipart/form-data with actual binary files (not base64 in JSON)
- Automatic IndexedDB reload in `sendDataToWebhook()` if Map is empty
- Webhook URL: `https://jackwilde.app.n8n.cloud/webhook/0efeec17-0878-454e-9f26-691cf6525645`

## Verification (Working ✅)
Logs confirm successful binary transmission:
- ✅ Blob creation: "Successfully created Blob for [file]: 202.87 KB"
- ✅ FormData creation: "Added binary file as 'file': [file] (202.87 KB)"
- ✅ FormData contents: "file: Blob (202.87 KB, application/pdf)"
- ✅ Send success: "Binary data sent successfully as multipart/form-data"
- ✅ Server response: 200 OK

