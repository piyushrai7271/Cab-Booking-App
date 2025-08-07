const mongoose = require('mongoose');

// sub-issue schema for GetHelp
const subIssueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
}, { _id: false });

// main schema for GetHelp
const getHelpSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true
  },
  subIssues: {
    type: [subIssueSchema],
    default: []
  }
}, { timestamps: true });

const GetHelp = mongoose.model("GetHelp", getHelpSchema);
module.exports = GetHelp;


