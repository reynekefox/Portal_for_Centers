$filePath = "c:\_Dev\Portal_for_Centers\ScreenCreator\client\src\pages\school-dashboard.tsx"
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)
$lines = $content -split "`r`n"
$lines[473] = '        return student ? `${student.first_name} ${student.last_name}` : ' + "'" + 'Неизвестный' + "'" + ';'
$newContent = $lines -join "`r`n"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($filePath, $newContent, $utf8NoBom)
Write-Host "Done"
