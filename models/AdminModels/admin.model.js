const {Schema, model} = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const adminSchema = new Schema({
  
    fullName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      },
      password: {
        type: String,
        required: true,
        minlength: [8, 'Password must be at least 8 characters long'],
      },
      phoneNumber: {
        type: String,
        required: true,
        minlength: [10, 'Contact number must be 10 digits'],
      },
      profileImage: {
        type: String,
        default:
          'https://static.vecteezy.com/system/resources/previews/020/911/740/non_2x/user-profile-icon-profile-avatar-user-icon-male-icon-face-icon-profile-icon-free-png.png',
      },
      otp: {
        type: String,
      },
      otpExpires: {
        type: Date,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      resetToken: {
        type: String,
      },
      resetTokenExpiry: {
        type: Date,
      },
      isDeleted: {
        type: Boolean,
        default: false,
      },

},{timestamps:true})

adminSchema.methods.generateToken = async function(){
    const token = jwt.sign({id:this._id}, process.env.JWT_SECRET,{expiresIn:'1d'})
    return token
}

adminSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

adminSchema.statics.hashPassword = async function(password){
    return await bcrypt.hash(password, 10)
}

module.exports = model("Admin", adminSchema)
