const mongoose = require("mongoose");

const walletWithdrawalSchema = new mongoose.Schema({
    
},{timestamps:true})

module.exports = mongoose.model("WalletWithdrawal", walletWithdrawalSchema);
