# Suno Prompt Generator - C++ Invoker

## Overview
The C++ invoker is a lightweight executable program that launches the Suno Prompt Generator Electron application without requiring the user to open a terminal or run `npm start` manually.

## Files
- `invoker.cpp` - C++ source code for the invoker program
- `build_invoker.bat` - Build script to compile the invoker

## Requirements
To compile the invoker, you need one of the following C++ compilers installed:
- **Visual Studio** (with MSVC compiler `cl.exe`)
- **MinGW** (with `g++.exe`)

Both must be added to your system PATH environment variable.

## How to Build

### Option 1: Using the Build Script (Recommended)
1. Open Command Prompt or PowerShell
2. Navigate to the SunoPrompt directory
3. Run `build_invoker.bat`
4. The script will detect your compiler and compile automatically

### Option 2: Manual Compilation

**Using MSVC (Visual Studio):**
```bash
cl.exe /O2 /EHsc invoker.cpp /link kernel32.lib user32.lib
```

**Using MinGW:**
```bash
g++.exe -O2 -std=c++17 invoker.cpp -o invoker.exe -lkernel32 -luser32
```

## Output
After successful compilation, `invoker.exe` will be created in the same directory.

## Usage
Simply double-click `invoker.exe` to launch the Suno Prompt Generator application. The program will:
1. Detect its own location
2. Navigate to the application directory
3. Execute `npm start` to launch Electron

## Features
- **Simple Execution**: No terminal window needed for users
- **Error Handling**: Shows a message box if npm is not found
- **Lightweight**: Small executable size (~20-50KB)
- **Cross-Platform Ready**: Can be adapted for other OSes

## Troubleshooting

### "npm is not recognized"
- Ensure Node.js and npm are installed globally
- Add npm to your system PATH environment variable
- Restart Command Prompt after installing Node.js

### Compilation Fails
- Ensure a C++ compiler is installed and added to PATH
- Try installing Visual Studio Community (free) or MinGW
- Verify compiler is accessible: `cl.exe --version` or `g++ --version`

### Application Doesn't Launch
- Check that all npm dependencies are installed: `npm install`
- Ensure Electron is in node_modules: `npm list electron`
- Run `npm start` manually to see detailed error messages

## Creating a Shortcut
You can create a Windows shortcut to `invoker.exe` for easier access:
1. Right-click `invoker.exe`
2. Select "Send to" > "Desktop (create shortcut)"
3. Rename the shortcut to "Suno Prompt Generator"
4. (Optional) Right-click shortcut > Properties > Change Icon to customize
