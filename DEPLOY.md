# Deployment Guide - Inventory Intake Tool

## Quickest Method: Netlify Drop (No account needed initially)

1. Go to https://app.netlify.com/drop
2. Drag and drop the `barcode-scanner.html` file onto the page
3. You'll get an instant URL like: `https://random-name-123.netlify.app`
4. (Optional) Sign up to customize the domain name

## Alternative: GitHub Pages

If you want to use GitHub Pages:

1. Commit and push the barcode-scanner.html file:
   ```bash
   git add barcode-scanner.html
   git commit -m "Add Inventory Intake Tool"
   git push origin main
   ```

2. Go to your GitHub repository settings
3. Navigate to "Pages" in the left sidebar
4. Select "main" branch and "/ (root)" folder
5. Click Save
6. Your site will be live at: `https://yourusername.github.io/repo-name/barcode-scanner.html`

## Alternative: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in the project directory
3. Follow the prompts
4. Get instant URL

