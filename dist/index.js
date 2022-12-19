"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const Questions_1 = require("./assets/Questions");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMessages,
    ],
});
const inCheck = new Map();
client.on("ready", () => {
    console.log("[#] Client is ready!");
});
client.on("messageCreate", async (message) => {
    if (!message.inGuild() || message.guild.id !== process.env.GUILD_ID)
        return;
    if (message.author.bot)
        return;
    //? Проверка на префикс
    if (!message.content.startsWith("!"))
        return;
    const args = message.content.slice("!".length).trim().split(" ");
    const cmd = args.shift().toLowerCase();
    if (cmd === "start") {
        if (inCheck.has(message.author.id))
            return;
        inCheck.set(message.author.id, {
            answers: [],
        });
        const embed = new discord_js_1.EmbedBuilder();
        embed.setColor("DarkPurple");
        embed.setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL({ forceStatic: true }),
        });
        embed.setDescription([
            "💬 | **Перед проверкой убедитесь, что сидите в Голосовом Канале и включите демонстрацию экрана.**",
            "",
            "**Существует два основых типа вопросов:**",
            "- **Вопрос с текстовым вариантом ответа**",
            "- **Вопрос с выбором одного варианта из трёх возможных**",
            "",
            "**На какие-то вопросы даётся больше времени, на какие-то меньше, но оно всегда указано внизу сообщения.**",
            "**Время на подготовку - 10 секунд.**",
        ].join("\n"));
        embed.setTimestamp();
        message.reply({
            embeds: [embed],
        });
        setTimeout(async () => {
            await handleQuestions(message);
        }, 2000);
        return;
    }
});
var waiting = false;
async function handleQuestions(message, id) {
    const data = inCheck.get(message.author.id);
    if (waiting === false && id !== undefined) {
        waiting = true;
        const question = Questions_1.Questions.find((x) => x.id === id);
        const embed = new discord_js_1.EmbedBuilder();
        embed.setColor("DarkPurple");
        embed.setTitle(question.type);
        embed.setDescription((0, discord_js_1.bold)(question.question));
        embed.setTimestamp();
        embed.setFooter({
            text: `Время на ответ - ${question.time_in_sec} секунд`,
        });
        const msg = await message.channel.send({
            content: message.author.toString(),
            embeds: [embed],
        });
        const collected = await msg.channel.awaitMessages({
            filter: (m) => m.author.id === message.author.id,
            time: question.time,
            max: 1,
        });
        if (collected.size) {
            data.answers.push({
                answer: collected.first().content,
                question: question,
            });
            waiting = false;
            inCheck.set(message.author.id, data);
            if (!Questions_1.Questions[question.id + 1]) {
                var content = [];
                const answers = inCheck.get(message.author.id);
                for (const answer of answers.answers) {
                    content.push(`› **Вопрос/Ситуация**: **${answer.question.question}**`);
                    if (!answer.question.answers) {
                        content.push(`› **Ответ: ${answer.answer}**`);
                    }
                    else if (Array.isArray(answer.question.answers)) {
                        const possible = answer.question.answers.join(", ");
                        content.push("", `› **Варианты ответов**: **${possible}**`, `› **Ответ**: **${answer.answer}**`);
                    }
                    else {
                        content.push("", `› **Варианты ответов**: **${answer.question.answers}**`, `› **Ответ**: **${answer.answer}**`);
                    }
                    content.push(`**― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ―**`);
                }
                const data = content.join("\n");
                const info_embed = new discord_js_1.EmbedBuilder();
                info_embed.setColor("DarkPurple");
                info_embed.setDescription(data);
                info_embed.setTimestamp();
                const channel = message.guild.channels.cache.get(process.env.CHANNEL_ID);
                await channel.send({
                    embeds: [info_embed],
                });
                inCheck.delete(message.author.id);
                return;
            }
            else {
                await handleQuestions(message, question.id + 1);
                return;
            }
        }
        else {
            data.answers.push({
                answer: "-",
                question: question,
            });
            const embed = new discord_js_1.EmbedBuilder();
            embed.setColor("DarkPurple");
            embed.setDescription(`💬 | ${(0, discord_js_1.bold)("Вопрос не засчитан так как не было ответа.")}`);
            embed.setTimestamp();
            message.channel.send({
                content: message.author.toString(),
                embeds: [embed],
            });
            waiting = false;
            inCheck.set(message.author.id, data);
            if (!Questions_1.Questions[question.id + 1]) {
                var content = [];
                const answers = inCheck.get(message.author.id);
                for (const answer of answers.answers) {
                    content.push(`› Вопрос/Ситуация: ${answer.question.question}`);
                    if (!answer.question.answers) {
                        content.push(`› Ответ: ${answer.answer}`);
                    }
                    else if (Array.isArray(answer.question.answers)) {
                        content.push("", `› Варианты ответов: ${answer.question.answers.join(", ")}`, `› Ответ: ${answer.answer}`);
                    }
                    else {
                        content.push("", `› Варианты ответов: ${answer.question.answers}`, `› Ответ: ${answer.answer}`);
                    }
                    content.push(`― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ― ―`);
                }
                const data = content.join("\n");
                const info_embed = new discord_js_1.EmbedBuilder();
                embed.setColor("DarkPurple");
                embed.setDescription(data);
                embed.setTimestamp();
                const channel = message.guild.channels.cache.get(process.env.CHANNEL_ID);
                await channel.send({
                    embeds: [info_embed],
                });
                inCheck.delete(message.author.id);
                return;
            }
            else {
                return await handleQuestions(message, question.id + 1);
            }
        }
    }
    const question = Questions_1.Questions[0];
    const embed = new discord_js_1.EmbedBuilder();
    embed.setColor("DarkPurple");
    embed.setTitle(question.type);
    embed.setDescription((0, discord_js_1.bold)(question.question));
    embed.setTimestamp();
    embed.setFooter({
        text: `Время на ответ - ${question.time_in_sec} секунд`,
    });
    if (question.answers && question.answers.length) {
        const row = new discord_js_1.ActionRowBuilder();
        for (const answer of question.answers) {
            row.addComponents(new discord_js_1.ButtonBuilder()
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setCustomId(makeID(10))
                .setLabel(answer));
        }
        const msg = await message.channel.send({
            content: message.author.toString(),
            embeds: [embed],
            components: [row],
        });
        waiting = true;
        const collector = await msg.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.Button,
            filter: (btn) => btn.user.id === message.author.id,
            max: 1,
            time: question.time,
        });
        collector.on("collect", async (btn) => {
            data.answers.push({
                answer: btn.component.label,
                question: question,
            });
            waiting = false;
            inCheck.set(message.author.id, data);
            btn.update({
                components: [],
            });
            await handleQuestions(message, 1);
            return;
        });
        collector.on("end", async (collected, reason) => {
            if (reason === "time") {
                data.answers.push({
                    answer: "-",
                    question: question,
                });
                const embed = new discord_js_1.EmbedBuilder();
                embed.setColor("DarkPurple");
                embed.setDescription(`💬 | ${(0, discord_js_1.bold)("Вопрос не засчитан так как не было ответа.")}`);
                embed.setTimestamp();
                message.channel.send({
                    content: message.author.toString(),
                    embeds: [embed],
                });
                waiting = false;
                inCheck.set(message.author.id, data);
                msg.edit({
                    components: [],
                });
                await handleQuestions(message, 1);
                return;
            }
        });
    }
    else {
        const msg = await message.channel.send({
            content: message.author.toString(),
            embeds: [embed],
        });
        waiting = true;
        const collected = await msg.channel.awaitMessages({
            filter: (m) => m.author.id === message.author.id,
            time: question.time,
            max: 1,
        });
        if (collected.size) {
            data.answers.push({
                answer: collected.first().content,
                question: question,
            });
            waiting = false;
            inCheck.set(message.author.id, data);
            return await handleQuestions(message, 1);
        }
        else {
            data.answers.push({
                answer: "-",
                question: question,
            });
            const embed = new discord_js_1.EmbedBuilder();
            embed.setColor("DarkPurple");
            embed.setDescription(`💬 | ${(0, discord_js_1.bold)("Вопрос не засчитан так как не было ответа.")}`);
            embed.setTimestamp();
            waiting = false;
            inCheck.set(message.author.id, data);
            return await handleQuestions(message, 1);
        }
    }
}
function makeID(length) {
    var result = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
client.login(process.env.TOKEN);
