const { Client, 
		GatewayIntentBits,
		EmbedBuilder, } = require('discord.js');

const { joinVoiceChannel,
		createAudioPlayer,
		createAudioResource,
		getVoiceConnection,
		VoiceConnectionStatus,
		entersState,
		AudioPlayerStatus, } = require('@discordjs/voice');

const { token } = require('./config.json');

const { exec } = require('child_process');

const { createReadStream } = require('fs');

const fs = require('fs');


// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
	]
});



//-------global---variables----------------
var queue = [];
var queueposition = 0;
var audioPlay = createAudioPlayer();
var meta;

var songData = {
	name: "",
	id: "",
	thumbnail: "",
};

var res;

var connection;

var embedContent = new EmbedBuilder();
//-----------------------------------------





// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

// Login to Discord with your client's token
client.login(token);



client.on('messageCreate', async msg => {
	if(msg.author.id == '824392633614598164'){return}
	
	//hehe balls
	if(msg.content == "balls"){
		for(i = 0; i < 10; i++){
			await msg.reply("<:ben2:1000838308575846460>");
		}
	}
});


client.on('interactionCreate', async inter => {
	if(!inter.isCommand){return}
	
	songData = {
		name: "",
		id: "",
		thumbnail: "",
	};
	
	const connect = joinVoiceChannel({
		channelId: inter.channelId,
		guildId: inter.guildId,
		adapterCreator: inter.guild.voiceAdapterCreator,
	});
	
	if(inter.commandName == 'join'){
		await connect;
		
		await inter.reply('joining...')
	}
	
	if(inter.commandName == 'leave'){
		await connect.destroy();
		await inter.reply('leaving...')
	}
	
	if(inter.commandName == 'current' && queue.length != 0){
		
		embedContent = {
			color: 0x0099ff,
			title: 'Current song',
			description: queue[queueposition-1].name,
			thumbnail:{
				url: queue[queueposition-1].thumbnail,
			},
		}
		
		inter.channel.send({
			embeds: [embedContent],
		})
	}
	
	if(inter.commandName == 'do'){
		
		connection = connect;
		
		connection.subscribe(audioPlay);
		
		exec(('yt-dlp -j ' + inter.options.getString('url')), (error, stdout, stderr) => {
			if(!error){
				meta = JSON.parse(stdout);
				songData.name = meta.title;
				songData.id = meta.id;
				songData.thumbnail = meta.thumbnail;
			}
			else{
				console.log(error);
			}
		});
		
		exec(('yt-dlp -x -o "%(id)s.%(ext)s" ' + inter.options.getString('url')), (error, stdout, stderr) => {
			if(!error){		
				res = createAudioResource(createReadStream(songData.id + '.opus'));
				//console.log(res);
				
				var topush =songData;
				
				queue.push(topush);
				console.log(topush);
				
				//console.log(queue);
				
				if(audioPlay.state.status == 'idle'){
					audioPlay.play(res);
					
					embedContent = {
						color: 0x0099ff,
						title: 'Current song',
						description: queue[queueposition].name,
						thumbnail:{
							url: queue[queueposition].thumbnail,
						},
					}
					
					inter.channel.send({
						embeds: [embedContent],
					})
				}
			}
			
			else{
				console.log(error + '\n');
			}
		});
		
		await inter.reply('ya voy tarado !!1!');
	}
	
	if(inter.commandName == 'skip'){
		audioPlay.stop();
		if(queue[queueposition]){
			audioPlay.play(createAudioResource(createReadStream(queue[queueposition].id + '.opus')));
			inter.reply('skipping...');
			
			embedContent = {
				color: 0x0099ff,
				title: 'Current song',
				description: queue[queueposition].name,
				thumbnail:{
					url: queue[queueposition].thumbnail,
				},
			}
			
			inter.channel.send({
				embeds: [embedContent],
			})
		}
	}
	
	if(inter.commandName == 'resume'){
		console.log(queue);
	}
	
});

audioPlay.on(AudioPlayerStatus.Idle, () => {
	console.log('no song playing! 1!');
	
	if(queue[queueposition]){
		audioPlay.play(createAudioResource(createReadStream(queue[queueposition].id + '.opus')));
		
		embedContent = {
			color: 0x0099ff,
			title: 'Current song',
			description: queue[queueposition].name,
			thumbnail:{
				url: queue[queueposition].thumbnail,
			},
		}
		
		connection.channel.send({
			embeds: [embedContent],
		})
	}
	
	else{
		console.log('no more songs to play!');
		//console.log(queue);
		//console.log(queueposition + '\n');
	}
});

audioPlay.on(AudioPlayerStatus.Playing, () => {
	console.log('already playing something lol');
	queueposition++;
	//console.log(queue);
	//console.log(queueposition + '\n');
});


const countMyMessages = async (channel) => {
	await console.log(channel)
}





