import { MessageAttachment } from "discord.js";
import { USER_AGENT } from "../constants.js";
import fetch from "node-fetch";

/** @param {String} url */
/** @param {String} name */
export default async function getAttachment(url, name) {
	return new MessageAttachment(
		(
			await fetch(url, {
				headers: {
					"user-agent": USER_AGENT,
				},
			})
		).body,
		name
	);
}
