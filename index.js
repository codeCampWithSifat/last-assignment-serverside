const express = require("express");
const app = express();
const port = process.env.PORT || 5000 ;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require("cors");
require('dotenv').config();
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_KEY);


// use all the middleware
app.use(express.json())
app.use(cors());

function verifyJWT (req,res,next) {
    const authHeader = req.headers.authorization ;
    if(!authHeader) {
        return res.status(403).send({message : "Unauthorized Access"})
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err,decoded) {
        if(err) {
            return res.status(401).send({message : "Forbidden Access"})
        }
        req.decoded = decoded
        next();
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qahuo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run () {
    try {
        const servicesCollection = client.db("BATCH_3_LAST_ASSIGNMENT").collection("Services");
        const bookingsCollection = client.db("BATCH_3_LAST_ASSIGNMENT").collection("Bookings");
        const usersCollection = client.db("BATCH_3_LAST_ASSIGNMENT").collection("Users");
        const reviewsCollection = client.db("BATCH_3_LAST_ASSIGNMENT").collection("Reviews");


        // Show All The Data in the  CheapestPricingPlan.js
        app.get("/services", async(req,res) => {
            const query = {};
            const result = await servicesCollection.find(query).toArray();
            res.send(result);
        });
        
        // get a singel service 
        app.get("/services/:id", async(req,res) => {
            const id = req.params.id;
            const query = {_id : new ObjectId(id)};
            const service = await servicesCollection.findOne(query);
            res.send(service);
        });

        // Booked A Order MyBookingModal.js
        app.post("/bookings", async(req,res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        // get all the order MyOrder.js
        app.get("/bookings",verifyJWT, async(req,res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if(email !== decodedEmail) {
                return res.status(403).send({message : "Forbidden Access"})
            }
            const query = {email:email};
            const result = await bookingsCollection.find(query).toArray();
            res.send(result);
        });


        // post All the user SignUp.js
        app.post("/users", async(req,res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        // Post A User From SignUp.js
        app.put('/users/:email', async(req,res) => {
            const email = req.params.email;
            const updatedUser = req.body;
            const filter = {email:email};
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                   name : updatedUser.name,
                   email : updatedUser.email,
                },
              };
              const result = await usersCollection.updateOne(filter, updateDoc, options);
              res.send(result);
        });

        // get all the user 
        app.get("/users", async(req,res) => {
            const query = {};
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        });

        // create a JWT token 
        app.get("/jwt", async(req,res) => {
            const email = req.query.email;
            const query = {email:email};
            const user = await usersCollection.findOne(query);
            if(user) {
                const token = jwt.sign({email},process.env.ACCESS_TOKEN);
                return res.send({accessToken : token})
            }
            res.status(403).send({message : "Forbidden Access"})
        });


        // make a admin AllUsers.js
        app.put('/users/admin/:id', verifyJWT , async(req,res) => {
            const decodedEmail = req.decoded.email;
            const query = {email:decodedEmail};
            const user = await usersCollection.findOne(query);
            if(user?.role !== "admin") {
                return res.status(403).send({message : "Forbidden Access"})
            }
            const id = req.params.id;
            const filter = {_id : new ObjectId(id)};
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                  role : "admin"
                },
              };
              const result = await usersCollection.updateOne(filter, updateDoc, options);
              res.send(result);
        });

        // Check Is User Admin
        app.get("/users/admin/:email", async(req,res) => {
            const email = req.params.email;
            const query = {email:email};
            const user = await usersCollection.findOne(query);
            res.send({isAdmin : user?.role === "admin"})
        });

        
        // Post a review from Review.js
        app.post("/reviews", async(req,res) => {
            const review = req.body ;
            const result = await reviewsCollection.insertOne(review);
            res.send(result)
        });

        // get all the reiview CustomerReview.js
        app.get("/reviews", async(req,res) => {
            const review = {};
            const result = await reviewsCollection.find(review).toArray() ;
            res.send(result);
        });


        // get a single booking on Payment.js
        app.get("/bookings/:id", async(req,res) => {
            const id = req.params.id;
            const query = {_id : new ObjectId(id)};
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        });


        // CheckoutForm.js
        // app.post("/create-payment-intent", async(req,res) => {
        //     const booking = req.body;
        //     const price = booking.price;
        //     const amount = price * 100 ;
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         amount : amount,
        //         currencry : "usd",
        //         "payment_method_types": [
        //             "card"
        //           ],
        //     });

        //     res.send({
        //         clientSecret: paymentIntent.client_secret,
        //       });
        // })



    } finally {

    }
}
run().catch(console.dir)



app.get("/",(req,res) => {
    res.send("Hello Last Assignment Server Side")
    console.log("Hello Server side")
})

app.listen(port, () => {
    console.log(`Listening To The ${port} Successfully`)
})