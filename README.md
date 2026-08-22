# saiman Music Bot

A slash-command Discord music bot built with **discord.js v14**, **@discordjs/voice**, and **discord-player**. Each server gets its own independent queue, in-chat playback controls, and related-song search.

## Features

### Playback
- `/play` — YouTube, playlists, SoundCloud, direct audio URLs, or search text with a **pick-from-results** menu
- `/pause`, `/resume`, `/skip`, `/stop`, `/disconnect`, `/seek`
- `/nowplaying`, `/volume`, `/loop`, `/autoplay`

### Queue
- `/queue`, `/shuffle`, `/clearqueue`, `/remove`
- `/related` — find and queue similar songs

### Extras
- `/help`, `/lyrics`
- **In-chat controls** on the Now Playing message: Pause, Skip, Stop, Shuffle, Queue, Volume, Loop, Related
- **DJ role checks** for skip/stop/volume/shuffle (optional)
- **Bot status**: `Listening to /play` or `Playing music in X servers`

Spotify links are attempted without API credentials. If resolution fails, the bot asks for YouTube, SoundCloud, a direct URL, or search text.

## Invite the bot

Replace `YOUR_CLIENT_ID` with your application ID, then open:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=36742656&scope=bot%20applications.commands
```

**Scopes:** `bot`, `applications.commands`

**Permissions:** View Channels, Send Messages, Embed Links, Connect, Speak, Use Voice Activity, Read Message History

## Requirements

- Node.js 18+
- FFmpeg (bundled via `ffmpeg-static`)

## Setup

```bash
npm install
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `DISCORD_TOKEN` | Bot token from the Discord Developer Portal |
| `CLIENT_ID` | Application ID |
| `DJ_ROLE_ID` | Optional role allowed to skip/stop/volume/shuffle |
| `GUILD_ID` | Optional — only needed for `npm run register:guild` |
| `COMMAND_SCOPE` | `global` (default) or `guild` |

### Register commands

**Public bot (recommended):**

```bash
npm run register
```

Global commands can take a few minutes to appear in all servers.

**Instant testing in one server:**

```bash
npm run register:guild
```

Requires `GUILD_ID` in `.env`.

### Start the bot

```bash
npm start
```

## Host 24/7

Good options:

- [Railway](https://railway.app)
- [Render](https://render.com)
- [Fly.io](https://fly.io)
- A VPS
- Your own PC (only if you keep it running)

On the host, set environment variables in the dashboard — **never commit `.env`**.

## Project structure

```
src/
  index.js                 # Bot entry + component handlers
  deploy-commands.js       # Slash command registration
  commands/                # Slash commands
  interactions/controls.js # Button & select menu handlers
  music/
    player.js              # discord-player setup
    related.js             # Related track search
    controlsMessage.js     # Now Playing message with buttons
  utils/
    controls.js            # Button/select builders
    embeds.js
    permissions.js         # DJ role checks
    presence.js            # Bot status
    search.js
    voice.js
```

## Using the bot

1. Join a voice channel.
2. Run `/play shape of you` and pick a result from the menu.
3. Use the **Now Playing** buttons to control playback without typing commands.
4. Press **Related** to add similar songs.

When multiple bots in a server have `/play`, choose **saiman** — look for `Play music with saiman bot`.

## DJ controls

If `DJ_ROLE_ID` is set, these require that role, Manage Server, or being the song requester:

- `/skip`, `/stop`, `/volume`, `/shuffle`, `/seek`, `/disconnect`, `/clearqueue`, `/remove`
- In-chat Skip, Stop, Volume, Shuffle, Loop buttons

If `DJ_ROLE_ID` is empty, anyone in the bot's voice channel can use them.

## Scripts

| Script | Description |
| --- | --- |
| `npm run register` | Register **global** slash commands |
| `npm run register:guild` | Register commands to one test guild |
| `npm start` | Start the bot |

## Security

- `.env` is gitignored — keep tokens out of git
- Put secrets only in your host's environment settings
- Reset your bot token if it was ever exposed

## Troubleshooting

- **Commands not showing** — Re-run `npm run register`. Global commands can take up to an hour.
- **Wrong bot responding** — Select **saiman** from the `/play` command list.
- **YouTube errors** — Try search text instead of a URL, or use `/related`.
- **No audio** — Check Connect + Speak permissions.
