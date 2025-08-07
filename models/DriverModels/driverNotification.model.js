const { Schema, model } = require("mongoose");
const driverNotificationSchema = new Schema(
    {
        fullName:{
            type: String,
            required: false,
        },
        driverId: {
            type: Schema.Types.ObjectId,
            ref: "DriverAuth",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        image: {
            type: String,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const driverNotificationModel = model("DriverNotification", driverNotificationSchema);
module.exports = driverNotificationModel;
 