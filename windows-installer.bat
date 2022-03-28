@echo off
echo Setup discord-twitter-video-embed by adryd325
echo Script made by bagusnl with GitHub Copilot :P
echo.
echo Make sure chocolatey is installed
echo and script running as administrator


:: check batch running as administrator
:: https://stackoverflow.com/questions/4051883/batch-script-how-to-check-for-admin-rights
:check_Permissions
    echo Administrative permissions required. Detecting permissions...
    
    net session >nul 2>&1
    if %errorLevel% == 0 (
        echo Success: Administrative permissions confirmed.
        goto chococheck
    ) else (
        echo Failure: Current permissions inadequate.
    )
    
    pause >nul
    goto :end



:chococheck
:: check chocolatey installed
:: https://stackoverflow.com/questions/5696907/how-to-check-if-a-program-is-installed-on-windows
echo Checking if chocolatey is installed...
choco >nul 2>&1
if %errorLevel% == 1 (
    echo Success: Chocolatey is installed.
    goto makedir
) else (
    echo Failure: Chocolatey is not installed.
    echo.
    echo Install chocolatey using this guide:
    echo https://chocolatey.org/install
    echo.
    pause >nul
    goto end
)

:makedir
:: make installation directory
mkdir C:\git
cd /D C:\git

:: install dependencies
:: dependencies: git, ffmpeg, yt-dlp, nodejs
:: if error, goto dep_error
echo Installing dependencies...
choco install git ffmpeg yt-dlp nodejs -y
if %errorlevel% == 1 (
    echo Failure: Dependencies not installed.
    echo.
    echo Install dependencies using this guide:
    echo https://chocolatey.org/install
    echo.
    pause >nul
    goto end
) else (
    echo Success: Dependencies installed.
    goto gitclone
)

:: clone repo
:gitclone
:: check if git repo already exists
echo Checking if git repo already exists...
if exist C:\git\discord-twitter-video-embed\discord-twitter-video-embed.exe (
    echo Success: git repo already exists.
    :: delete git repo and clone again
    rmdir /s /q C:\git\discord-twitter-video-embed
    git clone https://github.com/bagusnl/discord-twitter-video-embeds
    goto gitclone_end
) else (
    echo Failure: git repo does not exist.
    echo.
    echo Cloning git repo...
    git clone https://github.com/bagusnl/discord-twitter-video-embeds
    goto gitclone_end
)

:gitclone_end
:: goto discord-twitter-video-embeds
cd discord-twitter-video-embeds

:npmprep
npm install -g pnpm
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

:notchoco
echo Chocolatey is not installed
echo.
goto end

:notadmin
echo You must run this script as administrator
echo.
goto end

:done
echo Setup complete
echo you can try to start the bot by running windows-runner.bat or dtve-runner.bat in your desktop
echo.
goto end 

:end
