import { discord } from "../index.js";

/** @param {Array[]} permissions */
/** @param {import("discord.js").GuildChannel} channel */
export function checkPermissions(permissions, channel) {
	const missingPermissions = [];
	for (const permission of permissions) {
		if (!channel.permissionsFor(discord.user.id).has(permission)) {
			missingPermissions.push(permission);
		}
	}
	if (missingPermissions.length > 0) {
		return true;
	}
	return false;
}
