const { Client, 
		GatewayIntentBits,
		EmbedBuilder,
		ButtonBuilder,
		ActionRowBuilder, } = require('discord.js');

const { joinVoiceChannel,
		createAudioPlayer,
		createAudioResource,
		getVoiceConnection,
		VoiceConnectionStatus,
		entersState,
		AudioPlayerStatus, } = require('@discordjs/voice');

const { token } = require('./config.json');

const { spawn } = require('child_process');

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
var currentChannel;

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


client.on('interactionCreate', async inter => {
	if(!inter.isCommand){return}
	
	songData = {
		name: "",
		id: "",
		thumbnail: "",
	};
	
	if(inter.commandName == 'bromita'){
		await inter.reply('ok <:ben2:1000838308575846460>');
		var row = new ActionRowBuilder();
		row.addComponents(
			new ButtonBuilder()
				.setStyle(5)
				.setURL('https://t.ly/yE6U')
				.setLabel('hehe')
		);
		inter.channel.send({
			components: [row]
		})
	}
	
	if(inter.commandName == 'leave'){
		connect.destroy();
		await inter.reply('leaving...');
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
	
	if(inter.commandName == 'do' && inter.member.voice.channel){
		
		const connect = joinVoiceChannel({
			channelId: inter.member.voice.channelId,
			guildId: inter.guildId,
			adapterCreator: inter.guild.voiceAdapterCreator,
		});
		
		await inter.reply('ya voy tarado !!1!');
		
		currentChannel = inter.channel;
		
		if(connect){
			connect.subscribe(audioPlay);
		}
		else{
			console.log("connection could not be succesfully created");
		}
		
		var Metadata = spawn('yt-dlp', ['-j', inter.options.getString('url')]);
		
		Metadata.on('error', error => {
			console.error(error);
		});
		
		Metadata.stdout.on('data', (data) => {
			meta = JSON.parse(data.toString());
			
			songData.name = meta.title;
			songData.id = meta.id;
			songData.thumbnail = meta.thumbnail;
		});
		
		var Download = spawn('yt-dlp', ['-x', '-o', '"%(id)s.opus"', inter.options.getString('url')]);
		
		Download.on('error', (error) => {
			console.log('error on download::168');
			return;
		});
		
		Download.on('close', (code) => {
			
			try{
				res = createAudioResource(createReadStream('#' + songData.id + '.opus'));
			}catch(error){
				console.error(error);
			}
			//console.log(res);
			
			var topush = songData;
			
			queue.push(topush);
			console.log(topush);
			
			//console.log(queue);
			
			if(audioPlay.state.status == 'idle' && res){
				
				audioPlay.play(res);
				
				audioPlay.on('error', (error) => {
					console.error(error);
					console.log('error on audio play')
				});
				
				if(queue[queueposition]){
					sendEmbed(inter.channel, queue[queueposition].name, queue[queueposition].thumbnail)
				}
			}
		});
	}
	
	
	
	
	if(inter.commandName == 'skip' && audioPlay){
		audioPlay.stop();
		
		if(queue[queueposition]){
			try{
				audioPlay.play(createAudioResource(createReadStream('#' + queue[queueposition].id + '.opus')));
			}catch(error){
				console.error(error);
			}
			
			await inter.reply('skipping...');
			
			if(queue[queueposition]){
				sendEmbed(inter.channel, queue[queueposition].name, queue[queueposition].thumbnail)
			}
		}
		else{
			inter.channel.send('no songs left on the queue, stopping the player...');
			audioPlay.stop();
			queue = [];
			queueposition = 0;
		}
	}
	
	if(inter.commandName == 'resume'){
		console.log(queue);
	}
	
});

audioPlay.on(AudioPlayerStatus.Idle, () => {
	console.log('AudioPlayerStatus: Idle');
	
	var auxiliarAudioResource;
	
	try{
		auxiliarAudioResource = createReadStream('#' + queue[queueposition].id + '.opus');
	}catch(error){
		console.error(error);
	}
	
	if(auxiliarAudioResource){
		auxiliarAudioResource.on('error', (error) => {
			console.log('there was an error loading the audioResource');
			
			queue.splice(queueposition, 1);
			
			queueposition -= 1;
			
			return;
		});	
	}
	
	if(queue[queueposition] && queue[queueposition - 1] && auxiliarAudioResource){
		audioPlay.play(createAudioResource(auxiliarAudioResource));
		
		if(queue[queueposition-1].id != queue[queueposition].id){
			console.log(queue[queueposition-1].id);
			
			fs.unlink('#' + queue[queueposition-1].id + '.opus', (data) => {
				console.log(`deleted, i hope...`)
			});
		}
		
		sendEmbed(currentChannel, queue[queueposition].name, queue[queueposition].thumbnail);
	}
	
	else{
		console.log('no more songs to play!');
		//console.log(queue);
		//console.log(queueposition + '\n');
		//console.log(queue[queueposition-1].id);
		if(queue[queueposition-1]){
			fs.unlink('#' + queue[queueposition-1].id + '.opus', (data) => {
				console.log(`deleted, i hope...`)
			});	
		}
	}
});

audioPlay.on(AudioPlayerStatus.Playing, () => {
	console.log(`a song started playing, next: ${queueposition}, current: ${queueposition-1}`);
	queueposition++;
});


function sendEmbed(channelTo, desc, ThumbUrl){
	channelTo.send({
		embeds: [{
			color: 0x0099ff,
			title: 'Current song',
			description: desc,
			thumbnail:{
				url: ThumbUrl
			},
		}],
	})
}




