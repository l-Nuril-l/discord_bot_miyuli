import { AttachmentBuilder, Client, Events, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import express from 'express';
import { chatWithAI } from './services/aiChat.js';

dotenv.config();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildModeration] });
const { DISCORD_TOKEN: token, PREFIX: prefix } = process.env;

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
  console.log(message)
  if (message.content.includes('https://discord.gg')) {
    message.delete();
    message.reply("Это бан...");
  }

  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'бот') {
    const attachment = new AttachmentBuilder('answer.wav');
    message.channel.send({ files: [attachment] });
  }
  else if (command === 'help') {
    const answer = '¯\_(ツ)_/¯';
    message.channel.send(answer);
  }
  else if (command === 'discord') {
    const answer = 'https://discord.com/developers/active-developer';
    message.channel.send(answer);
  }
  else if (command === 'ask') {
    if (!(message.content.slice(5).length > 1)) return
    try {
      const userMessage = message.content.slice(5);
      message.channel.sendTyping();
      const userInfo = {
        username: message.author.username,
        nickname: message.member?.nickname || message.author.username,
        id: message.author.id
      };
      const responseChunks = await chatWithAI(message.author.id, userMessage, userInfo);
      
      // Send each chunk as a separate message
      for (const chunk of responseChunks) {
        await message.channel.send(chunk);
      }
    } catch (error) {
      console.error('Error in ask command:', error);
      message.reply('Извините, произошла ошибка при обработке вашего запроса.');
    }
  }
  else if (message.author.id === '1309626428395884674') {
    const attachment = new AttachmentBuilder('target-detected.mp3');
    message.channel.send({ files: [attachment] });
  }
  else if (message.author.id === '288671468349292545') {
    if (!message.guild) return;
    const user = message.mentions.users.first();
    const member = message.guild.member(user);
    let str = '';
    str = member.toString();
    console.log(str);
    message.channel.send({ content: str });
  }
});

client.login(token);

const app = express();
app.get('/', (req, res) => {
  res.redirect('discord://')
});
app.listen(process.env.PORT || 3000, () => {
  console.log('server started');
});

export default app;
