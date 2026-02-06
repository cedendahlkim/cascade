Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class DpiInfo {
    [DllImport("user32.dll")] public static extern int GetSystemMetrics(int nIndex);
    [DllImport("gdi32.dll")] public static extern int GetDeviceCaps(IntPtr hdc, int nIndex);
    [DllImport("user32.dll")] public static extern IntPtr GetDC(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);
}
"@ -Language CSharp

$smX = [DpiInfo]::GetSystemMetrics(0)
$smY = [DpiInfo]::GetSystemMetrics(1)
Write-Output "SystemMetrics: ${smX}x${smY}"

$hdc = [DpiInfo]::GetDC([IntPtr]::Zero)
$horzRes = [DpiInfo]::GetDeviceCaps($hdc, 8)
$vertRes = [DpiInfo]::GetDeviceCaps($hdc, 10)
$deskHorz = [DpiInfo]::GetDeviceCaps($hdc, 118)
$deskVert = [DpiInfo]::GetDeviceCaps($hdc, 117)
$dpiX = [DpiInfo]::GetDeviceCaps($hdc, 88)
$dpiY = [DpiInfo]::GetDeviceCaps($hdc, 90)
[void][DpiInfo]::ReleaseDC([IntPtr]::Zero, $hdc)

Write-Output "HORZRES: $horzRes  VERTRES: $vertRes"
Write-Output "DESKHORZRES: $deskHorz  DESKVERTRES: $deskVert"
Write-Output "DPI: ${dpiX}x${dpiY}"
Write-Output "Scale: $([math]::Round($deskHorz / $horzRes, 2))"
