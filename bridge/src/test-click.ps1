param(
    [int]$X = 960,
    [int]$Y = 1050
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class MouseTest {
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")] public static extern bool GetCursorPos(out POINT p);
    [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
    [StructLayout(LayoutKind.Sequential)]
    public struct POINT { public int X; public int Y; }
}
"@ -Language CSharp

# Move and click
[MouseTest]::SetCursorPos($X, $Y)
Start-Sleep -Milliseconds 100

$p = New-Object MouseTest+POINT
[MouseTest]::GetCursorPos([ref]$p)
Write-Output "Moved to: $($p.X),$($p.Y) (requested: $X,$Y)"

# Click
[MouseTest]::mouse_event(0x0002, 0, 0, 0, 0)
Start-Sleep -Milliseconds 30
[MouseTest]::mouse_event(0x0004, 0, 0, 0, 0)
Write-Output "Clicked at $($p.X),$($p.Y)"
