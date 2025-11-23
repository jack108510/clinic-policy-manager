# How to Start the Inventory Ordering Platform

## Option 1: Using Node.js (Recommended)

1. Open Terminal
2. Navigate to the project:
   ```bash
   cd /Users/jack/clinic-policy-manager
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. You should see: "Server running at http://localhost:8000/"
5. Open your browser and go to: **http://localhost:8000/inventory-ordering.html**

## Option 2: Using Python

1. Open Terminal
2. Navigate to the project:
   ```bash
   cd /Users/jack/clinic-policy-manager
   ```
3. Start the server:
   ```bash
   python3 -m http.server 8000
   ```
4. Open your browser and go to: **http://localhost:8000/inventory-ordering.html**

## Option 3: Open File Directly

1. Open Finder
2. Navigate to: `/Users/jack/clinic-policy-manager`
3. Right-click on `inventory-ordering.html`
4. Choose "Open With" → Your browser (Chrome, Safari, Firefox)

**Note:** Opening directly may have CORS issues with Supabase. Using a server (Option 1 or 2) is recommended.

## Troubleshooting

If you get "ERR_EMPTY_RESPONSE" or "Connection refused":
- Make sure the server is actually running (check Terminal for output)
- Try a different port: Change `8000` to `8080` in the commands above
- Check if another program is using port 8000:
  ```bash
  lsof -i :8000
  ```

If the page loads but shows errors:
- Make sure `supabase-config.js` is in the same folder
- Check browser console (F12) for error messages
- Verify Supabase project is set up correctly

