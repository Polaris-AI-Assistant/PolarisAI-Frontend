# Testing Guide - Authentication Flow

## Testing the Updated Authentication Flow

### 1. Clear All Authentication Data

Before testing, open your browser's Developer Console (F12) and run:

```javascript
// Clear all local storage
localStorage.clear();
sessionStorage.clear();

// Clear all cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

// Reload the page
location.reload();
```

### 2. Test Landing Page

1. Navigate to the root URL (`/`)
2. You should see the landing page with:
   - Welcome message
   - Sign In button
   - Sign Up button
   - Three feature cards (Gmail, Calendar, GitHub)

### 3. Test Sign In Flow

1. Click the **Sign In** button on the landing page
2. You should be redirected to `/auth/signin`
3. The page should display the sign-in form (NOT redirect to dashboard)
4. Enter valid credentials
5. Click "Sign In"
6. Upon successful authentication, you should be redirected to `/dashboard`

### 4. Test Sign Up Flow

1. From the landing page, click the **Sign Up** button
2. You should be redirected to `/auth/signup`
3. The page should display the sign-up form (NOT redirect to dashboard)
4. Fill in all required fields
5. Click "Sign Up"
6. Upon successful registration, you should be redirected to `/dashboard`

### 5. Test Protected Routes

1. While logged out, try to access `/dashboard` directly
2. You should be automatically redirected to `/auth/signin?redirect=/dashboard`
3. After signing in, you should be redirected back to `/dashboard`

### 6. Test Gmail Connection (After Login)

1. Navigate to `/dashboard`
2. Click "Connect Gmail"
3. You should now see the proper OAuth flow
4. After authorization, Gmail should be connected to YOUR account
5. No hardcoded email should appear

### 7. Verify No Hardcoded Users

1. Check the dashboard after connecting Gmail
2. Verify the email shown is YOUR email, not `atharvajoshi814@gmail.com`
3. If you see the hardcoded email, there may be cached data - clear storage and retry

## Common Issues and Fixes

### Issue: Landing page redirects to dashboard immediately
**Fix:** You have leftover auth tokens. Clear all storage as shown in step 1.

### Issue: Sign In button goes to dashboard without showing form
**Fix:** Auth tokens are present. Clear cookies and storage, then try again.

### Issue: Gmail shows hardcoded email
**Fix:** 
1. Clear all storage
2. Sign out completely
3. Sign in again
4. Reconnect Gmail

## Files Modified

1. `frontend/app/page.tsx` - Landing page with Sign In/Sign Up buttons
2. `frontend/lib/gmail.ts` - Removed hardcoded email fallback
3. `frontend/middleware.ts` - Fixed authentication redirects
4. `frontend/app/auth/signin/page.tsx` - Added auth check and redirect handling
5. `frontend/app/auth/signup/page.tsx` - Added auth check and cookie handling
6. `frontend/app/dashboard/page.tsx` - Added auth verification

## Expected Behavior Summary

- **Logged Out Users:**
  - `/` → Landing page (Sign In/Sign Up buttons)
  - `/auth/signin` → Sign in form
  - `/auth/signup` → Sign up form
  - `/dashboard` → Redirect to `/auth/signin`

- **Logged In Users:**
  - `/` → Redirect to `/dashboard`
  - `/auth/signin` → Redirect to `/dashboard`
  - `/auth/signup` → Redirect to `/dashboard`
  - `/dashboard` → Dashboard with connection options
