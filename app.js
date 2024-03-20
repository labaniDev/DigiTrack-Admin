const express = require('express')
const app = express()
const mongoose = require('mongoose')
const AppRouter = require("./routes/index")
const User = require('./config.js')
const admin = require('firebase-admin');
const firebase = require('firebase')
const serviceAccount = require("./config/serviceAccountKey.json");
const bcrypt =require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
// const { google } = require('googleapis');
// const googlemaps=require('@google/maps');

// Initialize the Google Maps API client
// const googleMapsClient  = new google.maps.createClient({
//     key: 'AIzaSyAUPJXa0nQpKYknRBJ9FRfKbskTL_j9cxk'
// });
require('dotenv').config();
const config = {
    TOKEN_SECRET: process.env.TOKEN_SECRET
};

//const axios =require('axios')

app.use(express.json());
app.use(express.urlencoded({extended:false}))

//app.use("/api",AppRouter)
const firebaseConfig = {
    apiKey: "AIzaSyCTy0zzmW7WZ3_42pDeXTHutRYWvxFksPA",
    authDomain: "digitrack-18026.firebaseapp.com",
    databaseURL: "https://digitrack-18026-default-rtdb.firebaseio.com",
    projectId: "digitrack-18026",
    storageBucket: "digitrack-18026.appspot.com",
    messagingSenderId: "801807256596",
    appId: "1:801807256596:web:08f77bf56483d69ebeeb01",
    measurementId: "G-TPFT5T256N"
  };

firebase.initializeApp(firebaseConfig)

const db = firebase.firestore()
const UsersCollection = db.collection("Users")




admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
  //databaseURL: "https://default.firebaseio.com"
});

app.post('/register', async (request, response) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(request.body.password, salt);

        // Create a new user object
        const newUser = {
            name: request.body.name,
            email: request.body.email,
            password: hashedPassword,
        };
       

        // Save the user to the Firestore database
        await db.collection('users').add(newUser);
        console.log(newUser);
        console.log(response)
        response.status(201).send('User Registered Successfully');
    } catch (error) {
        console.log(error);
        response.status(500).send('Error registering user');
    }
});
app.post('/login' , async (request,response) =>{
    try {
        const snapshot = await db.collection('users').where('email', '==', request.body.email).get();
        if (snapshot.empty) {
            return response.status(401).send('Invalid Email');
        }

        let user;
        snapshot.forEach(doc => {
            user = doc.data();
        });

        const validPass = await bcrypt.compare(request.body.password, user.password);
        if (!validPass) {
            return response.status(401).send("Password is wrong");
        }

        // Create and assign token
        let payLoad = { id: user._id };
        const token = jwt.sign(payLoad, config.TOKEN_SECRET,);
        response.status(200).header("auth-token", token).send({ "token": token });
    } catch (error) {
        console.log(error);
        response.status(500).send('Error in Logging user');
    }
}
);

app.get('/getUsers', async (request, response) => {
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();

        if (snapshot.empty) {
            console.log('No matching documents.');
            return response.status(404).send('No users found');
        }

        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });

        console.log(users);
        response.status(200).json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        response.status(500).send('Error getting users');
    }
});

app.get('/getUser/:id', async (request, response) => {
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.doc(request.params.id).get();
        if (!snapshot.exists) {
            console.log('No matching documents.');
            return response.status(404).send('No users found');
        }
        const user = { id: snapshot.id,...snapshot.data() };
        console.log("user :", user);
        response.status(200).json(user);
        
    } catch (error) {
        console.error('Error getting users:', error);
        response.status(500).send('Error getting users');
    }
}
);



// app.post('/RideDetails', async (request, response) => {
//     try {
//         const { id, pickup, dropoff, date, remark } = request.body;
//         console.log(request.body);

//         // Fetch address details for pickup location
// const pickupResponse = await googleMapsClient.mapsClient.geocode({
//     address: pickup.address
// }, (err, response) => {
//     if (!err) {
//         const result = response.json.results[0];
//         console.log(result.formatted_address);
//         console.log(result.geometry.location);
//     } else {
//         console.log('Error geocoding address:', err);
//     }
// });

// const pickupResult = pickupResponse.json.results[0]; // Get the first result
// if (!pickupResult) {
//     throw new Error('No geocoding results found for pickup address');
// }

//         const pickupAddress = pickupResponse.formatted_address;
//         const pickupLocation = pickupResponse.geometry.location;

//         // Fetch address details for dropoff location
//         const [dropoffResponse] = await googleMapsClient.geocode({
//             address: dropoff.address
//         }).asPromise();

//         const dropoffAddress = dropoffResponse.formatted_address;
//         const dropoffLocation = dropoffResponse.geometry.location;

