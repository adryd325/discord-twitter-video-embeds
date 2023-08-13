# Discord External Video Embeds

**NOW WORKS WITH TEXT AND IMAGE TWITTER POSTS**

I'm a Discord bot that fixes your broken Twitter, TikTok and Reddit videos. You can find a list of public instances here: https://adryd.co/twitter-embeds.

https://user-images.githubusercontent.com/48024900/130885482-45c3828b-a679-4427-9b6f-0210698276b5.mp4

## Description

Twitter Embeds fixes video embeds from Twitter, TikTok and Reddit on Discord with a goal of convinience, seamlessness, and feature-completeness. It parses and obeys Discord's own markdown rules, and allows users to delete their own messages

### Special Thanks

- **[Brecert](https://github.com/Brecert)**: Twitter Client Implementation.
- **[Youtube DL](https://github.com/ytdl-org/youtube-dl)**: Reference for Instagram, Reddit, Tiktok and Twitter Clients.
- **[general-programming](https://generalprogramming.org/)**: Allowing me to use proxy.knotty.dev as a fallback for oversized reddit videos.
- **BLOCKLETTER Discord**: Initially pushing me to make this
- **[Cynthia](https://c7.pm/)**: Implementing seperate upload limits for boosted servers. Various other small features/improvements.

## Usage

You can use the bot by [adding it to your Discord server](https://adryd.co/twitter-embeds), or sending it a direct message. It has 3 different modes that can be changed by a server administrator (Manage Server permission).

- The video reply mode will reply with a file or direct link to a video.

  <img src="https://adryd.co/public/twitter-video-embeds/video_reply.png" width="611">

- Re-embed will remove the embeds on the original message and reply with a new set of embeds, along with video attachments.

  <img src="https://adryd.co/public/twitter-video-embeds/re_embed.png" width="505">

- Re-compose uses a webhook to recompose the original message with a new set of embeds.

  <img src="https://adryd.co/public/twitter-video-embeds/re_compose.png" width="507">

### Additional Features

- The bot obeys spoilers, and all of Discord's markdown rules that may prevent a link from embeding (Including quirks)
- Users can delete their own re-composed messages or bot replies to their messages bt reacting with an "X" emoji.
- The bot integrates with [HiddenPhox](https://discordapp.com/oauth2/authorize?client_id=173441062243663872&scope=bot) and replies to HiddenPhox's quote-retweet unrolling

### Quirks

- If re-embed or re-compose fail, the bot falls back to video reply mode.
- re-embed and re-compose attach a file sepperately since [Discord doesn't allow bots to add videos to embeds](https://github.com/discord/discord-api-docs/discussions/3456).
- By following Discord's markdown rules exactly, it also has some of the same quirks; such as spoilers needing to be spaced out.

## Hosting Your Own Instance

I'd encourage you host your own instances as it reduces load on my server

The bot requires the following permissions/intents when being added
bot, application.commands
Manage Webhooks, Send Messages, Send Messages in Threads, Manage Messages, Embed Links, Attach Files

A quick installation script is available. As root run:

```sh
wget https://raw.githubusercontent.com/adryd325/discord-twitter-video-embeds/main/debian-11-quick-setup.sh
# review the contents and make sure this won't break existing node programs
nano ./debian-11-quick-setup.sh
chmod +x /debian-11-quick-setup.sh
./debian-11-quick-setup.sh
```

### Windows Installation

Quick install for Windows is available. Download windows-installer.bat and run it as administrator.

## FAQ

What's the bot icon?  
The bot icon is an abstract interpretation of a user replying to another user with a video or image.

## Ari's Instance

The information in this section only applies to [ari's instance](https://adryd.co/twitter-embeds). This section is made to be easy to understand as nobody likes reading legaleese.

### Features

- TikTok embeds are disabled in the official instace because I get rate-limited from TikTok for requesting too frequently. If you'd like TikTok embeds, you should self-host your own instance

### Terms of Service

- Do not intentionally break or crash the instance
- If you find a critical bug with the bot you are to report it using the contact info below
- Usage of the bot must obey the laws in the United States (where Discord and Twitter are owned), Canada (where the bot is hosted) and the country of the end user.

### Data Privacy

The following types of user data are stored

- Message metadata is stored to allow the original owner of a message to delete the replies or re-composed message
  - **Message ID**: The message ID of the reply or re-composed message
  - **Original message ID**: The message ID of original message
  - **User ID**: The ID of the user who owns the reply or re-composed message
  - **Channel ID**: The channel ID of the channel the messages are in
  - **Guild ID**: The server ID of the server the messages are in, so server owners can request deletion of all data from their server
- Webhooks are stored to allow creation of re-composed messages
  - **Channel ID**: The ID of the channel the webhook is active in
  - **Wehbook ID**: The ID of the webhook
  - **Webhook Token**: The credential which allows sending from the webhook
  - **Guild ID**: The server ID the webhooks are in, so server owners can request deletion of all data from their server
- Mode preference is saved so the bot can remember what type of embeds a server prefers
  - **Mode**: The mode the server prefers embeds be sent in
  - **Flags**: Additional server options
  - **Guild ID**: The ID of the server
- Servers the bot joins, and leaves are logged to a private server with the following information (member count, guild id, name)

Obviously post information is fetched from their respected providers (Twitter, TikTok, Reddit), and information is sent through Discord.  
You're free to request deletion of data associated with your user or a server you own using the contact info below.

### Contact Info

If for any reason you need to contact me, I'm available through the following channels

- Discord: [adryd#6880](https://discord.com/users/298475055141355520); State why you added me after sending a friend request
- Email: [me@adryd.com](mailto:me@adryd.com); Please include Twitter Embeds in the subject line
- Github: You can create an issue on this repository if you've found a bug not already mentioned in TODO.txt

## Alternatives

If you're unable to add the bot to your server, or you're looking for something different, the following may be of use to you

- [TwitFix/fxtwitter](https://github.com/robinuniverse/TwitFix): Fixes Twitter embeds in Discord for mobile users
- [proxy.knotty.dev](https://proxy.knotty.dev/): A proxy for Reddit videos
