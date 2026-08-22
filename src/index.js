import 'dotenv/config';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPlayer } from './music/player.js';
import {
  handleButtonInteraction,
  handleSelectMenuInteraction,
} from './interactions/controls.js';
import { errorEmbed } from './utils/embeds.js';
import { updateBotPresence } from './utils/presence.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const requiredEnv = ['DISCORD_TOKEN', 'CLIENT_ID'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.commands = new Collection();

const commandFiles = readdirSync(join(__dirname, 'commands')).filter((file) =>
  file.endsWith('.js'),
);

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

let player;

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}`);
  updateBotPresence(client, player);
});

client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        return interaction.reply({
          embeds: [errorEmbed('Unknown command', 'That command is not registered.')],
          ephemeral: true,
        });
      }

      await player.context.provide({ guild: interaction.guild }, () =>
        command.execute(interaction),
      );
      return;
    }

    if (interaction.isButton()) {
      await player.context.provide({ guild: interaction.guild }, () =>
        handleButtonInteraction(interaction, player),
      );
      return;
    }

    if (interaction.isStringSelectMenu()) {
      await player.context.provide({ guild: interaction.guild }, () =>
        handleSelectMenuInteraction(interaction, player),
      );
    }
  } catch (error) {
    console.error(`[interaction:${interaction.type}]`, error);

    const payload = {
      embeds: [
        errorEmbed(
          'Something went wrong',
          'That action failed. Try again or use a slash command.',
        ),
      ],
      ephemeral: true,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

async function main() {
  player = await createPlayer(client);
  await client.login(process.env.DISCORD_TOKEN);
}

main().catch((error) => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});
