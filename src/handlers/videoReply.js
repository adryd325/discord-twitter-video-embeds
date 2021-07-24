import { registerMessage } from "../structures/MessageMappings.js";

/** @param {Promise[]} tweetPromises */
/** @param {import("discord.js").Message} message */
export default async function videoReply(tweetPromises, message) {
	const tweets = await Promise.all(tweetPromises);
	// Make an array of urls, with spoiler marks if needed, then join them
	const content = tweets
		.map((tweet) => {
			if (!tweet.tweet.bestVideo) return;
			const videoUrl = tweet.tweet.bestVideo.url;
			return tweet.spoiler ? "|| " + videoUrl + " ||" : videoUrl;
		})
		.join(" ");
	// Make sure we're not sending an empty message
	if (content.length === 0) return;
	const response = await message.reply({ content });
	registerMessage(response, message);
}
