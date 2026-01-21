# Fix Gitea.raptio.us 500 Error - NPM-CLI Commands

## ✅ CLI BUGS FIXED!

### 🎉 The npm-cli has been updated to fix:
1. **SSL boolean flag handling** - `--ssl-forced false` now works correctly
2. **Disable/enable commands** - no more "additional properties" errors
3. **Boolean flag logic** - proper handling of `--flag` and `--no-flag` options

---

## 🚀 QUICK FIX - Host ID 2

### Current Status:
- ✅ Forward scheme: http
- ✅ Forward host: localhost
- ✅ Forward port: 3000
- ✅ Advanced headers: Applied
- ⚠️ SSL forced: still true (needs to be disabled)

### 🔧 Fix the SSL Issue:
```bash
# Disable SSL forcing (this should now work!)
npm-cli hosts update 2 --no-ssl-forced

# Or explicitly set it to false
npm-cli hosts update 2 --ssl-forced false
```

### 🔄 Restart the host:
```bash
# These commands should now work without errors
npm-cli hosts disable 2
npm-cli hosts enable 2
```

### 🧪 Test the fix:
```bash
# Test HTTPS
curl -I https://gitea.raptio.us

# Test HTTP
curl -I http://gitea.raptio.us
```

---

## 📋 If You Still Have Issues:

### Check authentication:
```bash
npm-cli auth status
# If not authenticated:
npm-cli auth login
```

### Alternative SSL fixes:
```bash
# Remove SSL certificate completely
npm-cli hosts update 2 --certificate-id 0 --no-ssl-forced

# Or use HTTPS forwarding (if Gitea supports it)
npm-cli hosts update 2 \
  --forward-scheme https \
  --forward-port 3443 \
  --ssl-forced true
```

---

## 🎯 SUMMARY
1. ✅ **CLI bugs fixed** - SSL flags and disable/enable now work
2. ✅ **Proxy config correct** - HTTP forwarding configured properly
3. 🔧 **Apply SSL fix** - run the commands above to disable SSL forcing
4. 🧪 **Test immediately** - changes apply without restart needed

## Detailed Fix Commands

### 1. First, check current configuration
```bash
npm-cli hosts list
```

### 2. Find your Gitea host ID
```bash
npm-cli hosts list | grep gitea.raptio.us
```

### 3. Common Gitea Configuration Issues & Fixes

#### Option A: Basic Gitea Setup (HTTP)
```bash
npm-cli hosts update <HOST_ID> \
  --forward-scheme http \
  --forward-host localhost \
  --forward-port 3000 \
  --ssl-forced false \
  --advanced "proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme; proxy_connect_timeout 60s; proxy_send_timeout 60s; proxy_read_timeout 60s;"
```

#### Option B: Gitea with SSL (if you have certificate)
```bash
npm-cli hosts update <HOST_ID> \
  --forward-scheme http \
  --forward-host localhost \
  --forward-port 3000 \
  --ssl-forced true \
  --certificate-id <CERT_ID> \
  --advanced "proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme; proxy_connect_timeout 60s; proxy_send_timeout 60s; proxy_read_timeout 60s;"
```

#### Option C: Gitea in Docker Network
```bash
npm-cli hosts update <HOST_ID> \
  --forward-scheme http \
  --forward-host gitea \
  --forward-port 3000 \
  --ssl-forced false \
  --advanced "proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme;"
```

### 4. If Gitea is on different machine
```bash
npm-cli hosts update <HOST_ID> \
  --forward-scheme http \
  --forward-host <GITEA_IP_OR_HOSTNAME> \
  --forward-port 3000 \
  --ssl-forced false \
  --advanced "proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme;"
```

### 5. Disable and re-enable the host
```bash
npm-cli hosts disable <HOST_ID>
npm-cli hosts enable <HOST_ID>
```

### 6. Verify the fix
```bash
curl -I https://gitea.raptio.us
```

## Gitea-Specific Troubleshooting

### Check if Gitea is running:
```bash
# If Gitea is in Docker
docker ps | grep gitea

# Test direct connection
curl -I http://localhost:3000
curl -I http://<gitea-host>:3000
```

### Common Gitea Issues:

1. **Database connection failed** - Check Gitea logs
2. **Wrong proxy headers** - Use the advanced config above
3. **SSL certificate issues** - Temporarily disable SSL forcing
4. **Port conflicts** - Ensure port 3000 is correct for your Gitea

### Get Gitea logs:
```bash
# Docker logs
docker logs gitea

# Or if running as service
journalctl -u gitea -f
```

### Test commands:
```bash
# Test without SSL
curl -I http://gitea.raptio.us

# Test with SSL
curl -I https://gitea.raptio.us

# Test direct connection to Gitea
curl -I http://localhost:3000
```

## Replace these placeholders:
- `<HOST_ID>` - Your Gitea proxy host ID from `npm-cli hosts list`
- `<CERT_ID>` - Your SSL certificate ID from `npm-cli certificates list`
- `<GITEA_IP_OR_HOSTNAME>` - IP address or hostname where Gitea is running
- `3000` - Change if Gitea runs on different port

## Quick diagnosis:
Run these commands in order and tell me which ones fail:
1. `npm-cli hosts get <HOST_ID>`
2. `curl -I http://localhost:3000` (or your Gitea URL)
3. `curl -I https://gitea.raptio.us`