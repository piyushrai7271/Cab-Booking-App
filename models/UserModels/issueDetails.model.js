const mongoose = require("mongoose");
 
const issueDetailsSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: "Issue", required:true },
  title:{
    type:String,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  
});
 
module.exports = mongoose.model("IssueDetails", issueDetailsSchema);