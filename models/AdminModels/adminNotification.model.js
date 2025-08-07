const { Schema, model } = require("mongoose");
 
const adminNotificationSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },

        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);
 
const adminNotificationModel = model("adminNotification", adminNotificationSchema);
module.exports = adminNotificationModel;