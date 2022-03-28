@echo off
echo Setup discord-twitter-video-embed by adryd325
echo Script made by bagusnl with GitHub Copilot :P
echo.
echo Make sure chocolatey is installed
echo and script running as administrator
echo.

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
echo.
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
echo.
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
echo.
echo Cleaning up previous installation...
del /Q /F C:\Users\%username%\Desktop\dtve-runner.bat
del /Q /F C:\Users\%username%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\windows-runner.bat
rmdir /s /q C:\git\discord-twitter-video-embeds
echo.
echo Cloning repo...
git clone https://github.com/bagusnl/discord-twitter-video-embeds
goto gitclone_end

:gitclone_end
:: goto discord-twitter-video-embeds
cd discord-twitter-video-embeds

:npmprep
echo.
echo Preparing npm...
echo npm and pnpm is funny, exit the corresponding new console window after they're finished
echo and say no (type n and enter) when asked to terminate batch job
start /w npm install -g pnpm
start /w pnpm install

:: make tmp directory at C:\
mkdir C:\tmp

:: edit .env using notepad
echo.
echo Add your token and LOG_CHANNEL ID on the notepad
echo Don't forget to save the file and then exit the notepad
notepad windows-runner.bat

:: make link for windows-runner.bat to startup folder
:: make sure you have edited windows-runner.bat
echo.
echo. Making link for windows-runner.bat to startup folder...
mklink /H C:\Users\%username%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\windows-runner.bat C:\git\discord-twitter-video-embeds\windows-runner.bat
:: make shortcut for windows-runner.bat to desktop folder
:: make sure you have edited windows-runner.bat
echo.
echo. Making shortcut for windows-runner.bat as dtve-runner.bat to desktop folder...
mklink /H C:\Users\%username%\Desktop\dtve-runner.bat C:\git\discord-twitter-video-embeds\windows-runner.bat
goto done

:done
echo Setup complete
echo you can try to start the bot by running windows-runner.bat or dtve-runner.bat in your desktop
echo.
goto end 

:notchoco
echo Chocolatey is not installed
echo.
goto end

:notadmin
echo You must run this script as administrator
echo.
goto end

:end
echo Press any key to exit
pause >nul
