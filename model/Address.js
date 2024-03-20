const mongoose = require('mongoose')
const addressSchema =new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true 
    },
pickupLocation: {
   
    address: {
        type: String
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    }
},
dropoffLocation: {
    address: {
        type: String
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    }
}
});

module.exports = mongoose.model('Address',addressSchema);