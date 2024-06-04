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
const cors = require('cors');
const verifyToken=require("./middleware/auth.js")
// import { createReadStream } from "fs";
// import multer from "multer";
// const upload = multer({ dest: "images/" });
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
const corsOptions ={
    origin:'*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}
app.use(cors(corsOptions));

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

// app.post('/register', async (request, response) => {
//     try {
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(request.body.password, salt);

//         // Create a new user object
//         const newUser = {
//             name: request.body.name,
//             email: request.body.email,
//             password: hashedPassword,
//         };
//         if (!request.body.name || !request.body.email || !request.body.password) {
//             return response.status(400).send('Missing required fields');
//         }

//         // Save the user to the Firestore database
//         await db.collection('users').add(newUser);
//         console.log(newUser);
//         //console.log(response)
//         response.status(201).send('User Registered Successfully');
//     } catch (error) {
//         console.log(error);
//         response.status(500).send('Error registering user');
//     }
// });

app.post('/register', async (request, response) => {
    try {
        const { email, password, name } = request.body;
        if (!email || !password || !name) {
            return response.status(400).send('Missing required fields');
        }
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(password, salt);
        // Create a new user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
        });
        // Save the additional user details to Firestore with the UID as the ID
        await db.collection('users').doc(userRecord.uid).set({
            name: name,
            email: email,
            id: userRecord.uid
        });
        console.log('User added in Firebase Authentication and Firestore:', userRecord.uid);
        response.status(201).send('User Registered Successfully');
    } catch (error) {
        console.log(error);
        response.status(500).send('Error registering user');
    }
});

// app.post('/login' , async (request,response) =>{
//     try {
//         const snapshot = await db.collection('users').where('email', '==', request.body.email).get();
//         if (snapshot.empty) {
//             return response.status(401).send('Invalid Email');
//         }

//         let user;
//         snapshot.forEach(doc => {
//             user = doc.data();
//         });

//         const validPass = await bcrypt.compare(request.body.password, user.password);
//         if (!validPass) {
//             return response.status(401).send("Password is wrong");
//         }

//         // Create and assign token
//         let payLoad = { id: user._id };
//         const token = jwt.sign(payLoad, config.TOKEN_SECRET,);
//         response.status(200).header("auth-token", token).send({ "token": token });
//     } catch (error) {
//         console.log(error);
//         response.status(500).send('Error in Logging user');
//     }
// }
// );

app.post('/login', async (request, response) => {
    try {
        const { email, password } = request.body;
        if (!email || !password) {
            return response.status(400).send('Missing required fields');
        }
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // User successfully authenticated
                const user = userCredential.user;
                console.log('User logged in:', user.uid);
                response.status(200).send(user.uid );
            })
            .catch((error) => {
                // Handle authentication errors
                console.error('Error logging in user:', error);
                response.status(500).send('Error logging in user'+error.msg);
            });
    } catch (error) {
        console.error(error);
        response.status(500).send('Error logging in user');
    }
});

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

// index.js


// // app.use('/images', express.static('images'))
// app.get("/images/:imageName", (req, res) => {
//     // do a bunch of if statements to make sure the user is
//     // authorized to view this image, then

//     const imageName = req.params.imageName;
//     const readStream = createReadStream(`images/${imageName}`);
//     readStream.pipe(res);
// });

// app.post("/api/images", upload.single("image"), (req, res) => {
//     const imageName = req.file.filename;
//     const description = req.body.description;

//     // Save this data to a database probably

//     console.log(description, imageName);
//     return res.send({ description, imageName });
// });

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


app.get('/getDriversByUserid/:userid', async (req, res) => {
    try {
        const userid = req.params.userid;
        if (!userid) {
            return res.status(404).send("Please provide a valid user ID");
        }
        const driversSnapshot = await db.collection('drivers').where('userid', '==', userid).get();
        if (driversSnapshot.empty) {
            return res.status(404).send("No drivers found for this user");
        }
        const drivers = [];
        driversSnapshot.forEach(doc => {
            drivers.push(doc.data());
        });
        res.status(200).json(drivers);
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).send('Error in fetching drivers');
    }
});

