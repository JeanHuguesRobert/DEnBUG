param(
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$Query,
    [string]$command,
    [string]$output,
    [string]$err
)

# Check if query ends with ! to capture previous command output
if ($Query.Count -gt 0 -and $Query[-1].EndsWith("!")) {
    # Remove ! from the last argument
    $Query[-1] = $Query[-1].TrimEnd('!')
    
    # Get previous command and its output
    $lastCommand = (Get-History -Count 1).CommandLine
    if ($lastCommand -ne "h") {
        try {
            $lastOutput = Invoke-Expression $lastCommand | Out-String
            $context = @"
Command: $lastCommand
Output: $lastOutput
"@
            gh copilot explain ($Query -join " ") --context $context
        }
        catch {
            $errorMsg = $_.Exception.Message
            $context = @"
Command: $lastCommand
Error: $errorMsg
"@
            gh copilot explain ($Query -join " ") --context $context
        }
    }
}
# Regular query or explicit output capture
elseif ($command) {
    $queryText = $Query -join " "
    $context = "Command: $command`n"
    if ($output) {
        $context += "Output: $output"
    }
    if ($err) {
        $context += "Error: $err"
    }
    
    gh copilot explain "$queryText" --context "$context"
}
# Simple query without context
else {
    $queryText = $Query -join " "
    gh copilot explain "$queryText"
}