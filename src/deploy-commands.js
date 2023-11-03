const {
	REST,
	SlashCommandBuilder,
	Routes
} = require('discord.js');

const {
	token,
	guildId,
	clientId
} = require('./config.json');

const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
	new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),

	//-----------------music--commands------------------------------------
	new SlashCommandBuilder().setName('bromita').setDescription('bromita chistosa jaja xd'),
	new SlashCommandBuilder().setName('leave').setDescription('leaves'),
	new SlashCommandBuilder().setName('current').setDescription('shows current song'),
	new SlashCommandBuilder().setName('skip').setDescription('skip'),
	new SlashCommandBuilder().setName('pause').setDescription('pause'),
	new SlashCommandBuilder().setName('resume').setDescription('resume'),
	new SlashCommandBuilder().setName('do')
		.setDescription('does')
		.addStringOption(op => op.setName('url').setDescription('url'))
	//--------------------------------------------------------------------

]
	.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationCommands(clientId), { body: commands })
	.then((data) => console.log(`Successfully registered ${data.length} application commands.`))
	.catch(console.error);
