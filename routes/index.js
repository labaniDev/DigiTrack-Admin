const express = require('express')
const AppRouter = express.Router();

const verifyUserToken = require("../middleware/auth.js");


// const addressController = require("../controllers/addressController.js");
//AppRouter.post('/register',userController.register);
//AppRouter.post('/login',userController.login);
//AppRouter.get('/getUserById/:id' ,verifyUserToken,userController.getUserById);
//AppRouter.put('/updateUserById',userController.updateUserById);
//AppRouter.delete('/deleteUserById/:id',userController.deleteUserById);
//AppRouter.post('/addUserPickupLocation', addressController.addUserPickupLocation);

module.exports =AppRouter;