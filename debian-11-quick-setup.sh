#!/bin/bash
echo ""
echo "### discord-twitter-video-embeds"
echo ""
echo "It is reccomended you run this in a fresh Debian 11 vm or container, though it should not conflict with anything unless you rely on older versions of nodejs. We install nodejs 16 from nodesource"
echo ""
echo "Before continuing, please review what the script will do"
echo "In short, we will run nodesource's install script; install sudo, gcc, g++, make, nodejs, pnpm, ffmpeg and git; clone the repo to /opt/discord-twitter-video-embeds; install dependencies with pnpm; create a user called discord-twitter-video-embeds; and create and enable a systemd unit called discord-twitter-video-embeds.service"
echo ""
echo -n "Continue? [y/N]: "

# Forks please change this
REPO="https://github.com/adryd325/discord-twitter-video-embeds"

read -r confirm
if [[ ${confirm,,} != "y" ]]; then
  exit 1
fi
wget -qO- https://deb.nodesource.com/setup_16.x | bash -
apt-get update
apt-get install -y nodejs ffmpeg git sudo gcc g++ make
npm install -g pnpm
id discord-twitter-video-embeds &> /dev/null || useradd -m discord-twitter-video-embeds
mkdir -p /opt/discord-twitter-video-embeds
chown -R discord-twitter-video-embeds:discord-twitter-video-embeds /opt/discord-twitter-video-embeds
[[ -z "$(ls -A /opt/discord-twitter-video-embeds)" ]] && sudo -u discord-twitter-video-embeds git clone "$REPO" /opt/discord-twitter-video-embeds
sudo -u discord-twitter-video-embeds pnpm i -C /opt/discord-twitter-video-embeds
mkdir -p /etc/systemd/system
[[ -e /etc/systemd/system/discord-twitter-video-embeds.service ]] || cat << EOF > /etc/systemd/system/discord-twitter-video-embeds.service
[Unit]
Description=discord-twitter-video-embeds
StartLimitIntervalSec=600
StartLimitBurst=19

[Service]
Environment="STATUS=adryd.co/twitter-embeds"
Environment="TOKEN=your_bot_token_here"
Environment="LOG_CHANNEL=your_log_channel_here"
Environment="INSTANCE=production"
WorkingDirectory=/opt/discord-twitter-video-embeds

User=discord-twitter-video-embeds
Group=discord-twitter-video-embeds

ExecStart=/usr/bin/env node src/index.js
Restart=always
RestartSec=30

ProtectSystem=full
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

[Install]
WantedBy=multi-user.target
EOF
echo -n "You will be editing the systemd unit file, please place your bot token and log channel here. Press any key to continue"
read -r
nano /etc/systemd/system/discord-twitter-video-embeds.service
systemctl daemon-reload
systemctl enable discord-twitter-video-embeds.service
systemctl start discord-twitter-video-embeds.service