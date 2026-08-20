<#
  render_pdf.ps1 — headless PDF -> PNG page renderer (Windows.Data.Pdf WinRT).
  Used for Phase 6D visual QA. No screen capture, no desktop interaction.
  NOTE: render to a non-OneDrive-synced folder (WinRT StorageFolder can fail on OneDrive paths).
  Usage: powershell -File render_pdf.ps1 -Pdf <file.pdf> -OutDir <dir> -Prefix <name>
#>
param([Parameter(Mandatory=$true)][string]$Pdf, [Parameter(Mandatory=$true)][string]$OutDir, [string]$Prefix='page')
$ErrorActionPreference='Stop'
[void][Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime]
[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Storage.StorageFolder, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
$asTaskAct = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' })[0]
function AwaitOp($op,$T){ $t=$asTask.MakeGenericMethod($T).Invoke($null,@($op)); $t.Wait(-1)|Out-Null; $t.Result }
function AwaitAct($a){ $t=$asTaskAct.Invoke($null,@($a)); $t.Wait(-1)|Out-Null }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$file = AwaitOp ([Windows.Storage.StorageFile]::GetFileFromPathAsync($Pdf)) ([Windows.Storage.StorageFile])
$pdfDoc = AwaitOp ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($file)) ([Windows.Data.Pdf.PdfDocument])
$folder = AwaitOp ([Windows.Storage.StorageFolder]::GetFolderFromPathAsync($OutDir)) ([Windows.Storage.StorageFolder])
for($i=0;$i -lt $pdfDoc.PageCount;$i++){
  $page = $pdfDoc.GetPage($i)
  $opts = New-Object Windows.Data.Pdf.PdfPageRenderOptions; $opts.DestinationWidth = [uint32]1275
  $name = "{0}_p{1}.png" -f $Prefix,($i+1)
  $of = AwaitOp ($folder.CreateFileAsync($name,[Windows.Storage.CreationCollisionOption]::ReplaceExisting)) ([Windows.Storage.StorageFile])
  $stream = AwaitOp ($of.OpenAsync([Windows.Storage.FileAccessMode]::ReadWrite)) ([Windows.Storage.Streams.IRandomAccessStream])
  AwaitAct ($page.RenderToStreamAsync($stream,$opts)); $stream.Dispose(); $page.Dispose()
  "rendered $name"
}
"pages=$($pdfDoc.PageCount)"