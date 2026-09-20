import {
  Client,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
  Routes,
  REST,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";

const TOKEN = "YOUR_BOT_TOKEN";
const GUILD_ID = "YOUR_GUILD_ID";
const APPLICATION_ID = "YOUR_APPLICATION_ID";
const FORUM_CHANNEL_ID = "YOUR_FORUM_CHANNEL_ID";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

// Slash command: /postrules
const commands = [
  new SlashCommandBuilder()
    .setName("postrules")
    .setDescription("Post the application rules with an Apply button")
].map(cmd => cmd.toJSON());

// Register slash commands
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(APPLICATION_ID, GUILD_ID),
    { body: commands }
  );
  console.log("Commands registered");
})();

// Your exact questions
const QUESTIONS = [
  "software? do not abbreviate",
  "socials",
  "send work",
  "ops?"
];

// Handle slash command
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "postrules") {
    const embed = new EmbedBuilder()
      .setTitle("📋 Application Rules")
      .setDescription(
        "prioritized creativity\n" +
        "at least 7 seconds\n" +
        "logos, gfx, artists welcome\n\n" +
        "Click **Apply** below to begin your application."
      )
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start_application")
        .setLabel("Apply")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
});

// Handle button click → start DM interview
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "start_application") return;

  await interaction.reply({
    content: "Check your DMs — your application is starting.",
    ephemeral: true
  });

  const user = interaction.user;

  try {
    const dm = await user.send("Hi! Let's begin your application.");

    const answers = [];

    for (let i = 0; i < QUESTIONS.length; i++) {
      await dm.send(`**${QUESTIONS[i]}**`);
      const collected = await dm.channel.awaitMessages({
        max: 1,
        time: 300000,
        errors: ["time"]
      });
      answers.push(collected.first().content);
    }

    // Post to forum channel
    const forum = await client.channels.fetch(FORUM_CHANNEL_ID);

    await forum.threads.create({
      name: `Application - ${user.username}`,
      message: {
        content:
          `**New Application Received**\n\n` +
          `**User:** <@${user.id}>\n\n` +
          `**software? do not abbreviate**\n${answers[0]}\n\n` +
          `**socials**\n${answers[1]}\n\n` +
          `**send work**\n${answers[2]}\n\n` +
          `**ops?**\n${answers[3]}`
      }
    });

    await dm.send("Your application has been submitted. Thank you!");

  } catch (err) {
    console.log(err);
    await interaction.followUp({
      content: "I couldn't DM you. Please enable DMs and try again.",
      ephemeral: true
    });
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
