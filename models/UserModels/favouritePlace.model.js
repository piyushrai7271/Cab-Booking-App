const { mongoose, Schema } = require("mongoose");

const favoritePlaceSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true
  },
  location:{
    type:String,
    required:true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("FavoritePlace", favoritePlaceSchema);
