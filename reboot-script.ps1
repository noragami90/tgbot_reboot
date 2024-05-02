# reboot-script.ps1
param(
    [string]$ComputerName,
    [string]$User,
    [string]$Pass
)

$CredentialPassword = ConvertTo-SecureString $Pass -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential ($User, $CredentialPassword)
try {
    Restart-Computer -ComputerName $ComputerName -Credential $Credential -ErrorAction Stop
    Write-Output "Успешно"
}
catch {
    Write-Output "Ошибка"
}
