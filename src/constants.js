import path from "path";
import url from "url";

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

function keyMirror(arr) {
	const tmp = Object.create(null);
	for (const value of arr) tmp[value] = value;
	return tmp;
}

function createEnum(keys) {
	const obj = {};
	for (const [index, key] of keys.entries()) {
		if (key === null) continue;
		obj[key] = index;
		obj[index] = key;
	}
	return obj;
}

export const DATABASE_PATH = path.join(dirname, "..", "data", "database.db");

export const USER_AGENT =
	"Mozilla/5.0 (compatible; discord-twitter-video-embeds/2.0; +https://github.com/adryd325/discord-twitter-video-embeds; +https://adryd.co/twitter-embeds)";
export const TWITTER_URL_REGEXP =
	/https?:\/\/(?:(?:mobile|www)\.)?twitter\.com\/[a-zA-Z0-9_]{1,32}\/status\/([0-9]{2,20})(?:\?s=\d{1,2})?/g;
export const TWITTER_BEARER_TOKEN =
	"Bearer AAAAAAAAAAAAAAAAAAAAAPYXBAAAAAAACLXUNDekMxqa8h%2F40K4moUkGsoc%3DTYfbDKbT3jJPCEVnMYqilB28NHfOPqkca3qaAxGfsyKCs0wRbw";

export const EmbedModes = createEnum(["OFF", "VIDEO_REPLY", "REEMBED", "RECOMPOSE"]);
export const SAFE_EMBED_MODE = EmbedModes.VIDEO_REPLY;
export const DEFAULT_EMBED_MODE = EmbedModes.REEMBED;

export const QRT_UNROLL_BOTS = ["152172984373608449", "276487450669613056"];
export const DELETE_MESSAGE_EMOJIS = ["\u2716", "\u274E", "\u274C"];
export const DISCORD_MAX_FILE_SIZE = 22n;
