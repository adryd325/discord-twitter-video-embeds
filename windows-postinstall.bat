@echo
echo continue installing...
pnpm install

:: make tmp directory at C:\
mkdir C:\tmp

:: edit .env using notepad
echo add your token and log channel id
notepad windows-runner.bat

:: make link for windows-runner.bat to startup folder
:: make sure you have edited windows-runner.bat
mklink C:\Users\%username%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\windows-runner.bat windows-runner.bat
:: make shortcut for windows-runner.bat to desktop folder
:: make sure you have edited windows-runner.bat
mklink C:\Users\%username%\Desktop\dtve-runner.bat windows-runner.bat
goto done