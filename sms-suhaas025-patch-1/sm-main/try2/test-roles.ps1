# PowerShell script to test updating multiple roles

# Configuration
$apiUrl = "http://localhost:8080/api"
$userId = 44  # The user ID to update
$adminUsername = "admin"  # Replace with your admin username
$adminPassword = "admin123"  # Replace with your admin password

# Step 1: Login as admin
Write-Host "Logging in as admin..."
$loginBody = @{
    username = $adminUsername
    password = $adminPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/signin" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.accessToken
    if (-not $token) {
        $token = $loginResponse.token
    }
    Write-Host "Login successful, received token: $token"
}
catch {
    Write-Host "Login failed: $_"
    exit
}

# Step 2: Update user roles with verbose output
Write-Host "Updating roles for user $userId to: admin, moderator, user"

$rolesBody = @{
    roles = @("admin", "moderator", "user")
} | ConvertTo-Json

Write-Host "Request payload: $rolesBody"

try {
    $updateResponse = Invoke-RestMethod -Uri "$apiUrl/users/$userId/roles" -Method Put -ContentType "application/json" -Headers @{Authorization = "Bearer $token"} -Body $rolesBody
    Write-Host "Role update response: $($updateResponse | ConvertTo-Json)"
}
catch {
    Write-Host "Role update failed: $_"
    Write-Host "Response: $($_.Exception.Response)"
    Write-Host "Status code: $($_.Exception.Response.StatusCode)"
    exit
}

# Step 3: Verify the update by getting user details
Write-Host "Fetching details for user $userId to verify roles..."

try {
    $userDetails = Invoke-RestMethod -Uri "$apiUrl/users/$userId" -Method Get -Headers @{Authorization = "Bearer $token"}
    Write-Host "User details: $($userDetails | ConvertTo-Json)"
    
    # Check if multiple roles were applied
    $roles = $userDetails.roles
    Write-Host "User now has these roles: $($roles | ConvertTo-Json)"
    
    if ($roles.Count -gt 1) {
        Write-Host "SUCCESS: Multiple roles were applied"
    }
    else {
        Write-Host "FAILURE: Only one role was applied"
    }
}
catch {
    Write-Host "Failed to get user details: $_"
} 