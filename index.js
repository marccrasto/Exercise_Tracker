const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let mongoose = require('mongoose');
let bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: String,
  userId: String
});

const userSchema = new mongoose.Schema({
  username: String
});

let Exercise = mongoose.model("Exercise", exerciseSchema);
let User = mongoose.model("User", userSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', function(req,res) {
  const nameInput = req.body.username;
  let newUser = new User({
    username: nameInput
  });
  newUser.save(function(err,data) {
    if(err) {
      console.log("Failed");
    }
    res.json({username: data.username, _id: data._id});
  });
});

//There is an error here. First check if user exists, second check if id field has been filled out, and all that.
app.post('/api/users/:_id/exercises', function(req,res) {
  const idParam = req.params._id;
  const descriptionInput = req.body.description;
  const durationInput = req.body.duration;
  let dateInputFormatted;
  if(req.body.date) {
    dateInputFormatted = new Date(req.body.date);
  }
  else {
    dateInputFormatted = new Date();
  }

  User.findById(idParam, function(err, data) {
    if(err) {
      console.log("Failed");
    }

    const personName = data.username;
    let newExercise = new Exercise({
      username: personName,
      description: descriptionInput,
      duration: Number(durationInput),
      date: dateInputFormatted.toDateString(),
      userId: idParam
    });
    newExercise.save(function(err,data) {
      if(err) {
        console.log(err);
      }
      res.json({username: data.username, description: data.description, duration: data.duration, date: data.date, _id: data.userId});
    });
  });
});

app.get('/api/users', function(req,res) {
  User.find(function(err,data) {
    if(err) {
      console.log(err);
    }
    res.json(data);
  });
});

app.get("/api/users/:_id/logs", function(req,res) {
  const idParam = req.params._id;
  let from;
  let to;
  let limit;
  if(req.query.from) {
    from = new Date(req.query.from);
  }
  if(req.query.to) {
    to = new Date(req.query.to);
  }
  if(req.query.limit) {
    limit = Number(req.query.limit);
  }

  Exercise.find({userId: idParam}, function(err,data) {
    if(err) {
      console.log(err);
      return res.json({message: "Unable to retrieve exercises"});
    }

    if(data.length == 0) {
      return res.json({message: "User has not logged any exercise!"});
    }

    let log = [];
    let count = data.length;
    let name = data[0].username;
    let id = data[0].userId;

    if(from) {
      data = data.filter((object) => {
        const entryDate = new Date(object.date);
        return entryDate >= from;
      });
    }

    if(to) {
      data = data.filter((object) => {
        const entryDate = new Date(object.date);
        return entryDate <= to;
      });
    }

    if(limit) {
      data = data.slice(0,limit);
    }

    log = data.map(object => ({
      description: object.description,
      duration: object.duration,
      date: object.date,
    }));

    res.json({"username": name, "count": count, "log": log, "_id": id});    
  });
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
