<#
  build_ats_docs.ps1  — Phase 6D final ATS export (Word COM).
  Builds employer-facing DOCX+PDF (CV, OLIHA letter, Sukhi letter) and two
  internal review PDFs (CV + relevant letter), from byte-faithful approved text.
  ATS-safe: single column, standard font, no tables/graphics/photo/metadata.
  Autocorrect/smart-quotes disabled so the approved wording is preserved exactly.
  A fresh Word instance is used per file (Word 12.0 is unstable across documents).

  Usage:
    powershell -File build_ats_docs.ps1 -InputDir <dir with cv.txt,oliha.txt,sukhi.txt> -OutDir <output dir>
#>
param(
  [Parameter(Mandatory=$true)][string]$InputDir,
  [Parameter(Mandatory=$true)][string]$OutDir
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
function ReadUtf8($p){ return ([System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)).Replace("`r","") }
$EM = [char]0x2014
$HEADINGS = @('PROFESSIONAL SUMMARY','CORE SKILLS','PROFESSIONAL EXPERIENCE','EDUCATION AND DIPLOMAS','ADDITIONAL TRAINING','LANGUAGES','RELOCATION')
$cvText    = ReadUtf8 (Join-Path $InputDir 'cv.txt')
$olihaText = ReadUtf8 (Join-Path $InputDir 'oliha.txt')
$sukhiText = ReadUtf8 (Join-Path $InputDir 'sukhi.txt')

function New-Word {
  Get-Process WINWORD -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  Start-Sleep -Milliseconds 300
  $w = New-Object -ComObject Word.Application
  $w.Visible=$false; $w.DisplayAlerts=0
  try { $w.Options.AutoFormatAsYouTypeReplaceQuotes  = $false } catch {}
  try { $w.Options.AutoFormatAsYouTypeReplaceHyphens = $false } catch {}
  try { $w.Options.AutoFormatAsYouTypeReplaceSymbols = $false } catch {}
  try { $w.Options.AutoFormatAsYouTypeApplyBulletedLists = $false } catch {}
  return $w
}
function Close-Word($w){ try { $w.Quit() } catch {}; Get-Process WINWORD -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 200 }
function Set-Margins($w,$doc,$inch){ $ps=$doc.PageSetup; $ps.TopMargin=$w.InchesToPoints($inch); $ps.BottomMargin=$w.InchesToPoints($inch); $ps.LeftMargin=$w.InchesToPoints($inch); $ps.RightMargin=$w.InchesToPoints($inch) }

function Add-CV($w,$sel,$text){
  $seen=0
  foreach($raw in $text.Split("`n")){
    $line=$raw.TrimEnd(); if($line -eq ''){continue}; $seen++
    $sel.Font.Name='Calibri'; $sel.Font.Bold=$false; $sel.Font.Size=11
    $pf=$sel.ParagraphFormat; $pf.LeftIndent=0; $pf.SpaceBefore=0; $pf.SpaceAfter=4; $pf.KeepWithNext=$false; $pf.LineSpacingRule=0
    if($seen -eq 1){ $sel.Font.Bold=$true; $sel.Font.Size=15; $pf.SpaceAfter=2 }
    elseif($seen -eq 2){ $sel.Font.Size=10.5; $pf.SpaceAfter=8 }
    elseif($HEADINGS -contains $line){ $sel.Font.Bold=$true; $sel.Font.Size=11.5; $pf.SpaceBefore=8; $pf.SpaceAfter=3; $pf.KeepWithNext=$true }
    elseif($line.StartsWith('- ')){ $pf.LeftIndent=$w.InchesToPoints(0.22); $pf.SpaceAfter=2 }
    elseif(($line -match [regex]::Escape($EM)) -and ($line -match '\(')){ $sel.Font.Bold=$true; $pf.SpaceBefore=4; $pf.SpaceAfter=2; $pf.KeepWithNext=$true }
    $sel.TypeText($line); $sel.TypeParagraph()
  }
}
function Add-Letter($w,$sel,$text){
  foreach($blk in [regex]::Split($text.Trim(), "`n[ \t]*`n")){
    $b=$blk.TrimEnd(); if($b -eq ''){continue}
    $sel.Font.Name='Calibri'; $sel.Font.Bold=$false; $sel.Font.Size=11
    $pf=$sel.ParagraphFormat; $pf.LeftIndent=0; $pf.SpaceBefore=0; $pf.SpaceAfter=10; $pf.LineSpacingRule=0
    $inner=$b.Split("`n")
    for($j=0;$j -lt $inner.Count;$j++){ $sel.TypeText($inner[$j].TrimEnd()); if($j -lt $inner.Count-1){ $sel.TypeText([char]11) } }
    $sel.TypeParagraph()
  }
}
function Build-Single($kind,$text,$base){
  $w=New-Word; try {
    $doc=$w.Documents.Add(); Set-Margins $w $doc ($(if($kind -eq 'cv'){0.8}else{1.0}))
    $sel=$w.Selection; if($kind -eq 'cv'){ Add-CV $w $sel $text } else { Add-Letter $w $sel $text }
    $doc.SaveAs((Join-Path $OutDir ($base+'.docx')),12)
    $doc.ExportAsFixedFormat((Join-Path $OutDir ($base+'.pdf')),17)
    $pages=$doc.ComputeStatistics(2); $doc.Close(0)
    "{0}: docx+pdf pages={1}" -f $base,$pages
  } finally { Close-Word $w }
}
function Build-Review($cv,$letter,$base){
  $w=New-Word; try {
    $doc=$w.Documents.Add(); Set-Margins $w $doc 0.8
    $sel=$w.Selection; Add-CV $w $sel $cv; $sel.InsertBreak(7); Add-Letter $w $sel $letter
    $doc.ExportAsFixedFormat((Join-Path $OutDir ($base+'.pdf')),17)
    $pages=$doc.ComputeStatistics(2); $doc.Close(0)
    "{0}: pdf pages={1}" -f $base,$pages
  } finally { Close-Word $w }
}

Build-Single 'cv'     $cvText    'Samira_Benaciri_CV_Hairstylist'
Build-Single 'letter' $olihaText 'Samira_Benaciri_Cover_Letter_OLIHA'
Build-Single 'letter' $sukhiText 'Samira_Benaciri_Cover_Letter_Sukhi'
Build-Review $cvText $olihaText 'Samira_Benaciri_Application_OLIHA_Review'
Build-Review $cvText $sukhiText 'Samira_Benaciri_Application_Sukhi_Review'