@echo off
echo Setup discord-twitter-video-embed by adryd325
echo Script made by bagusnl with GitHub Copilot :P
echo.
echo Make sure chocolatey is installed
echo and script running as administrator

:: store current directory
set CURRENT_DIR=%~dp0

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
:: delete git repo and clone again
rmdir /s C:\git\discord-twitter-video-embeds
git clone https://github.com/bagusnl/discord-twitter-video-embeds
goto gitclone_end

:gitclone_end
:: goto discord-twitter-video-embeds
cd discord-twitter-video-embeds

:npmprep
echo Preparing npm...
echo Due to unknown reasons, script exited after npm install
echo Run windows-postinstall.bat after this part
npm install -g pnpm

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
:: go back to current directory
cd /D %CURRENT_DIR%
