# 🚖 Cab Booking Backend (Rapido Clone)

This is the **backend service** for a cab/ride booking application inspired by **Rapido**. It implements 80% of the core functionalities including user authentication, ride booking, driver management, live status updates, and more.

> ⚙️ Built with Node.js, Express.js, MongoDB, and Socket.IO.

---

## 📦 Features

- ✅ User Registration & Login (JWT-based authentication)
- ✅ Book a Ride (Real-time ride creation and status tracking)
- ✅ Driver Assignment & Availability
- ✅ Trip History & Details
- ✅ OTP Verification (via Twilio or similar)
- ✅ Live Updates using Socket.IO
- ✅ Role-based Access (User, Driver, Admin)

---

## 🛠 Tech Stack

| Technology     | Use                                |
|----------------|-------------------------------------|
| **Node.js**    | Runtime environment                 |
| **Express.js** | Backend framework                   |
| **MongoDB**    | NoSQL database                      |
| **Socket.IO**  | Real-time ride tracking             |
| **JWT**        | Authentication & Authorization      |
| **Mongoose**   | ODM for MongoDB                     |
| **Twilio**     | OTP Verification (if integrated)    |

---

## 📁 Project Structure

Cab-Booking-BE/
├── controllers/
├── models/
├── routes/
├── middleware/
├── utils/
├── config/
├── index.js
├── app.js
└── README.md



---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/piyushrai7271/Cab-Booking-App.git
cd Cab-Booking-App


PORT=5000
MONGODB_URI=your_mongo_uri
JWT_SECRET=your_secret
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_phone


📌 Notes
     This project only contains backend logic. The frontend will consume these APIs.

     Real-time communication (like ride status updates) is handled via Socket.IO.


🙋‍♂️ Author
Piyush Rai
GitHub    



---

Let me know if you want to:
- Add sample API responses
- Include Swagger/Postman collection
- Split into user vs driver vs admin routes

I can help you level this up if needed!
