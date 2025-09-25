# Darwin System Commands

## File System Operations
```bash
ls -la                 # List files with details
find . -name "*.ts"    # Find TypeScript files
grep -r "pattern" src/ # Search in source directory
cd /path/to/directory  # Change directory
mkdir -p dir/subdir    # Create directory tree
rm -rf directory       # Remove directory recursively
```

## Process Management
```bash
ps aux | grep node     # Find Node.js processes
kill -9 <pid>         # Force kill process
jobs                  # List background jobs
fg %1                 # Bring job to foreground
```

## Network & Development
```bash
lsof -i :3000         # Check what's using port 3000
curl -I url           # Check HTTP headers
netstat -an | grep LISTEN  # Show listening ports
```

## Git Operations
```bash
git status            # Check repository status
git log --oneline -5  # Show recent commits
git branch -a         # Show all branches
git diff              # Show changes
git stash             # Temporarily save changes
```

## Package Management
```bash
npm list              # Show installed packages
npm outdated          # Check for updates
npm cache clean --force  # Clear npm cache
which node            # Show Node.js path
node --version        # Check Node.js version
```

## File Permissions (Darwin specific)
```bash
chmod +x script.sh    # Make script executable
chown user:group file # Change ownership
ls -l@ file          # Show extended attributes (macOS)
xattr -l file        # List extended attributes
```

## System Information
```bash
uname -a              # System information
sw_vers               # macOS version
system_profiler SPHardwareDataType  # Hardware info
df -h                 # Disk usage
top -o cpu            # CPU usage
```