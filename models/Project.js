const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectId: String,
  data: Array,        // media items
  messages: String,   // text messages
  music: String,      // background music
  password: String
});

module.exports = mongoose.model("Project", projectSchema);