const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const port = 5000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.send('Blogsite API');
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u704q.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    console.log('error!', err);

    // blogs Database
    const blogs = client.db("blogsite").collection("blogs");

    app.post('/addBlog', (req, res) => {
        const newBlog = req.body;
        blogs.insertOne(newBlog)
        .then(result => {
            console.log('inserted count', result.insertedCount);
            res.send(result.insertedCount > 0);
        })
    })

    app.get('/blogs', (req, res) => {
        blogs.find()
        .toArray((err, blog) => {
            res.send(blog);
        })
    })

    // delete service
    app.delete('/deleteService/:id', (req, res) => {
        const id = ObjectID(req.params.id);
        blogs.findOneAndDelete({_id: id})
        .then(document => res.send(document.value))
    })

    // Admin Database
    const adminCollection = client.db("blogsite").collection("admin");
    app.post('/makeAdmin', (req, res) => {
        adminCollection.insertOne({ ...req.body })
        .then(result => {
            res.send(result.insertedCount > 0)
        });
    })

    app.get('/checkUserRole', (req, res) => {
        adminCollection.find({email: req.query.email})
        .toArray((error, documents) => {
            res.send(documents.length > 0)
        });
    })
});

app.listen(process.env.PORT || port);