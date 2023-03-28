import { ChatGPTAPI } from 'chatgpt';
import { AttachmentBuilder, Client, Events, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildModeration] });
const { DISCORD_TOKEN: token, PREFIX: prefix } = process.env;

const gpt = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY
})

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ask') {
        const res = await gpt.sendMessage(command.slice(4))
        await interaction.reply({ content: res.text, ephemeral: false });
    }
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
    else if (command === 'ask') {
        const res = await gpt.sendMessage(command.slice(4))
        message.channel.send({ content: res.text });
    }
    else if (message.author.id === '602608266278731777') {
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
        message.channel.send(str);
    }
});


client.login(token);