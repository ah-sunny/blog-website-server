const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        "https://blog-website-sani42.web.app",
        "https://blog-website-sani42.firebaseapp.com"
    ],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sy54hal.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares 
const logger = (req, res, next) => {
    // console.log('log: info', req.method, req.url);
    next();
}

// const verifyToken = (req, res, next) =>{
//     const token = req?.cookies?.token;
//     if(!token){
//         return res.status(401).send({message: 'unauthorized access'})
//     }
//     console.log("verify token----",token)
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
//         if(err){
//             return res.status(401).send({message: 'unauthorized access'})
//         }
//         req.user = decoded;
//         next();
//     })
// }
const cookieOption =  {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
}

async function run() {
    try {
        // await client.connect();
        const db = client.db("BlogWebsite");
        const userCollection = db.collection("User");
        const allBlogsCollection = db.collection("allblogs");
        const wishListCollection = db.collection("wishlist");
        const commentCollcection = db.collection("comment");



        //auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '2h' })
            res
                .cookie('token', token, cookieOption)
                .send({ success: true })
        })
        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie('token', { ...cookieOption , maxAge: 0 }).send({ success: true })
        })


        app.get('/users', async (req, res) => {
            // console.log('email:: ', req.query.email )
            // console.log('token:: ', req.cookies.token )
            const data = userCollection.find()
            const userData = await data.toArray()
            res.send(userData)
        })
        app.post('/users', async (req, res) => {
            const user = req.body
            // console.log('user:',user)
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

        app.get('/allblogs', async (req, res) => {
            // console.log('email:: ', req.query.email )
            const allblog = await allBlogsCollection.find().toArray()
            res.send(allblog)
        })
        app.get('/allblogs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const blog = await allBlogsCollection.findOne(query);

            res.send(blog);
        })
        app.post('/allblogs', async (req, res) => {
            const newblog = req.body
            const addNewBlog = await allBlogsCollection.insertOne(newblog)
            res.send(addNewBlog)
        })
        app.put('/allblogs/:id', async (req, res) => {
            const id = req.params.id;
            const blog = req.body;

            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const editBlog = {
                $set: {
                    title: blog.title,
                    category: blog.category,
                    image: blog.image,
                    short_description: blog.short_description,
                    long_description: blog.long_description,
                }
            }
            const result = await allBlogsCollection.updateOne(filter, editBlog, options);
            res.send(result);

        })
        app.post('/blogComment', async (req, res) => {
            const comment = req.body
            const Result = await commentCollcection.insertOne(comment)
            res.send(Result)
        })
        app.get('/blogComment', async (req, res) => {
            const comment = await commentCollcection.find().toArray()
            res.send(comment)
        })



        app.get('/wishlist', async (req, res) => {
            console.log('email of wishlist:: ', req.query.email)
            // console.log('token:: ', req.cookies.token )
            // if(req.user.email !== req.query.email){
            //     return res.status(403).send({message: 'forbidden access'})
            // }
            const wishBlogs = await wishListCollection.find().toArray()
            res.send(wishBlogs)
        })
        app.post('/wishlist', async (req, res) => {
            const item = req.body
            const itemsResult = await wishListCollection.insertOne(item)
            res.send(itemsResult)
        })
        app.delete('/wishlist/:id', async (req, res) => {
            const id = req.params.id;
            console.log('please delete from database', id);
            const query = { _id: id }
            const result = await wishListCollection.deleteOne(query);
            console.log(result)
            res.send(result);
        })




        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send("Blog Website server is running");
})

app.listen(port, () => {
    console.log(`Blog Website server is running on port : ${port}`);
})
