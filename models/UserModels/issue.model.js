const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
    issue:{
        type:String,
        required:true
    }
    
}, {timestamps: true})

module.exports = mongoose.model("Issue", issueSchema);
