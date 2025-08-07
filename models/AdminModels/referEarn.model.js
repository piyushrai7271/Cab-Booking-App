const mongoose = require('mongoose');
 
const referEarnSchema = new mongoose.Schema({
  couponCode: { type: String,unique:true, required: true },
  discountPercent: {
    type: String,
    required:function(){
      return !this.discountRate;
    }
  },
  discountRate: {
    type: Number,
    min: 0,
    required: function () {
      return !this.discountPercent;
    }
  },
  policy: { type: String, required: true },
  image: { type: String, default: '' },
});
 
module.exports = mongoose.model('ReferEarn', referEarnSchema);
 
 