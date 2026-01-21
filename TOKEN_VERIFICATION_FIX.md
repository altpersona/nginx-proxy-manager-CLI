# Token Verification Fix

## Problem Identified

The `npm-cli auth status` command hangs indefinitely when verifying tokens. This is caused by:

1. **API Endpoint Issues**: The `/api/tokens/verify` endpoint may not exist or respond properly on some Nginx Proxy Manager versions
2. **No Proper Error Handling**: The spinner continues running even when the request times out
3. **No Timeout Handling**: The 30-second timeout may be too long without proper feedback

## Symptoms
```
⠙ Verifying token...
⚠ Token is invalid or expired
⠙ Verifying token...
```
[hangs indefinitely]

## Root Causes

1. The `verifyToken()` API method in `lib/api.js` calls `/api/tokens/verify`
2. The auth command in `commands/auth.js` calls this without error recovery
3. When the API hangs or times out, the spinner keeps spinning
4. The catch block in `auth.js` shows a warning but continues the spinner

## Fix Approach

1. **Add better timeout handling** with shorter initial timeout
2. **Implement fallback verification** using a known working endpoint
3. **Fix spinner cleanup** in error cases
4. **Add retry logic** for transient failures