app.put('/updateDriver', async(request,response) => {
    try{
        const{id,fullname,email,phno} = request.body;
        // if (!request.body.id ) {
        //     return response.status(404).send("Please enter your ID");
        // }
        const driverRef = admin.firestore().collection('drivers').doc(id);
        const driverDoc = await driverRef.get();
        if(!driverDoc.exists){
            return response.status(404).send("Driver not found");
        }
       // Update the driver's information
       const updateData = {
        fullname: fullname,
        email: email,
        phno: phno // This will update phno if provided, or leave it unchanged if phno is not provided
    };
    // Update the password if provided
    // if (password) {
    //     // Update the password in Firebase Authentication
    //     await admin.auth().updateUser(id, {
    //         password: password
    //     });
    // }
    // Update the phone number in Firebase Authentication
    // await admin.auth().updateUser(id, {
    //     phoneNumber: phno
    // });
    await driverRef.update(updateData);
        response.status(200).send("Driver updated Successfully");
    }catch (error) {
        console.error('Error updating driver to Firestore:', error);
        response.status(500).send('Error updating driver to Firestore');
    }
})

app.delete('/delete/:id', async (request, response) => {
    try {
        const id = request.params.id;
        if (!id) {
            return response.status(404).send("Please enter the driver's ID");
        }
        const driverRef = admin.firestore().collection('drivers').doc(id);
        const driverDoc = await driverRef.get();
        if (!driverDoc.exists) {
            return response.status(404).send("Driver not found");
        }
        // Delete the user from Firebase Authentication
        await admin.auth().deleteUser(id);
        // Delete the driver document from Firestore
        await driverRef.delete();
        response.status(200).send("Driver deleted successfully");
    } catch (error) {
        console.error('Error deleting driver:', error);
        response.status(500).send('Error deleting driver');
    }
});

app.post('/addFeedback', async(req,res)=>{
    try{
        console.log(req.body.id)
        if (!req.body.id || !req.body.name || !req.body.email) {
            return res.status(404).send("Please enter your ID, name, and email");
        }
        const newFeedBack={
            id:req.body.id,
            name:req.body.name,
            email:req.body.email,
            message:req.body.message
        }
        
        await db.collection('feedback').add(newFeedBack);
        console.log(newFeedBack);
        res.status(200).send("Thanks for Your FeedBack");
    }catch (error) {
        console.log(error);
        res.status(500).send('Error in Giving FeedBack');
    }
})

app.get('/getAllFeedback/:userid',async(req,res)=>{
    try{
        const userid = req.params.userid;
        // Fetch user document based on the provided userid
        const userSnapshot = await db.collection('users').doc(userid).get();
        if (!userSnapshot.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        const feedbacksSnapshot = await db.collection('feedback').where('userid', '==', userid).get();
        if (feedbacksSnapshot.empty) {
            return res.status(404).send("No drivers found for this user");
        }
        const feedbacks = [];
        feedbacksSnapshot.forEach(doc => {
            feedbacks.push({ id: doc.id, ...doc.data() });
        });
        res.status(200).json(feedbacks);
    }catch(error){
        console.log(error);
        res.status(500).send('Error in getting AllFeedback');
    }
});

// app.post('/addDriver', verifyToken, async (req,res)=>{
//     try{
//         const newDriver={
//             fullname : req.body.fullname,
//             email : req.body.email,
//             phno : req.body.mobile
//         }
//         await db.collection('drivers').add(newDriver);
//         console.log(newDriver);
//         res.status(200).send('Driver Added Successfully');
//     }catch (error) {
//         console.log(error);
//         response.status(500).send('Error in Adding Driver');
//     }
// });

app.post('/addDriverInTheFireStore', async (request, response) => {
    try {
        const { userid,fullname, email, phno } = request.body;
        const userSnapshot = await db.collection('users').doc(userid).get();
        if(!userSnapshot.exists){
            return  response.status(400).status('User not found');
        }
        // Create a new user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
            phoneNumber: phno
        });
        // Get the UID of the newly created user
        const uid = userRecord.uid;
        // Add the driver details to the 'drivers' collection in Firestore
        const driverData = {
            userid:userid,
            fullname: fullname,
            email: email,
            phno: phno,
            id: uid,
            // Add any other driver details here
        };
        await admin.firestore().collection('drivers').doc(uid).set(driverData);
        console.log('Driver added to Firestore:', driverData);
        response.status(201).send('Driver added to Firestore');
    } catch (error) {
        console.error('Error adding driver to Firestore:', error);
        response.status(500).send('Error adding driver to Firestore');
    }
});


