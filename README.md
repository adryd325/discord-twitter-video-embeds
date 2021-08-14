# Twitter Video Embeds

I'm a Discord bot that fixes your broken Twitter videos. You can add me here: https://adryd.co/twitter-embeds.

https://user-images.githubusercontent.com/48024900/126883933-396745dd-806b-4cde-abee-1a5f8b7d5585.mp4

## Description

Titwter Embeds fixes video embeds from Twitter on Discord with a goal of convinience, seamlessness, and feature-completeness. It parses and obeys Discord's own markdown rules, and allows users to delete their own messages

### Special Thanks

- **[Brecert](https://github.com/Brecert)**: Twitter Client Implementation
- **[Youtube DL](https://github.com/ytdl-org/youtube-dl)**: Reference for Instagram, Reddit, Tiktok and Twitter Clients.
- **[general-programming](https://generalprogramming.org/)**: Allowing me to use proxy.knotty.dev as a fallback for oversized reddit videos.
- **BLOCKLETTER Discord**: Initially pushing me to make this

## Usage

You can use the bot by [adding it to your Discord server](https://adryd.co/twitter-embeds), or sending it a direct message. It has 3 different modes that can be changed by a server administrator (Manage Server permission).

- The video reply mode will reply with a direct link to the twitter video.

  <img src="https://cdn.discordapp.com/attachments/857368936672526356/868639403667488788/unknown.png" width="960">

- Re-embed will remove the embeds on the original message and reply with a new set of embeds, along with video attachments.

  <img src="https://cdn.discordapp.com/attachments/857368936672526356/868639702528446504/unknown.png" width="522">
  
 - Re-compose uses a webhook to recompose the original message with a new set of embeds.  
  
  <img src="https://cdn.discordapp.com/attachments/857368936672526356/868641645304901672/unknown.png" width="631">

### Additional Features

- The bot obeys spoilers
- Users can delete their own re-composed messages or bot replies to their messages bt reacting with an "X" emoji.
- The bot integrates with [HiddenPhox](https://discordapp.com/oauth2/authorize?client_id=173441062243663872&scope=bot) and replies to HiddenPhox's quote-retweet unrolling

### Quirks

- If re-embed or re-compose fail, the bot falls back to video reply mode.
- re-embed and re-compose attach a file sepperately since [Discord doesn't allow bots to add videos to embeds](https://github.com/discord/discord-api-docs/discussions/3456).
- By following Discord's markdown rules exactly, it also has some of the same quirks; such as spoilers needing to be spaced out.

## Official Instance

The information in this section only applies to [the official instance](https://adryd.co/twitter-embeds). This section is made to be easy to understand as nobody likes reading legaleese.

### Terms of Service

- Do not intentionally break or crash the official instance
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
  - **Guild ID**: The ID of the server
- Servers the bot joins are logged to a private server with the following information (member count, guild id, name)

Obviously Tweet information is fetched from Twitter, and information is sent through Discord.  
You're free to request deletion of data associated with your user or a server you own using the contact info below.

### Contact Info

If for any reason you need to contact me, I'm available through the following channels

- Discord: [adryd#6880](https://discord.com/users/298475055141355520); State why you added me after sending a friend request
- Email: [me@adryd.com](mailto:me@adryd.com); Please include Twitter Embeds in the subject line
- Github: You can create an issue on this repository if you've found a bug not already mentioned in TODO.txt

## Hosting Your Own Instance

You're free to host your own instance as long as you link back to this repo, or wherever it moves to.
