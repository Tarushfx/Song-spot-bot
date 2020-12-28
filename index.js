import axios from "axios";
import btoa from "btoa";
import Discord from "discord.js";
import dotenv from "dotenv";
dotenv.config();
const client = new Discord.Client();
const clientID = process.env.CLIENTID;
const clientSecret = process.env.CLIENTSECRET;
const discordKey = process.env.DISCORDKEY;
const basic = btoa(`${clientID}:${clientSecret}`);
client.login(discordKey);
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
async function authSpotify() {
  let auth = await axios("https://accounts.spotify.com/api/token", {
    params: {
      grant_type: "client_credentials",
    },
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
    },
  });
  // console.log(auth);
  return auth;
}
async function getFromSpotify(auth, type, query) {
  switch (type) {
    case "ar":
      type = "artist";
      break;
    case "tr":
      type = "track";
      break;
    case "al":
      type = "album";
      break;
    case "pl":
      type = "playlist";
      break;
    default:
      break;
  }
  let search = await axios(`https://api.spotify.com/v1/search`, {
    method: "GET",
    headers: {
      Authorization: `${auth.data.token_type} ${auth.data.access_token}`,
    },
    params: {
      q: query,
      type: type,
    },
  });
  // console.log(search);
  search = search.data[type + "s"].items[0];
  return search;
}
client.on("message", async (msg) => {
  if (msg.content.startsWith("!ss")) {
    let cmd = msg.content.split(" ");
    let type = cmd[1];
    try {
      const auth = await authSpotify();
      let song = null;

      if (type === "help") {
        const helpText = new Discord.MessageEmbed()
          .setColor("0099ff")
          .setThumbnail(
            `https://icons-for-free.com/iconfiles/png/512/social+spotify+square+icon-1320185493878020594.png`
          )
          .setTitle(`Commands`)
          .addFields(
            { name: "Trigger", value: "!ss", inline: false },
            { name: "Flags", value: "ar\ntr\npl\nal", inline: true },
            {
              name: "Values",
              value: "Artist\nTrack\nPlaylist\nAlbum",
              inline: true,
            }
          )
          .setDescription(`{Trigger} {flag} {Query}`)
          .setTimestamp();
        msg.channel.send(helpText);
      } else if (["tr", "ar", "al", "pl"].includes(type)) {
        let query = cmd.slice(2).join("+");
        if (!query) msg.channel.send("Invalid Query");
        else song = await getFromSpotify(auth, type, query);
      } else msg.channel.send("Invalid flag");

      if (song && song.external_urls && song.external_urls.spotify) {
        if (type !== "ar") {
          let embed = new Discord.MessageEmbed()
            .setColor("#0099ff")
            .setThumbnail(song.images[0].url)
            .setTitle(song.name)
            .setURL(song.external_urls.spotify)
            .addField("Link:", song.external_urls.spotify, true);
          msg.channel.send(embed);
        } else {
          let embed = new Discord.MessageEmbed()
            .setColor("#0099ff")
            .setThumbnail(song.images[0].url)
            .setTitle(song.name)
            .setURL(song.external_urls.spotify)
            .addField("Popularity", song.popularity, false)
            .addField("Genres", song.genres, false)
            .setTimestamp();
          msg.channel.send(embed);
        }
      }
    } catch (ex) {
      console.log(ex.message);
    }
  }
});
