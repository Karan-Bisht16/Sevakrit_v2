const mongoose = require("mongoose");

const connection = async ()=>{
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB")
    } catch (error) {
        console.log("Connection to MongoDB failed. ", error);
    }
}

const donation_Schema = new mongoose.Schema({
    donar_name: {
        type: String,
        required: true
    },
    date_of_donation: {
        type: Date,
        required: true
    }, 
    type_of_donation: {
        type: String,
        required: true
    },
    type_of_event: {
        type: String
    },
    user_pickup_address: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    donation_status: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
})

const user_Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    user_mobile_number: {
        type: Number,
        required: true
    }, 
    user_password: {
        type: String,
        required: true
    },
    user_date_of_joining: {
        type: String,
        required: true
    },
    user_donations: Array
});

const NGO_Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    NGO_registration_number: {
        type: String,
        required: true
    }, 
    NGO_address: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    NGO_sectors: {
        type: String
    },
    NGO_webpage: {
        type: String
    },
    NGO_password: {
        type: String,
        requireed: true
    },
    NGO_date_of_joining: {
        type: String,
        required: true
    }
});

const NGO = mongoose.model('NGO', NGO_Schema);
const User = mongoose.model('User', user_Schema);
const Donation = mongoose.model('Donation', donation_Schema);


module.exports = { connection, NGO, User, Donation };