app.post('/addRideDetails' , async (request, response) => {
    try {
        const { userid, driverid, pickUp, dropOff, driverdetails, remark } = request.body;
        // Fetch user document based on the provided userid
        const userSnapshot = await db.collection('users').doc(userid).get();
        const driverSnapshot = await db.collection('drivers').doc(driverid).get();
        if (driverSnapshot.exists) {
            // User document found, continue with adding ride details
            // Fetch address details for pickup location
            const pickupResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pickUp)}&key=AIzaSyAUPJXa0nQpKYknRBJ9FRfKbskTL_j9cxk`);
            const dropoffResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(dropOff)}&key=AIzaSyAUPJXa0nQpKYknRBJ9FRfKbskTL_j9cxk`);
            const pickupLocation = pickupResponse.data.results[0];
            const dropoffLocation = dropoffResponse.data.results[0];
            if (!pickupLocation || !dropoffLocation) {
                throw new Error('Could not fetch address details');
            }
            const pickupAddress = pickupLocation.formatted_address;
            const pickupLatitude = pickupLocation.geometry.location.lat;
            const pickupLongitude = pickupLocation.geometry.location.lng;
            const dropoffAddress = dropoffLocation.formatted_address;
            const dropoffLatitude = dropoffLocation.geometry.location.lat;
            const dropoffLongitude = dropoffLocation.geometry.location.lng;
            // Create a new ride details document
            const rideData = {
                userid: userid,
                driverid: driverid,
                pickup: {
                    address: pickupAddress,
                    latitude: pickupLatitude,
                    longitude: pickupLongitude
                },
                dropoff: {
                    address: dropoffAddress,
                    latitude: dropoffLatitude,
                    longitude: dropoffLongitude
                },
                driverdetails: {
                    fullname: driverdetails.fullname,
                    phno: driverdetails.phno
                },
                creatat: Date.now(),
                remark,
                status:"active"
            };
            // Add the ride details document to Firestore
            const rideDetailsCollection = admin.firestore().collection('rideDetails');
            await rideDetailsCollection.add(rideData);
            console.log('Ride details added successfully:', rideData);
            response.status(201).send('Ride details added successfully');
        } else {
            if (!userSnapshot.exists) {
                throw new Error('User not found');
            } else {
                throw new Error('Driver not found');
            }
        }
    } catch (error) {
        console.error('Error adding ride details:', error);
        response.status(500).send('Error adding ride details');
    }
});

app.get('/getRideDetails', async (request, response) => {
    try {
        const driversRef = db.collection('rideDetails');
        const snapshot = await driversRef.get();
        if (snapshot.empty) {
            console.log('No matching documents.');
            return response.status(404).send('No users found');
        }
        const drivers = [];
        snapshot.forEach(doc => {
            drivers.push({ id: doc.id, ...doc.data() });
        });
        console.log(drivers);
        response.status(200).json(drivers);
    } catch (error) {
        console.error('Error getting users:', error);
        response.status(500).send('Error getting users');
    }
});


app.get('/getRideDetails/:userid', async (request, response) => {
    try {
        const userid = request.params.userid;
        // Fetch user document based on the provided userid
        const userSnapshot = await db.collection('users').doc(userid).get();
        if (!userSnapshot.exists) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Fetch ride details related to the provided userid
        const rideDetailsRef = db.collection('rideDetails').where('userid', '==', userid);
        const snapshot = await rideDetailsRef.get();
        if (snapshot.empty) {
            console.log('No matching documents.');
            return response.status(404).send('No ride details found for the user');
        }
        const rideDetails = [];
        snapshot.forEach(doc => {
            rideDetails.push({ id: doc.id, ...doc.data() });
        });
        console.log(rideDetails);
        response.status(200).json(rideDetails);
    } catch (error) {
        console.error('Error getting ride details:', error);
        response.status(500).send('Error getting ride details');
    }
});


const PORT=8082;

app.listen(PORT,()=>{
    console.log('Server is running on port',PORT)
})


// Check Firestore connection
db.collection('_dummy').doc('_dummy').get()
    .then(() => {
        console.log('Firestore connection established');
    })
    .catch((error) => {
        console.error('Error connecting to Firestore:', error);
    });