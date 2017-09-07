const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
  title: {type: String, required: true, unique: true},
  body: String,
  notes: String,
  language: String,
  tags: [String],
  author: String,
  stars: Number,
  dateCreated: Date
})

const Snippet = mongoose.model('Snippet', snippetSchema);

module.exports = Snippet;
