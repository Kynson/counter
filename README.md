# Counter
![Code style: Prettier](https://img.shields.io/badge/code_style-Prettier-blue?style=for-the-badge)
![License: MIT](https://img.shields.io/github/license/Kynson/game-of-life?style=for-the-badge)

A counter API for counting visitors, clicks or anything you want.

## Usage
> [!IMPORTANT]
> It is recommanded to deploy your own instance of counter by cloing this project. The Worker deployed on https://counter.kynsonszetau.com is not intended for public use and counters created maybe deleted without prior notice.

Simply send a `GET` request to any path. The counter will be incremented, and the latest value after the increment will be returned in JSON. Each path is a separate counter, which makes counting different things a piece of cake.

If a counter is no longer needed, send a `DELETE` request to the corresponding path to delete it. Note that deleting a counter requires authentication with bearer token.

## Deploying your Own Counter
> [!IMPORTANT]
> Cloudflare Wokers Paid plan is required to use Durable Objects.

1. `git clone` this project
2. Update [wrangler.toml](/wrangler.toml) to match your needs (e.g. routes). Remember to uncomment the `[[migrations]]` section before the first deployment.
3. Generate a random base64-encoded token
5. Hash the token with `SHA-512` and encode the hash with base64
6. Upload the hash with `wrangler secret put DELETE_TOKEN_HASH`
7. Deploy the worker with `npm run deploy`

## How it works
This API is powered by [Cloudflare Workers](https://developers.cloudflare.com/workers/) and [Durable Objects](https://developers.cloudflare.com/durable-objects/). A globally unique counter object will be created when a `GET` request hits a path for the first time and initialize the counter. Any subsequence `GET` request will increment the counter for that path. Durbale Objects ensures there is only one running instance for each counter, each increment can be considered atomic.

