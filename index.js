/* 
TO DO:
    1.  sign in/ sign up for users and NGOs
    2.  Donation form update
    3.  User Profile shows donation history
    4.  view Registered NGOs
    5.  email notification to nearby NGOs* [or to all]
    6.  User can view nearby NGOs
    7.  NGOs can view nearby Donations
    8.  Interactive map
    9.  Edit Profile
    10. Delete & Update outdated donations
            const cron = require('node-cron');

            // Schedule the task to run every day at midnight (00:00)
            cron.schedule('0 0 * * *', async () => {
                const currentDate = new Date();
            
                // Find records where the 'date_of_donation' is less than the current date
                const expiredRecords = await YourModel.find({ date_of_donation: { $lt: currentDate } });
            
                // Flag the expired records by updating the 'flag' field
                const updateResult = await YourModel.updateMany(
                    { date_of_donation: { $lt: currentDate } },
                    { $set: { flagged: true } }
                );
            
                console.log(`${updateResult.modifiedCount} records flagged.`);
            }, {
                scheduled: true,
                timezone: 'Your_Timezone', // Replace with your timezone, e.g., 'UTC' or 'America/New_York'
            });
    11. NGO shouldn't be able to donate
*/

const axios = require("axios");
const express = require('express');
const session = require('express-session');
const path = require("path");
require('dotenv').config();
const bcrypt = require('bcryptjs');
const saltRounds = 10;

const app = express();
const PORT = 1600;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(express.static(__dirname+'/public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));

const mongoose = require('mongoose');
const { connection, NGO, User, Donation } = require('./database');
connection();

const MongoStore = require('connect-mongo');
const mongoStore = MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    mongooseConnection: mongoose.connection,
});

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    store: mongoStore,
}));

app.get('/', (req, res)=>{
    req.session.location = req.session.location || '';
    console.log("[GET]  `/`      Current User Location: "+req.session.location);
    if (req.session.userID && req.session.type==='user') {
        User.findOne({email: req.session.userID})
        .then (result=>{
            res.render("home.ejs", {user: result.name, type: req.session.type});
        })
        .catch (error=>{
            console.log("Error: ",error);
        });
    } else if (req.session.userID && req.session.type==='ngo') {
        NGO.findOne({email: req.session.userID})
        .then (result=>{
            res.render("home.ejs", {user: result.name, type: req.session.type});
        })
        .catch (error=>{
            console.log("Error: ",error);
        });
    } else {
        res.render("home.ejs");
    }
});

app.post('/', (req, res)=>{
    req.session.location = req.body["latitude"]+'_'+req.body["longitude"];
    console.log("[POST] `/`      Current User Location: "+req.session.location);
    req.session.nearbyNGOs = [];
    Donation.find({donation_status: {status:0, NGO_name:""}})
    .then (function(resultsDonation){
        NGO.find()
        .then (function(resultNGO){
            res.send({dataDonation: resultsDonation, dataNGO: resultNGO});
        }).catch (error=>{
            console.log('Error: '+error);
            res.sendStatus(500);
        });
    })
    .catch (error=>{ 
        res.sendStatus(500);
        console.log("Error: ",error);
    });
});

app.get('/donate', (req, res)=>{
    console.log("[GET] `/donate` Current User Location: "+req.session.location);
    if (!req.session.userID){
        res.render('sign_up.ejs', {error:null});
    } else {
        User.findOne({email: req.session.userID})
        .then (result=>{
            if (req.session.location===''){
                res.render("donate.ejs", {user: result.name});
            } else {
                res.render("donate.ejs", {user: result.name}); //, {currentLocation: req.session.location}
            }
        })
        .catch (error=>{
            console.log("Error: ",error);
        });
    }
});

app.post('/donate/submit', (req, res)=>{
    const recievedData = req.body;
    if (recievedData["name"]==='') {
        res.send({error:'Please enter username'});  
    } else if (recievedData["dateOfDonation"]==='') {
        res.send({error:'Please enter date of donation'});  
    } else if (new Date(recievedData['dateOfDonation'])<new Date()) {
        res.send({error:'Please enter valid date of donation'})
    } else if (recievedData["position"]["humanReadableAddress"]==='' || recievedData["position"]["coordinates"]["latitude"]==='') {
        res.send({error:'Please enter pickup address'});  
    } else {
        let donationData = {
            donar_name: recievedData["name"],
            date_of_donation: recievedData["dateOfDonation"],  
            user_pickup_address: recievedData["position"],
            donation_status: {status: 0, NGO_name: ''},
            type_of_donation: recievedData["typeOfDonation"],
        }
        if (recievedData["typeOfDonation"]==='Food'){
            donationData.type_of_event = recievedData["typeOfEvent"];
        }
        const donation = new Donation(donationData);
        donation.save()
        .then ((result)=>{
            User.updateOne({email: req.session.userID}, {$push: {user_donations: result}})
            .then (()=>{
                console.log('Done');
            })
            .catch (error=>{
                console.log("Error: ",error);
            });
        })
        .catch(error=>{
            console.log("Error: ", error);
        })
        res.send({error:null});
    }
});

