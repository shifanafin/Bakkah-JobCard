$file = 'C:\Users\shifana\Downloads\bakkah\bakkah\app\HomeClient.tsx'
$tmpFile = 'C:\Users\shifana\Downloads\bakkah\bakkah\app\HomeClient.tmp.tsx'
$content = Get-Content $file -Raw

# 1. Text color opacity variants (replace specific first to avoid substring issues)
$content = $content -replace 'text-white/10\b', 'text-gray-400 dark:text-white/10'
$content = $content -replace 'text-white/15\b', 'text-gray-400 dark:text-white/15'
$content = $content -replace 'text-white/20\b', 'text-gray-400 dark:text-white/20'
$content = $content -replace 'text-white/25\b', 'text-gray-400 dark:text-white/25'
$content = $content -replace 'text-white/30\b', 'text-gray-500 dark:text-white/30'
$content = $content -replace 'text-white/35\b', 'text-gray-500 dark:text-white/35'
$content = $content -replace 'text-white/40\b', 'text-gray-500 dark:text-white/40'
$content = $content -replace 'text-white/45\b', 'text-gray-600 dark:text-white/45'
$content = $content -replace 'text-white/50\b', 'text-gray-600 dark:text-white/50'
$content = $content -replace 'text-white/55\b', 'text-gray-600 dark:text-white/55'
$content = $content -replace 'text-white/60\b', 'text-gray-600 dark:text-white/60'
$content = $content -replace 'text-white/80\b', 'text-gray-800 dark:text-white/80'

# 2. Standalone text-white (not followed by / or word char)
$content = $content -replace 'text-white(?![/\w])', 'text-gray-900 dark:text-white'

# 3. Border variants (longest/most specific first)
$content = $content -replace 'border-white/\[0\.12\]', 'border-gray-200 dark:border-white/[0.12]'
$content = $content -replace 'border-white/\[0\.08\]', 'border-gray-200 dark:border-white/[0.08]'
$content = $content -replace 'border-white/\[0\.06\]', 'border-gray-200 dark:border-white/[0.06]'
$content = $content -replace 'border-white/\[0\.05\]', 'border-gray-200 dark:border-white/[0.05]'
$content = $content -replace 'border-white/\[0\.04\]', 'border-gray-200 dark:border-white/[0.04]'
$content = $content -replace 'border-white/20\b', 'border-gray-200 dark:border-white/20'
$content = $content -replace 'border-white/10\b', 'border-gray-200 dark:border-white/10'

# 4. Background white opacity variants
$content = $content -replace 'bg-white/\[0\.02\]', 'bg-gray-50 dark:bg-white/[0.02]'
$content = $content -replace 'bg-white/\[0\.04\]', 'bg-gray-100 dark:bg-white/[0.04]'
$content = $content -replace 'bg-white/\[0\.06\]', 'bg-gray-100 dark:bg-white/[0.06]'
$content = $content -replace 'bg-white/5\b', 'bg-gray-50 dark:bg-white/5'

# 5. Dark background opacity variants (before standalone)
$content = $content -replace 'bg-\[#0a0a0a\]/98', 'bg-white/98 dark:bg-[#0a0a0a]/98'
$content = $content -replace 'bg-\[#0a0a0a\]/95', 'bg-white/95 dark:bg-[#0a0a0a]/95'
$content = $content -replace 'bg-\[#0a0a0a\]/80', 'bg-white/80 dark:bg-[#0a0a0a]/80'
$content = $content -replace 'bg-\[#0a0a0a\]/40', 'bg-white/40 dark:bg-[#0a0a0a]/40'
$content = $content -replace 'bg-\[#0a0a0a\]/30', 'bg-white/30 dark:bg-[#0a0a0a]/30'

# 6. Standalone dark backgrounds
$content = $content -replace 'bg-\[#0a0a0a\](?![/\w])', 'bg-white dark:bg-[#0a0a0a]'
$content = $content -replace 'bg-\[#0d0d0f\]', 'bg-gray-50 dark:bg-[#0d0d0f]'

# 7. Surface background
$content = $content -replace 'bg-surface-900\b', 'bg-surface-50 dark:bg-surface-900'

# 8. Gradient color variants for dark backgrounds
$content = $content -replace 'from-\[#0a0a0a\]/30', 'from-white/30 dark:from-[#0a0a0a]/30'
$content = $content -replace 'from-\[#0a0a0a\]/40', 'from-white/40 dark:from-[#0a0a0a]/40'
$content = $content -replace 'to-\[#0a0a0a\]/30', 'to-white/30 dark:to-[#0a0a0a]/30'
$content = $content -replace 'to-\[#0a0a0a\]/40', 'to-white/40 dark:to-[#0a0a0a]/40'
$content = $content -replace 'from-\[#0a0a0a\](?![/\w])', 'from-white dark:from-[#0a0a0a]'
$content = $content -replace 'to-\[#0a0a0a\](?![/\w])', 'to-white dark:to-[#0a0a0a]'

# 9. Ring variants
$content = $content -replace 'ring-white/10\b', 'ring-gray-200 dark:ring-white/10'

Set-Content $tmpFile -Value $content -NoNewline
Copy-Item $tmpFile $file -Force
Remove-Item $tmpFile
Write-Host "Done - all replacements applied to HomeClient.tsx"
