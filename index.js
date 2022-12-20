const express = require('express');
const cors = require('cors');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require("./middlewares/auth");

const app = express();

app.use(express.json());

app.use(cors());

app.get('/', (req, res) => {
    res.send('YaY! 🥳 Route is working!');
});

const client = new MongoClient(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    if (err) {
        console.log('error!', err);
    }
    app.listen(process.env.PORT, () => {
        console.log(`Server listening on http://localhost:${process.env.PORT}`);
    });

    // collections
    const userCollection = client.db("uchu").collection("users");
    const articleCollection = client.db("uchu").collection("articles");

    // user api's
    app.post("/register", async (req, res) => {
        try {
            const { name, email, password } = req.body;

            if (!(email && password && name)) {
                res.status(400).send("All input is required");
            }

            // check if user already exist
            // Validate if user exist in our database
            const oldUser = await userCollection.findOne({ email });

            if (oldUser) {
                return res.status(409).send("User Already Exist. Please Login");
            }

            // Encrypt user password
            encryptedUserPassword = await bcrypt.hash(password, 10);

            // Create user in our database
            const user = await userCollection.insertOne({
                name: name,
                email: email.toLowerCase(), // sanitize
                password: encryptedUserPassword,
            });

            // Create token
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "5h",
                }
            );
            user.token = token;

            res.status(201).json(user);
        } catch (err) {
            console.log(err);
        }
    });

    app.post("/login", async (req, res) => {
        try {
            const { email, password } = req.body;

            // Validate user input
            if (!(email && password)) {
                res.status(400).send("All input is required");
            }
            // Validate if user exist in our database
            const user = await userCollection.findOne({ email });

            if (user && (await bcrypt.compare(password, user.password))) {
                const token = jwt.sign(
                    { user_id: user._id, email },
                    process.env.TOKEN_KEY,
                    {
                        expiresIn: "5h",
                    }
                );

                user.token = token;

                return res.status(200).json(user);
            }
            return res.status(400).send("Invalid Credentials");
        } catch (e) {
            console.log(e);
        }
    });

    // article api's
    app.post('/article', (req, res) => {
        console.log(req.body);
        const newArticle = req.body;
        articleCollection.insertOne(newArticle)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/article', (req, res) => {
        articleCollection.find()
            .toArray((err, data) => {
                res.send(data);
            })
    })

    app.delete('/article/:id', (req, res) => {
        const id = ObjectID(req.params.id);
        articleCollection.findOneAndDelete({ _id: id })
            .then(document => res.send(document.value))
    })
});
