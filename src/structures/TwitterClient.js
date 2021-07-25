import fetch from "node-fetch";
import Tweet from "./Tweet.js";
import TwitterError from "./TwitterError.js";
import TwitterErrorList from "./TwitterErrorList.js";

import { TWITTER_BEARER_TOKEN } from "../constants.js";

const GUEST_TOKEN_ENDPOINT = "https://api.twitter.com/1.1/guest/activate.json";
const TWEET_ENDPOINT = (tweetID) =>
	`https://api.twitter.com/2/timeline/conversation/${tweetID}.json?tweet_mode=extended&include_user_entities=1`;

export default class TwitterClient {
	/** @param {string} userAgent */
	constructor(userAgent) {
		this.userAgent = userAgent;
	}

	fetchGuestToken() {
		return fetch(GUEST_TOKEN_ENDPOINT, {
			method: "post",
			headers: {
				"user-agent": this.userAgent,
				authorization: TWITTER_BEARER_TOKEN,
			},
		}).then((res) => res.json());
	}

	async getGuestToken() {
		if (!this.guestToken) {
			const data = await this.fetchGuestToken();
			this.guestToken = data["guest_token"];
		}
		return this.guestToken;
	}

	/** @param {string} id the tweet id */
	async getTweet(id) {
		return fetch(TWEET_ENDPOINT(id), {
			headers: {
				"user-agent": this.userAgent,
				authorization: TWITTER_BEARER_TOKEN,
				"x-guest-token": await this.getGuestToken(),
			},
		})
			.then((res) => res.json())
			.then((res) => {
				if (res.errors) {
					throw new TwitterErrorList(res.errors.map((err) => new TwitterError(err)));
				}
				return res;
			})
			.then((conversation) => {
				const tweets = conversation.globalObjects.tweets;
				if (!tweets[id]) {
					throw new Error(`Didn't recieve tweet data; ID:${id}`);
				}
				const tweet = new Tweet(
					tweets[
						// Follow retweets
						tweets[id].retweeted_status_id_str ?? id
					]
				);
				tweet.addUserData(conversation.globalObjects.users[tweet.userID]);
				return tweet;
			});
	}
}