app.get('/about_us', (req, res)=>{
    if (req.session.userID && req.session.type==='user') {
        User.findOne({email: req.session.userID})
        .then (result=>{
            res.render("about_us.ejs", {user: result.name, type: req.session.type});
        })
        .catch (error=>{
            console.log("Error: ",error);
        });
    } else if (req.session.userID && req.session.type==='ngo') {
        NGO.findOne({email: req.session.userID})
        .then (result=>{
            res.render("about_us.ejs", {user: result.name, type: req.session.type});
        })
        .catch (error=>{
            console.log("Error: ",error);
        });
    } else {
        res.render("about_us.ejs")
    }
});

app.get('/feedback', (req, res)=>{
    if (req.session.userID && req.session.type==='user') {
        User.findOne({email: req.session.userID})
        .then (result=>{
            res.render("feedback.ejs", {user: result.name, type: req.session.type});
        })
        .catch (error=>{
            console.log("Error: ",error);
        });
    } else if (req.session.userID && req.session.type==='ngo') {
        NGO.findOne({email: req.session.userID})
        .then (result=>{
            res.render("feedback.ejs", {user: result.name, type: req.session.type});
        })
        .catch (error=>{
            console.log("Error: ",error);
        });
    } else {
        res.render("feedback.ejs");
    }
});

function dateOfJoining(){
    const date = new Date;
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[date.getMonth()]+' '+date.getFullYear();
}   

app.get('/sign_up', (req, res)=>{
    res.render("sign_up.ejs", {error: null})
});

app.post('/sign_up',(req, res)=>{
    //assuming email to be unique and mobile numeber to be valid
    bcrypt.hash(req.body["userPassword"], saltRounds, (err, hashedPassword) => {
        if (err) throw err;
        var newUser = new User({
            name: req.body["userName"],
            email: req.body["userEmail"],
            user_mobile_number: req.body["userMobile"],
            user_password: hashedPassword,
            user_date_of_joining: dateOfJoining()
        });
        newUser.save()
        .then (result=>{
            req.session.userID = req.body["userEmail"];
            req.session.type = 'user';
            console.log("[POST] `/sign_up`",req.session.userID);
            res.redirect('/');
        })
        .catch (error=>{
            console.log("Error: ",error);
            res.redirect('/sign_up')
        });
    });
});

app.get('/sign_in', (req, res)=>{
    res.render('sign_in.ejs', {error: null})
});

app.post('/sign_in', (req, res)=>{
    User.findOne({email: req.body["userEmail"]})
    .then (user=>{
        if (user) {
            // console.log('Found User:', user);
            bcrypt.compare(req.body["userPassword"], user.user_password, (err, result) => {
                if (err) throw err;
                if (result) {
                    // console.log('Login successful');
                    req.session.userID = req.body["userEmail"];
                    req.session.type = 'user';
                    res.redirect('/');
                } else {
                    // console.log('Invalid password');
                    res.render('sign_in.ejs', {error: 'Invalid Password'});
                }
            });
        } else {
            // console.log('User not found');
            res.render('sign_in.ejs', {error: 'User not found'});
        }
    })
    .catch (err=>{
        console.error('Error:', err);
    });
});

app.get('/sign_up_ngo', (req, res)=>{
    res.render("sign_up_ngo.ejs", {error: null})
});

app.post('/sign_up_ngo',(req, res)=>{
    //assuming registration no. to be unique
    bcrypt.hash(req.body["NGOPassword"], saltRounds, (err, hashedPassword) => {
        if (err) throw err;
        var newNGO = new NGO({
            name: req.body["NGOName"],
            email: req.body["NGOEmail"],
            NGO_registration_number: req.body["NGORegistrationNumber"],
            NGO_address: {humanReadableAddress: req.body["NGOAddress"], coordinates: JSON.parse(req.body["NGOCoordinates"])},
            NGO_sectors: null || req.body["NGOSectors"],
            NGO_webpage: null || req.body["NGOWebpage"],
            NGO_password: hashedPassword,
            NGO_date_of_joining: dateOfJoining()
        });
        newNGO.save()
        .then (result=>{
            req.session.userID = req.body["NGOEmail"];
            req.session.type = 'ngo';
            console.log("[POST] `/sign_up`",req.session.userID);
            res.redirect('/');
        })
        .catch (error=>{
            console.log("Error: ",error);
            res.redirect('/sign_up')
        });
    });
});

app.get('/sign_in_ngo', (req, res)=>{
    res.render('sign_in_ngo.ejs', {error: null})
});

