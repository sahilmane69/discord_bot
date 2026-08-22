import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const scope = process.argv[2] ?? process.env.COMMAND_SCOPE ?? 'global';

if (!token || !clientId) {
  console.error('DISCORD_TOKEN and CLIENT_ID are required.');
  process.exit(1);
}

const commands = [];
const commandFiles = readdirSync(join(__dirname, 'commands')).filter((file) =>
  file.endsWith('.js'),
);

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(token);

try {
  if (scope === 'guild') {
    if (!guildId) {
      console.error('GUILD_ID is required for guild command registration.');
      process.exit(1);
    }

    console.log(`Registering ${commands.length} guild commands for ${guildId}...`);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });
    console.log('Guild commands registered successfully.');
  } else {
    console.log(`Registering ${commands.length} global commands...`);
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('Global commands registered successfully.');
    console.log('Note: global commands can take up to 1 hour to appear everywhere.');
  }
} catch (error) {
  console.error('Failed to register commands:', error);
  process.exit(1);
}
