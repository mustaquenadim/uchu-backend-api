const express = require('express');
const cors = require('cors');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

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
    const articleCollection = client.db("uchu").collection("articles");

    // article api's
    app.post('/article', (req, res) => {
        const newArticle = req.body;
        articleCollection.insertOne(newArticle)
            .then(result => {
                console.log('inserted count', result.insertedCount);
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
