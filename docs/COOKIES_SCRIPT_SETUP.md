# Cookies Script Setup Guide

This guide explains how to set up the `cookies` script so you can run it from anywhere in your terminal.

## What the Script Does

The `cookies` script automatically:
1. ✅ Starts Firebase emulators (Auth, Firestore, Storage, Functions) with seed data
2. ✅ Starts the Vite development server
3. ✅ Shows you all the URLs you need (Emulator UI, Auth, Firestore, Storage, App)
4. ✅ Handles cleanup when you press Ctrl+C

## Setup Instructions

### For Windows (PowerShell)

1. **Find your PowerShell profile location:**
   ```powershell
   $PROFILE
   ```

2. **If the profile doesn't exist, create it:**
   ```powershell
   if (!(Test-Path -Path $PROFILE)) {
       New-Item -ItemType File -Path $PROFILE -Force
       }
   ```

3. **Add the script to your PATH by adding this line to your profile:**
   ```powershell
   notepad $PROFILE
   ```
   
   Then add this line (replace the path with your actual project path):
   ```powershell
   $env:Path += ";C:\Users\tywho\OneDrive\Documents\Development\GitHub\CookieVoting\scripts"
   ```

4. **Create an alias for easier use:**
   ```powershell
   function cookies { & "C:\Users\tywho\OneDrive\Documents\Development\GitHub\CookieVoting\scripts\cookies.ps1" }
   ```

5. **Reload your profile:**
   ```powershell
   . $PROFILE
   ```

6. **Test it:**
   ```powershell
   cookies
   ```

### For Linux/macOS/Git Bash (Bash)

**Quick Setup (Recommended):**

Run the setup script in Git Bash:
```bash
bash scripts/setup-cookies.sh
```

Then reload your shell:
```bash
source ~/.bash_profile  # or source ~/.bashrc
```

**Manual Setup:**

1. **Add the script directory to your PATH. Edit your shell profile:**
   - For Bash: `~/.bashrc` or `~/.bash_profile`
   - For Zsh: `~/.zshrc`
   
   ```bash
   # Add this line (replace the path with your actual project path)
   # For Git Bash on Windows, use the /c/Users/... format
   export PATH="$PATH:/c/Users/tywho/OneDrive/Documents/Development/GitHub/CookieVoting/scripts"
   ```

2. **Make the script executable:**
   ```bash
   chmod +x scripts/cookies.sh
   ```

3. **Reload your shell profile:**
   ```bash
   source ~/.bash_profile  # or source ~/.bashrc
   ```

4. **Test it:**
   ```bash
   cookies
   ```

## Alternative: Create a Global Script

If you prefer to have the script in a global location:

### Windows

1. Create a directory for your scripts (e.g., `C:\Users\tywho\bin`)
2. Copy `scripts/cookies.ps1` to that directory
3. Add that directory to your PATH in System Environment Variables

### Linux/macOS

1. Copy the script to `/usr/local/bin/`:
   ```bash
   sudo cp scripts/cookies.sh /usr/local/bin/cookies
   sudo chmod +x /usr/local/bin/cookies
   ```

## Usage

Once set up, simply run:

```bash
cookies
```

Or in PowerShell:

```powershell
cookies
```

The script will:
- Start Firebase emulators with seed data imported
- Start the Vite dev server
- Display all the URLs you need
- Wait for you to press Ctrl+C to stop everything

## Troubleshooting

### Script not found
- Make sure the script directory is in your PATH
- Try using the full path: `C:\Users\tywho\OneDrive\Documents\Development\GitHub\CookieVoting\scripts\cookies.ps1`

### Permission denied (Linux/macOS)
- Make sure the script is executable: `chmod +x scripts/cookies.sh`

### Emulators not starting
- Check if ports 4000, 9099, 8080, 9199 are already in use
- Check the log files:
  - Windows: `%TEMP%\cookies-emulators.log`
  - Linux/macOS: `/tmp/cookies-emulators.log`

### Dev server not starting
- Check if port 5173 is already in use
- Check the log files:
  - Windows: `%TEMP%\cookies-dev.log`
  - Linux/macOS: `/tmp/cookies-dev.log`

