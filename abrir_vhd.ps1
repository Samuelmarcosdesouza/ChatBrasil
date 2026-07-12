$senha_mestra = "1234"
$entrada = Read-Host "Digite a SENHA para MONTAR O COFRE no Gerenciador de Arquivos" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($entrada)
$senha_digitada = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ($senha_digitada -eq $senha_mestra) {
    Write-Host "Senha Correta! Abrindo Cofre..." -ForegroundColor Green
    Mount-VHD -Path "C:\Users\PESSOAL\Documents\Cofre_ChatBrasil.vhd"
    $drive = (Get-DiskImage -ImagePath "C:\Users\PESSOAL\Documents\Cofre_ChatBrasil.vhd" | Get-Disk | Get-Partition | Get-Volume).DriveLetter
    explorer.exe "$($drive):\"
} else {
    Write-Host "Senha incorreta!" -ForegroundColor Red
}