//         // Create a new ride details document
//         const rideData = {
//             id,
//             pickUp: {
//                 address: pickupAddress,
//                 latitude: pickupLocation.lat,
//                 longitude: pickupLocation.lng
//             },
//             dropOff: {
//                 address: dropoffAddress,
//                 latitude: dropoffLocation.lat,
//                 longitude: dropoffLocation.lng
//             },
//             date: new Date(date),
//             remark
//         };

//         // Add the ride details document to Firestore
//         const rideDetailsCollection = admin.firestore().collection('rideDetails');
//         await rideDetailsCollection.add(rideData);

//         response.status(201).send('Ride details added successfully');
//     } catch (error) {
//         console.error("Error adding ride details: ", error);
//         response.status(500).send('Error adding ride details');
//     }
// });

app.post('/RideDetails', async (request, response) => {
    try {
         const { userId, pickup, dropoff,  remark } = request.body;
         console.log(request.body);

         // Ensure that remark is always defined
        //const remarkValue = remark || '';

       

        // Create a new ride details document
        const rideData = {
            userId,
            pickUp: {
                address: pickup.address,
                latitude: pickup.latitude,
                longitude: pickup.longitude
            },
            dropOff: {
                address: dropoff.address,
                latitude: dropoff.latitude,
                longitude: dropoff.longitude
            },
            createat: Date.now(),
            remark
           
        };

        // Add the ride details document to Firestore
        const rideDetailsCollection = admin.firestore().collection('rideDetails');
        await rideDetailsCollection.add(rideData);

        response.status(201).send('Ride details added successfully');
    } catch (error) {
        console.error("Error adding ride details: ", error);
        response.status(500).send('Error adding ride details');
    }
});


app.post('/addDriver',async (req,res)=>{
    try{
        const newDriver={
            fullname : req.body.fullname,
            email : req.body.email,
            phno : req.body.phno
        }
        await db.collection('drivers').add(newDriver);
        console.log(newDriver);
        res.status(200).send('Driver Added Successfully');
    }catch (error) {
        console.log(error);
        response.status(500).send('Error in Adding Driver');
    }
});
app.get('/getAllDriver',async(req,res)=>{
    try{  
        const driversRef = db.collection('drivers');
        const snapshot = await driversRef.get();
        if(snapshot.empty){
            console.log('No Mathing found');
            return res.status(404).send('No Drivers Found');
        }
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        res.status(200).json(users);
    }catch(error){
        console.log(error);
        res.status(500).send('Error in getting AllDrivers');
    }
});


// app.post('/addRideDetails', async (request, response) => {
//     try {
//         const { userid, pickup, dropOff, date, remark } = request.body;

//         // Fetch address details for pickup location
//         const pickupResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pickup)}&key=AIzaSyAUPJXa0nQpKYknRBJ9FRfKbskTL_j9cxk`);
//         const dropoffResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pickup)}&key=AIzaSyAUPJXa0nQpKYknRBJ9FRfKbskTL_j9cxk`);

//         const pickupLocation = pickupResponse.data.results[0];
//         const pickupAddress = pickupLocation.formatted_address;
//         const pickupLatitude = pickupLocation.geometry.location.lat;
//         const pickupLongitude = pickupLocation.geometry.location.lng;

//         const dropoffLocation = dropoffResponse.data.results[0];
//         const dropoffAddress = dropoffLocation.formatted_address;
//         const dropoffLatitude = dropoffLocation.geometry.location.lat;
//         const dropoffLongitude = dropoffLocation.geometry.location.lng;

//         // Create a new ride details document
//         const rideData = {
//             userid,
//             pickup: {
//                 address: pickupAddress,
//                 latitude: pickupLatitude,
//                 longitude: pickupLongitude
//             },
//             dropoff: {
//                 address: dropoffAddress,
//                 latitude: dropoffLatitude,
//                 longitude: dropoffLongitude
//             },
//             date: Date.now(),
//             remark
//         };

//         // Add the ride details document to Firestore
//         const rideDetailsCollection = admin.firestore().collection('rideDetails');
//         await rideDetailsCollection.add(rideData);

//         response.status(201).send('Ride details added successfully');
//     } catch (error) {
//         console.error("Error adding ride details: ", error);
//         response.status(500).send('Error adding ride details');
//     }
// });




const PORT=8082;

app.listen(PORT,()=>{
    console.log('Server is running on port',PORT)
})

// const MONGO_DB_URI='mongodb://localhost:27017/roadpartner'
// mongoose.connect(MONGO_DB_URI).then(()=>{
//     console.log("db connected successfully");
//     app.listen(PORT,()=>{
//         console.log('Server is running on port',PORT)
//     })
// }).catch((error)=>{
//         console.log(error);

//     });

// Check Firestore connection
db.collection('_dummy').doc('_dummy').get()
    .then(() => {
        console.log('Firestore connection established');
    })
    .catch((error) => {
        console.error('Error connecting to Firestore:', error);
    });