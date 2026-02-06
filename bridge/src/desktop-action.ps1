# Desktop action script - performs a sequence of actions in ONE process
# All input uses SendInput (bypasses UIPI restrictions)
# Usage: desktop-action.ps1 -Actions "focus:title|click:x,y|type:text|key:enter|sleep:ms"
param(
    [Parameter(Mandatory=$true)]
    [string]$Actions,
    [int]$ScreenWidth = 1920,
    [int]$ScreenHeight = 1080
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Diagnostics;

public class Desktop {
    // --- Mouse ---
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
    
    // --- Window ---
    [DllImport("user32.dll")] public static extern IntPtr WindowFromPoint(POINT p);
    [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr hwnd, uint gaFlags);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool AllowSetForegroundWindow(int dwProcessId);
    
    // --- Keyboard via SendInput ---
    [DllImport("user32.dll", SetLastError=true)]
    public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
    
    [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X; public int Y; }
    
    [StructLayout(LayoutKind.Sequential)]
    public struct INPUT {
        public uint type;
        public INPUTUNION U;
        public static int Size { get { return Marshal.SizeOf(typeof(INPUT)); } }
    }
    
    [StructLayout(LayoutKind.Explicit)]
    public struct INPUTUNION {
        [FieldOffset(0)] public KEYBDINPUT ki;
    }
    
    [StructLayout(LayoutKind.Sequential)]
    public struct KEYBDINPUT {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }
    
    const uint INPUT_KEYBOARD = 1;
    const uint KEYEVENTF_KEYUP = 0x0002;
    const uint KEYEVENTF_UNICODE = 0x0004;
    
    // Virtual key codes
    const ushort VK_RETURN = 0x0D;
    const ushort VK_TAB = 0x09;
    const ushort VK_ESCAPE = 0x1B;
    const ushort VK_BACK = 0x08;
    const ushort VK_DELETE = 0x2E;
    const ushort VK_CONTROL = 0xA2;
    const ushort VK_SHIFT = 0xA0;
    const ushort VK_ALT = 0xA4;
    const ushort VK_V = 0x56;
    const ushort VK_A = 0x41;
    const ushort VK_C = 0x43;
    const ushort VK_X = 0x58;
    const ushort VK_Z = 0x5A;
    
    static INPUT MakeKeyDown(ushort vk) {
        INPUT i = new INPUT(); i.type = INPUT_KEYBOARD;
        i.U.ki.wVk = vk; i.U.ki.dwFlags = 0;
        return i;
    }
    static INPUT MakeKeyUp(ushort vk) {
        INPUT i = new INPUT(); i.type = INPUT_KEYBOARD;
        i.U.ki.wVk = vk; i.U.ki.dwFlags = KEYEVENTF_KEYUP;
        return i;
    }
    
    public static void PressKey(ushort vk) {
        INPUT[] inputs = { MakeKeyDown(vk), MakeKeyUp(vk) };
        SendInput(2, inputs, INPUT.Size);
        Thread.Sleep(30);
    }
    
    public static void PressCombo(ushort mod, ushort key) {
        INPUT[] inputs = { MakeKeyDown(mod), MakeKeyDown(key), MakeKeyUp(key), MakeKeyUp(mod) };
        SendInput(4, inputs, INPUT.Size);
        Thread.Sleep(50);
    }
    
    public static void TypeUnicode(string text) {
        foreach (char c in text) {
            ushort scan = (ushort)c;
            INPUT down = new INPUT(); down.type = INPUT_KEYBOARD;
            down.U.ki.wScan = scan; down.U.ki.dwFlags = KEYEVENTF_UNICODE;
            INPUT up = new INPUT(); up.type = INPUT_KEYBOARD;
            up.U.ki.wScan = scan; up.U.ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;
            SendInput(2, new INPUT[] { down, up }, INPUT.Size);
            Thread.Sleep(5);
        }
    }
    
    public static void ClipboardPaste(ushort vkCtrl, ushort vkV) {
        PressCombo(vkCtrl, vkV);
    }
    
    public static void Click(int x, int y) {
        SetCursorPos(x, y);
        Thread.Sleep(80);
        POINT pt; pt.X = x; pt.Y = y;
        IntPtr hwnd = WindowFromPoint(pt);
        IntPtr root = GetAncestor(hwnd, 2);
        if (root != IntPtr.Zero) {
            AllowSetForegroundWindow(-1);
            SetForegroundWindow(root);
            Thread.Sleep(200);
        }
        mouse_event(0x0002, 0, 0, 0, 0);
        Thread.Sleep(30);
        mouse_event(0x0004, 0, 0, 0, 0);
        Thread.Sleep(100);
    }
    
    public static bool FocusByTitle(string title) {
        AllowSetForegroundWindow(-1);
        foreach (var proc in Process.GetProcesses()) {
            try {
                if (!string.IsNullOrEmpty(proc.MainWindowTitle) && 
                    proc.MainWindowTitle.IndexOf(title, StringComparison.OrdinalIgnoreCase) >= 0) {
                    SetForegroundWindow(proc.MainWindowHandle);
                    Thread.Sleep(300);
                    return true;
                }
            } catch { }
        }
        return false;
    }
    
    public static ushort GetVK(string name) {
        switch (name.ToLower()) {
            case "enter": case "return": return VK_RETURN;
            case "tab": return VK_TAB;
            case "escape": case "esc": return VK_ESCAPE;
            case "backspace": case "back": return VK_BACK;
            case "delete": case "del": return VK_DELETE;
            case "ctrl": case "control": return VK_CONTROL;
            case "shift": return VK_SHIFT;
            case "alt": return VK_ALT;
            default: 
                if (name.Length == 1) return (ushort)char.ToUpper(name[0]);
                return 0;
        }
    }
}
"@ -Language CSharp

# Set clipboard access
Add-Type -AssemblyName System.Windows.Forms

$results = @()

foreach ($action in $Actions.Split('|')) {
    $parts = $action.Split(':', 2)
    $cmd = $parts[0].Trim()
    $arg = if ($parts.Length -gt 1) { $parts[1].Trim() } else { "" }

    switch ($cmd) {
        "focus" {
            $ok = [Desktop]::FocusByTitle($arg)
            if ($ok) { $results += "Focused: $arg" } else { $results += "NOT FOUND: $arg" }
        }
        "click" {
            $coords = $arg.Split(',')
            $pctX = [double]$coords[0]
            $pctY = [double]$coords[1]
            $sx = [math]::Round(($pctX / 100) * $ScreenWidth)
            $sy = [math]::Round(($pctY / 100) * $ScreenHeight)
            [Desktop]::Click($sx, $sy)
            $results += "Clicked ($pctX%,$pctY%) = screen($sx,$sy)"
        }
        "type" {
            # Use SendInput with KEYEVENTF_UNICODE (bypasses UIPI)
            [Desktop]::TypeUnicode($arg)
            $results += "Typed $($arg.Length) chars"
        }
        "key" {
            $keyName = $arg.Trim('{}').ToLower()
            if ($keyName.Contains('+')) {
                $kparts = $keyName.Split('+')
                $mod = [Desktop]::GetVK($kparts[0])
                $key = [Desktop]::GetVK($kparts[1])
                if ($mod -ne 0 -and $key -ne 0) {
                    [Desktop]::PressCombo($mod, $key)
                    $results += "Key: $arg"
                } else {
                    $results += "Unknown key combo: $arg"
                }
            } else {
                $vk = [Desktop]::GetVK($keyName)
                if ($vk -ne 0) {
                    [Desktop]::PressKey($vk)
                    $results += "Key: $keyName"
                } else {
                    $results += "Unknown key: $keyName"
                }
            }
        }
        "sleep" {
            $ms = [int]$arg
            Start-Sleep -Milliseconds $ms
            $results += "Slept ${ms}ms"
        }
    }
}

Write-Output ($results -join "`n")