app.post('/sign_in_ngo', (req, res)=>{
    NGO.findOne({email: req.body["NGOEmail"]})
    .then (ngo=>{
        if (ngo) {
            bcrypt.compare(req.body["NGOPassword"], ngo.NGO_password, (err, result) => {
                if (err) throw err;
                if (result) {
                    req.session.userID = req.body["NGOEmail"];
                    req.session.type = 'ngo';
                    res.redirect('/');
                } else {
                    res.render('sign_in_ngo.ejs', {error: 'Invalid Password'});
                }
            });
        } else {
            res.render('sign_in_ngo.ejs', {error: 'User not found'});
        }
    })
    .catch (err=>{
        console.error('Error:', err);
    });
});

app.get('/profile/user/:username', (req,res)=>{
    if (!req.session.userID){
        res.render('sign_up.ejs', {error:null});
    } else {
        User.findOne({email: req.session.userID})
        .then(result=> {
            res.render('profile.ejs', {user: result.name ,userData : result, type: req.session.type});
        }).catch(error=>{
            console.log("Error: ", error);
            res.sendStatus(500);
        });
    }
});

app.get('/profile/ngo/:ngoname', (req,res)=>{
    if (!req.session.userID){
        res.render('sign_up_ngo.ejs', {error:null});
    } else {
        NGO.findOne({email: req.session.userID})
        .then(resultNGO=> {
            let destination = '';
            let i = 0;
            Donation.find({donation_status: {status:0, NGO_name:""}})
            .then(resultDonation=>{
                const origin = resultNGO.NGO_address.coordinates.latitude+','+resultNGO.NGO_address.coordinates.longitude;
                resultDonation.forEach(donation=>{
                    if (i === resultDonation.length){
                        destination += donation.user_pickup_address.coordinates.latitude+','+donation.user_pickup_address.coordinates.longitude;
                    } else {
                        destination += donation.user_pickup_address.coordinates.latitude+','+donation.user_pickup_address.coordinates.longitude+';';
                    }
                    i++;
                });  
                const options = {
                    method: 'GET',
                    url: 'https://trueway-matrix.p.rapidapi.com/CalculateDrivingMatrix',
                    params: {
                        origins: origin,
                        destinations: destination
                    },
                    headers: {
                        'X-RapidAPI-Key': process.env.RapidAPI_Key,
                        'X-RapidAPI-Host': process.env.RapidAPI_Host
                    }
                };
                axios.request(options)
                .then(responseAPI=>{
                	console.log(responseAPI.data);
                    res.render('profile_NGO.ejs', {user: resultNGO.name ,NGOData : resultNGO, type: req.session.type, donationData: resultDonation, response: responseAPI.data});
                }).catch (error=>{
                    console.log('Error: '+error);
                    res.sendStatus(500);
                });
            }).catch (error=>{
                console.log('Error: '+error);
                res.sendStatus(500);
            });
        }).catch(error=>{
            console.log("Error: ", error);
            res.sendStatus(500);
        });
    }
});

app.post('/profile/ngo/:username', (req,res)=>{
    req.session.location = req.body["latitude"]+'_'+req.body["longitude"];
    console.log("[POST] `/`      Current User Location: "+req.session.location);
    req.session.nearbyNGOs = [];
    Donation.find({donation_status: {status:0, NGO_name:""}})
    .then (function(resultsDonation){
        NGO.find()
        .then (function(resultNGO){
            res.send({dataDonation: resultsDonation, dataNGO: resultNGO});
        }).catch (error=>{
            console.log('Error: '+error);
            res.sendStatus(500);
        });
    })
    .catch (error=>{ 
        res.sendStatus(500);
        console.log("Error: ",error);
    });
});

app.get('/registered_ngo', (req,res)=>{
    NGO.find()
    .then(resultNGO=>{
        if (req.session.userID){
            User.findOne({email: req.session.userID})
            .then (resultUser=>{
                res.render('registered_ngo.ejs', {user: resultUser.name, NGOData: resultNGO, type: req.session.type})
            }).catch (error=>{
                res.sendStatus(500);
                console.log("Error: ",error);
            });
        } else {
            res.render("registered_ngo.ejs", {NGOData: resultNGO});
        }
    }).catch (error=>{
        console.log("Error: "+error);
    })
});

app.get('/nearby_donations', (req,res)=>{
    Donation.find({donation_status: {status:0, NGO_name:""}})
    .then(resultDonation=>{
        if (req.session.userID){
            NGO.findOne({email: req.session.userID})
            .then (resultNGO=>{
                res.render('nearby_donations.ejs', {user: resultNGO.name, donationData: resultDonation, type: req.session.type})
            }).catch (error=>{
                res.sendStatus(500);
                console.log("Error: ",error);
            });
        } else {
            res.render("sign_in_ngo.ejs", {error: null});
        }
    }).catch (error=>{
        res.sendStatus(500);
        console.log("Error: "+error);
    })
});

app.get('/logout', (req, res)=>{
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction error:', err);
            return;
        }
        res.redirect('/');
    });
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});