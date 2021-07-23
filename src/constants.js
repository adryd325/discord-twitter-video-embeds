export const USER_AGENT =
  "Mozilla/5.0 (compatible; discord-twitter-video-embeds/2.0; +https://github.com/adryd325/discord-twitter-video-embeds; +https://adryd.co/twitter-embeds)";
export const TWITTER_URL_REGEXP =
  /https?:\/\/(?:(?:mobile|www)\.)?twitter\.com\/[a-zA-Z0-9_]{1,32}\/status\/([0-9]{2,20})(?:\?s=\d{1,2})?/g;
export const TWITTER_BEARER_TOKEN =
  "Bearer AAAAAAAAAAAAAAAAAAAAAPYXBAAAAAAACLXUNDekMxqa8h%2F40K4moUkGsoc%3DTYfbDKbT3jJPCEVnMYqilB28NHfOPqkca3qaAxGfsyKCs0wRbw";
// Strings until move to database
export const EmbedModes = {
  OFF: "0",
  VIDEO_REPLY: "1",
  REEMBED: "2",
  RECOMPOSE: "3"
}