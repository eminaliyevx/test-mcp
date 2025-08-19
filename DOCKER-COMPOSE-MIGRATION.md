# Docker Compose Command Migration

This document summarizes the migration from the legacy `docker-compose` command to the modern `docker compose` command across all project files.

## 🔄 **Migration Summary**

The project has been updated to use the modern Docker Compose V2 syntax (`docker compose`) instead of the legacy V1 syntax (`docker-compose`).

## 📝 **Files Updated**

### Scripts Updated
1. **`scripts/deploy.sh`** ✅
   - `docker-compose down` → `docker compose down`
   - `docker-compose up` → `docker compose up`
   - `docker-compose ps` → `docker compose ps`
   - `docker-compose logs` → `docker compose logs`
   - `docker-compose restart` → `docker compose restart`
   - `docker-compose pull` → `docker compose pull`

2. **`scripts/check-ports.sh`** ✅
   - Updated deployment command references
   - Updated pro-tip examples

3. **`test-server.sh`** ✅
   - Updated deployment instructions

### Documentation Updated
1. **`README.md`** ✅
   - All command examples updated
   - Deployment instructions updated
   - Monitoring commands updated

2. **`DEPLOYMENT-SUMMARY.md`** ✅
   - Quick start commands updated
   - Troubleshooting commands updated
   - Monitoring section updated
   - Management commands updated

3. **`PORT-CONFIGURATION.md`** ✅
   - Command examples updated
   - Verification steps updated

## ⚡ **Key Changes**

### Before (Legacy V1)
```bash
docker-compose up --build -d
docker-compose ps
docker-compose logs -f
docker-compose down
```

### After (Modern V2)
```bash
docker compose up --build -d
docker compose ps
docker compose logs -f
docker compose down
```

## 🔍 **Verification**

All scripts have been tested and verified to work with the new commands:

```bash
# Port checking still works
./scripts/check-ports.sh

# All references properly updated
grep -r "docker compose" . --exclude-dir=node_modules
```

## 📋 **Remaining References**

The following `docker-compose` references are **intentionally preserved** as they refer to filenames or contextual information:

- `docker-compose.yml` (filename)
- `docker-compose.override.yml` (filename)
- `docker-compose-plugin` (package name)
- Comments about file structure

## 🎯 **Benefits of Migration**

1. **Future-proof**: Docker Compose V2 is the current standard
2. **Better Performance**: V2 is faster and more reliable
3. **Active Development**: V2 receives active updates and support
4. **Consistency**: Matches modern Docker documentation

## 🚀 **Ready to Deploy**

The project is now fully migrated and ready for deployment with modern Docker Compose:

```bash
# Check ports are available
./scripts/check-ports.sh

# Deploy the server
docker compose up --build -d

# Monitor deployment
docker compose ps
docker compose logs -f pentest-mcp-server
```

## 📚 **Additional Resources**

- [Docker Compose V2 Documentation](https://docs.docker.com/compose/)
- [Migration Guide](https://docs.docker.com/compose/migrate/)

---

**Note**: If you encounter any systems still using the legacy `docker-compose` command, you can install the compatibility alias or update your Docker installation to get the modern `docker compose` command.
