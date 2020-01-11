const express = require('express');
const mongodb = require('mongodb');

const router = express.Router();

// Get Posts
router.get('/', async (req, res) => {
  const posts = await loadPostsCollection();
  res.send(await posts.find({}).toArray());
});

// Add Post
router.post('/', async (req, res) => {
  const posts = await loadPostsCollection();
  await posts.insertOne({
    pv: req.body.pv,
    grid: req.body.grid,
    timestamp: new Date()
  });
  res.status(201).send();
});

// Delete Post
router.delete('/:id', async (req, res) => {
  const posts = await loadPostsCollection();
  await posts.deleteOne({ _id: new mongodb.ObjectID(req.params.id) });
  res.status(200).send({});
});

async function loadPostsCollection() {
  const uri = "mongodb+srv://user2:password222@cluster0-njwtc.mongodb.net/test?retryWrites=true&w=majority";
  const client = await mongodb.MongoClient.connect(
    uri,
    {
      useNewUrlParser: true
    }
  );

  return client.db('solardb').collection('solardemo');
}

module.exports = router;
