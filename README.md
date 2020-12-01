# Vikings Of Vader

It is recommended to install a plugin for you editor that automatically runs prettier. See their [website](https://prettier.io/) for alternatives.

## Backend

Start in development by `npm install && npm run dev`.

## Github actions

Eslint and Prettier runs on every push to Github.

Check code format by `npm run format-check`.
Fix code format by `npm run format`.

Run lint checks by `npm run lint`

## Deployment

First, build an optimized version of the application with `npm run build-production`.
Start it using some default ICE servers with `npm run serve-production`.
Make sure that TCP traffic on port 3000 and UDP traffic on all ports (0 - 65535) are forwarded to this server.
