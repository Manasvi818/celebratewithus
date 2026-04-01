const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectId: String,
  data: Array,
  messages: String,
  music: String,
  password: String
});

module.exports = mongoose.model("Project", projectSchema);