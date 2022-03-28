@echo off
title discord-twitter-video-embed runner
echo discord-twitter-video-embed runner
echo This script will run discord-twitter-video-embed bot instance and restart it if it crashes
echo.
echo Make sure you have edited the bat file to add TOKEN and LOG_CHANNEL

:: set TOKEN and LOG_CHANNEL environment
set TOKEN={your token}
set LOG_CHANNEL={your log channel id}
set STATUS=adryd.co/twitter-embeds
set INSTANCE=production

:: cd to discord-twitter-video-embeds
cd /D C:\git\discord-twitter-video-embeds

:: show time
echo Runner started at %time%
:runner
node src\index.js

:: goto runner if error
echo Error occured, restarting bot
echo time of error %time%
goto runner