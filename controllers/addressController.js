const { response } = require('express');
const addressModel = require('../model/Address.js');
const userModel = require('../model/User.js');
const axios = require('axios');

const addressController ={
    addUserPickupLocation: async (request, response) => {
        // try {
        //     const { userId, address, latitude, longitude } = request.body;
        //     console.log(userId);
    
        //     // Fetch address from Google Maps using either address or latitude and longitude
        //     let mapResponse;
        //     if (address) {
        //         mapResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyAUPJXa0nQpKYknRBJ9FRfKbskTL_j9cxk`);
        //     } else {
        //         mapResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyAUPJXa0nQpKYknRBJ9FRfKbskTL_j9cxk`);
        //     }
            
        //     const formattedAddress = mapResponse.data.results[0].formatted_address;
    
        //     // Create a new pickup location
        //     const pickup = new addressModel({
        //         pickupLocation: {
        //             user: userId, // Set the user field with the userId
        //             address: formattedAddress,
        //             latitude,
        //             longitude
        //         }
        //     });
    
        //     // Save the pickup location to the database
        //     await pickup.save();
        //     console.log(await pickup.save());
    
        //     response.status(201).json({ message: 'Pickup location added successfully' });
        // } catch (error) {
        //     console.error('Error adding pickup location:', error);
        //     response.status(500).json({ message: 'Error adding pickup location' });
        // }
    try {
        const { id, pickupLocation, dropoffLocation } = request.body;
        console.log(request.body);

        // Fetch user by ID
        const user = await userModel.findById(id);
        console.log(id);
        if (!user) {
            return response.status(404).send('User not found');
        }

        // Create a new address document with pickup and drop-off locations
        const address = new addressModel({
            user: user.id,
            pickupLocation: {
                address: pickupLocation.address,
                latitude: pickupLocation.latitude,
                longitude: pickupLocation.longitude
            },
            dropoffLocation: {
                address: dropoffLocation.address,
                latitude: dropoffLocation.latitude,
                longitude: dropoffLocation.longitude
            }
        });

        // Save the address document to the database
        await address.save();

        response.status(201).json({ message: 'Pickup and drop-off locations added successfully' });
    } catch (error) {
        console.error('Error adding pickup and drop-off locations:', error);
        response.status(500).json({ message: 'Error adding pickup and drop-off locations' });
    }
      }
};    

module.exports = addressController;
