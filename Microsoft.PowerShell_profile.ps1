param(
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$Query
)

# Remove any existing 'h' alias if it exists
if (Test-Path Alias:h) { 
    Remove-Item Alias:h -Force 
}

# Create new function for Copilot helper
function global:h { 
    if (Test-Path 'C:\tweesic\denbug\h.ps1') {
        & 'C:\tweesic\denbug\h.ps1' @args 
    } else {
        Write-Host "Error: h.ps1 not found at C:\tweesic\denbug\h.ps1" -ForegroundColor Red
        return
    }
}
