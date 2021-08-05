import { MessageAttachment } from "discord.js";
import fetch from "node-fetch";
import { USER_AGENT } from "../constants.js";

/** @param {String} url */
/** @param {string} name */
export default async function getAttachment(url, name) {
	return new MessageAttachment(
		(
			await fetch(url, {
				headers: {
					"user-agent": USER_AGENT
				}
			})
		).body,
		name
	);
}
