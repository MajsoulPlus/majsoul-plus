$pwd = (Get-Location).Path
$build_folder = $pwd + "\build"
New-Item -ItemType "directory" -Path ($build_folder + "\packed") -Force
Set-Location ($build_folder + "\unpacked" )
Get-ChildItem . | ForEach-Object -Process {
  $name = $_.Name
  7z a -tzip ($build_folder + "\packed\" + $name + ".zip") $name -r
}
Set-Location $pwd