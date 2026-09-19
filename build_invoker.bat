@echo off
REM Compile the C++ invoker program
REM Requires Visual Studio or MinGW to be installed

echo Compiling invoker.cpp...

REM Try using cl.exe (Visual Studio compiler)
where cl.exe >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using MSVC compiler...
    cl.exe /O2 /EHsc invoker.cpp /link kernel32.lib user32.lib
    if %ERRORLEVEL% EQU 0 (
        echo Compilation successful! invoker.exe created.
        pause
        exit /b 0
    )
)

REM Try using g++ (MinGW compiler)
where g++.exe >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using MinGW compiler...
    g++.exe -O2 -std=c++17 invoker.cpp -o invoker.exe -lkernel32 -luser32
    if %ERRORLEVEL% EQU 0 (
        echo Compilation successful! invoker.exe created.
        pause
        exit /b 0
    )
)

echo Error: No C++ compiler found.
echo Please install Visual Studio or MinGW and add it to PATH.
pause
exit /b 1
