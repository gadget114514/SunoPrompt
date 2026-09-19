#include <windows.h>
#include <string>
#include <filesystem>

namespace fs = std::filesystem;

int main() {
    // Get the directory where this executable is located
    char exePath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    fs::path currentDir = fs::path(exePath).parent_path();

    // Change to the app directory
    SetCurrentDirectoryA(currentDir.string().c_str());

    // Prepare the command to run npm start
    std::string command = "cmd.exe /c npm start";

    // Create process information structure
    STARTUPINFOA si = {};
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_NORMAL;

    PROCESS_INFORMATION pi = {};

    // Create the process
    BOOL bSuccess = CreateProcessA(
        NULL,                           // lpApplicationName
        (char*)command.c_str(),        // lpCommandLine
        NULL,                           // lpProcessAttributes
        NULL,                           // lpThreadAttributes
        FALSE,                          // bInheritHandles
        CREATE_NEW_CONSOLE,             // dwCreationFlags
        NULL,                           // lpEnvironment
        currentDir.string().c_str(),   // lpCurrentDirectory
        &si,                            // lpStartupInfo
        &pi                             // lpProcessInformation
    );

    if (bSuccess) {
        // Close process and thread handles
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        return 0;
    } else {
        // Error handling
        MessageBoxA(
            NULL,
            "Failed to start Suno Prompt Generator.\nMake sure npm is installed and in PATH.",
            "Suno Prompt Generator",
            MB_ICONERROR | MB_OK
        );
        return 1;
    }
}
