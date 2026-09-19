# Building Executable for Suno Prompt Generator

## Quick Start
Run this command to create a standalone executable:

```bash
npm run package
```

This will generate `suno-prompt-generator.exe` that can be run without Node.js or npm installed.

---

## Method 1: Using pkg (Recommended) ⭐

### What is pkg?
`pkg` is a tool that packages Node.js applications into standalone executables for Windows, macOS, and Linux.

### Prerequisites
- Node.js and npm installed
- pkg installed (will be installed with dependencies)

### Steps

1. **Install dependencies** (if not already done):
```bash
npm install
```

2. **Build the executable**:
```bash
npm run package
```

3. **Output**:
- A file named `suno-prompt-generator.exe` will be created
- This is a standalone executable (~90-150 MB)
- No need to install Node.js or npm on the target machine

4. **Run the executable**:
```bash
./suno-prompt-generator.exe
```

### Creating a Desktop Shortcut
1. Right-click `suno-prompt-generator.exe`
2. Select "Send to" > "Desktop (create shortcut)"
3. Rename shortcut to "Suno Prompt Generator"
4. (Optional) Right-click shortcut > Properties > Change Icon

---

## Method 2: Simple Batch Launcher

If you prefer not to create an executable, use the batch launcher:

1. Create `run.bat` in the project root:
```batch
@echo off
npm start
pause
```

2. Double-click `run.bat` to start the application

---

## Method 3: Original C++ Approach

### For Advanced Users Only

If you want to use C++, follow these steps:

1. **Install Visual Studio 2022** with C++ development tools
2. **Set up Visual Studio environment** in Command Prompt:
```bash
"C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
```

3. **Compile invoker.cpp**:
```bash
cl.exe /O2 /EHsc invoker.cpp /link kernel32.lib user32.lib
```

4. **Result**: `invoker.exe` will be created

---

## File Sizes

| Method | Size | Runtime Dependencies |
|--------|------|----------------------|
| pkg executable | ~100-150 MB | None |
| C++ invoker | ~20-50 KB | npm, Node.js |
| Batch launcher | < 1 KB | npm, Node.js |

---

## Troubleshooting

### "pkg command not found"
```bash
npm install -g pkg
# OR use locally installed pkg
npx pkg launcher.js --targets node18-win-x64 --output suno-prompt-generator.exe
```

### Executable doesn't start
- Try running from Command Prompt to see error messages
- Ensure all npm dependencies are installed: `npm install`
- Check file permissions

### File is too large
- This is normal for pkg executables (Node.js + dependencies + app)
- Use compression if needed: `7zip` or `WinRAR`

---

## Distribution

### Option A: Distribute Standalone Executable
- Just share `suno-prompt-generator.exe`
- Users can run it immediately without any installation
- Easiest for end users

### Option B: Distribute Full Source
- Share the entire `SunoPrompt` folder
- Users need to install Node.js first
- Users run `npm install` then `npm start`
- Good for developers who want to modify the code

---

## Next Steps

After creating the executable, you can:
1. Create an installer using NSIS or InnoSetup
2. Sign the executable with a code signing certificate
3. Publish on GitHub releases
4. Create Windows Store app

---

## Support

If you encounter issues:
1. Check the `INVOKER_README.md` for detailed information
2. Run `npm start` manually to see detailed error messages
3. Ensure Node.js 18+ is installed
4. Check that all dependencies are installed: `npm install`
