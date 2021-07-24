import getAttachment from "../util/getAttachment.js";
import { registerMessage } from "../structures/MessageMappings.js";

/** @param {Promise[]} tweetPromises */
/** @param {import("discord.js").Message} message */
export default async function reEmbed(tweetPromises, message) {
	const tweets = await Promise.all(tweetPromises);
	let content = "";
	const embeds = [];
	const downloads = [];
	tweets.map((tweet) => {
		if (!tweet || !tweet.tweet.bestVideo) return;
		content += tweet.spoiler ? "|| " + tweet.tweet.url + " ||" : "";
		embeds.push(tweet.tweet.discordEmbed);
		downloads.push(
			getAttachment(tweet.tweet.bestVideo.url, (tweet.spoiler ? "SPOILER_" : "") + tweet.match.id + ".mp4")
		);
	});
	const files = await Promise.all(downloads);
	if (content === "") content = undefined;
	const response = await message.reply({ content, embeds, files });
	message.suppressEmbeds();
	registerMessage(response, message);
}
