const {mongoose, Schema} = require("mongoose")

const savePlacesSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
    title:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true
    },
    
})

module.exports = mongoose.model("SavePlaces", savePlacesSchema);

