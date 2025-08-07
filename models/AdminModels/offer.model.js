const mongoose = require('mongoose');
 
const OfferSchema = new mongoose.Schema({
  userType: {
    type: String,
    enum: ['All', 'User', 'Driver'],
    required: true,
    default: 'All'
  },
  discountPercent: {
    type: String,
    required: function () {
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
  couponCode: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },
  offerText: {
    type: String,
    required: true,
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});
 
module.exports = mongoose.model('Offer', OfferSchema);