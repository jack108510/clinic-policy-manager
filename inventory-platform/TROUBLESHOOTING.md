# Troubleshooting Login Issues

## Error: 422 on Signup / 400 on Login

### Common Causes:

1. **Email Confirmation is Enabled**
   - Go to: https://supabase.com/dashboard/project/hneyncvndwejbvkxndpz/auth/providers
   - Click on "Email"
   - Turn OFF "Confirm email"
   - Save

2. **Account Already Exists**
   - If you get 422 on signup, the account already exists
   - Use the "Sign In" form instead
   - If you forgot the password, you'll need to reset it in Supabase dashboard

3. **Wrong Credentials**
   - Make sure email is typed correctly (case doesn't matter, but spelling does)
   - Check for extra spaces
   - Verify password is correct

### Quick Fix Steps:

1. **Disable Email Confirmation:**
   ```
   Supabase Dashboard → Authentication → Providers → Email → Turn OFF "Confirm email"
   ```

2. **Reset Password (if needed):**
   - Go to Supabase Dashboard → Authentication → Users
   - Find your user
   - Click "..." → "Reset Password"
   - Or delete the user and create a new one

3. **Check User Status:**
   - Go to Supabase Dashboard → Authentication → Users
   - Check if user exists and is "Confirmed"
   - If not confirmed, click "..." → "Send confirmation email"

### Test Login:

After disabling email confirmation, try logging in with:
- Email: (your email)
- Password: (your password)

If it still doesn't work, check the browser console (F12) for detailed error messages.

