require('dotenv').config()

const express = require("express")
const cookie = require("cookie-session")
const passport = require("passport")
const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.get("/", (request, response) => {
  response.redirect("/login.html")
})
app.use(express.static("public"))

app.use(cookie ({
  name: "session",
  keys: ["key1", "key2"]
}))

app.use(passport.initialize())
app.use(passport.session())

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USERNM}:${process.env.PASS}@${process.env.HOST}/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let collection = null
let usersCollection = null

async function run() {
  try {
    await client.connect();
    collection = client.db("ToDoList").collection("a3-ayushkulkarni");
    usersCollection = client.db("ToDoList").collection("Users");
    // Send a ping to confirm a successful connection
    await client.db("ToDoList").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    console.error(error)
  }
}

function requireLogin(request, response, next) {
  if (request.session?.login) {
    next();
  } else {
    response.redirect('/login.html')
  }
}

app.get("/data", async (request, response) => {
  const docs = await collection.find({username: request.session.username}).toArray()
  response.json(docs)
})
app.post("/submit", async (request, response) => handlePost(request, response))
app.delete("/delete/:id", async (request, response) => handleDelete(request, response))
app.put("/update/:id", async (request, response) => handleUpdate(request, response))

const handlePost = async function( request, response ) {
  const parse = request.body;
  
  let dueDate = new Date(parse.createdDate);
  let numDays = 0;
  if (parse.priority == "high") {
    numDays = 1;
  } else if (parse.priority == "medium") {
    numDays = 3;
  } else if (parse.priority == "low") {
    numDays = 7;
  }
  dueDate.setDate(dueDate.getDate() + numDays)
  dueDate = dueDate.toISOString().substring(0, 10)

  parse.dueDate = dueDate

  parse.username = request.session.username;

  const result = await collection.insertOne(parse)
  response.json(result)
}

const handleDelete = async function (request, response) {
  const id = request.params.id

  const result = await collection.deleteOne({_id: new ObjectId(id), username: request.session.username});
  response.json(result)
}

const handleUpdate = async function (request, response) {
  const id = request.params.id
    
  const parse = request.body

  let dueDate = new Date(parse.createdDate);
  let numDays = 0;
  if (parse.priority == "high") {
    numDays = 1;
  } else if (parse.priority == "medium") {
    numDays = 3;
  } else if (parse.priority == "low") {
    numDays = 7;
  }
  dueDate.setDate(dueDate.getDate() + numDays)
  parse.dueDate = dueDate.toISOString().substring(0, 10)

  const result = await collection.updateOne(
    {_id: new ObjectId(id), username: request.session.username},
    {$set: parse}
  )
  response.json(result)
}

app.post("/login", async (request, response) => {
  console.log(request.body)

  const username = request.body.username
  const password = request.body.password

  let user = await usersCollection.findOne({username})

  if (!user) {
    const result = await usersCollection.insertOne({username, password})
    user = {_id: result.insertedId, username, password}
    return response.send(`<script>alert("Account created for user ${username}"); window.location="/index.html";</script>`);
  } else if (user.password !== password) {
    return response.send(`<script>alert("Incorrect password for user ${username}"); window.location="/login.html";</script>`);
  } else {
    request.session.username = username
    request.session.login = true
    response.redirect("/index.html")
  }
})

app.get("/logout", (request, response) => {
  request.session = null
  response.redirect("/login.html")
})

app.use(function (request, response, next) {
  if (request.session.login == true) {
    next()
  } else {
    response.sendFile(__dirname + "/public/login.html")
  }
})

run()
app.listen( port, () => console.log(`Server running on port ${port}`))
