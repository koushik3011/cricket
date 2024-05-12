

const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const {Match} = require("./matchmodel")
const backup = require("./backup");
require('dotenv').config();
app.set('view engine', 'ejs');
const {playermodel} = require("./models")
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect(process.env.URL);
const jsonParser = bodyParser.json();
app.use(jsonParser); // use it globally

app.get("/addplayers" , function(req , res){
    playermodel.find().then((arr)=>{
        res.render("addplayer" ,{players:arr} );
    })
})
app.get("/player/:id" , function(req, res){
    playermodel.findById(req.params.id).then((player)=>{
        res.render("player" , {player:player})
    })
})
app.post("/addplayers" , function (req , res) { 
    console.log(req.body);
    const a = new playermodel({
        name:req.body.name,
        matches:0,
        catches:0,
        batting:{
            runs:0,
            ballsfaced:0,
            innings:0,
            fours:0,
            sixes:0,
            strikeRate:0,
            average:0,
            halfcenturies:0,
            centuries:0,
        } , 
        bowling:{
            balls:0,
            wickets:0,
            overs:0,
            maidens:0,
            runs:0,
            wides:0,
            noballs:0,
            economy:0,
        }
    })
    a.save()
    res.redirect("/")
 })

app.get("/players" ,  function (req , res) { 
    playermodel.find().then((arr)=>{
        res.render("players" , {players:arr})
    })
 })

app.get("/creatematch" ,  function (req , res) { 
 playermodel.find().then((arr)=>{
    res.render("creatematch" , {players:arr})
 })
 })
 app.post('/creatematch', async (req, res) => {
    try {
        // Fetch players' details based on the received IDs
        const team1Players = await playermodel.find({ _id: { $in: req.body.team1 } });
        const team2Players = await playermodel.find({ _id: { $in: req.body.team2 } });
        
        // Create new match with player details
        const newMatch = new Match({
            overs: req.body.overs,
            team1: team1Players.map(player => ({ playerid: player._id, playername: player.name })),
            team2: team2Players.map(player => ({ playerid: player._id, playername: player.name })),
            firstbatting: req.body.firstBatting,
            t1: team1Players,
            t2: team2Players,
            team1_runs: 0,
            team2_runs: 0,
            team1_wickets: 0,
            team2_wickets: 0,
            team1_overs: 0,
            team2_overs: 0,
            team1_player_batting_stats: [],
            team2_player_batting_stats: [],
            team1_player_bowling_stats: [],
            team2_player_bowling_stats: [],
            team1_overs_total: [],
            team2_overs_total: [],
            currentbatters: [],
            currentbowler:{}
        })
        await newMatch.save();
      res.redirect("/match/"+newMatch._id)
    } catch (err) {
        console.error('Error creating match:', err);
        res.status(500).send('Error creating match');
    }
});

app.get("/match/:id" , function (req , res) { 
    Match.findById(req.params.id).then((match)=>{
        // console.log(match);
        res.render("match" , {match:match})
    })
 })
 app.post("/match/:id/openers1", async function (req, res) {
    try {
        console.log(req.body);
        console.log(req.body.openers[0]);

        const o1 = await playermodel.findById(req.body.openers[0]);
        const o2 = await playermodel.findById(req.body.openers[1]);

        const match = await Match.findById(req.params.id);
        console.log(match);

        match.team1_player_batting_stats.push({
            name: o1.name,
            id: req.body.openers[0],
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strike_rate: 0,
            out_type: " ",
            bowler_name: " ",
            assist: " "
        });

        match.team1_player_batting_stats.push({
            name: o2.name,
            id: req.body.openers[1],
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strike_rate: 0,
            out_type: " ",
            bowler_name: " ",
            assist: " "
        });

        const o3 = await playermodel.findById(req.body.bowler);
        match.currentbowler={
            name:o3.name,
            runs:0,
            id:req.body.bowler,
            balls:0,
            fours:0,
            sixes:0,
            overs:0,
            wickets:0, 
        }
        match.team2_player_bowling_stats.push({
            name: o3.name,
            id: req.body.bowler,
            runs: 0,
            balls: 0,
            fours:0,
        sixes:0,
        overs:0,
        wickets:0,
        econony:0
        });

        match.currentbatters = [
            {
                name: o1.name,
                id: req.body.openers[0],
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
            },
            {
                name: o2.name,
                id: req.body.openers[1],
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
            }
        ];

        await match.save();
        res.redirect("/match/" + req.params.id);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/match/:id/selectbowler", function (req , res) { 
    Match.findById(req.params.id).then(async function (match) {
        const o1 = await playermodel.findById(req.body.bowler);
        match.currentbowler={
            name:o1.name,
            runs:0,
            id:req.body.bowler,
            balls:0,
            fours:0,
            sixes:0,
            overs:0,
            wickets:0, 
        }
        match.save()
    })
    res.redirect("/match/" + req.params.id);
 })

app.get("/" , function (req , res) { 
    res.render("home")
 })

 app.post('/match/:matchId/ball', async (req, res) => {
    const matchId = req.params.matchId;
    const value = Number(req.body.value);
    console.log(value);
    Match.findById(matchId).then(async (match) => {
        match.team1_runs+=Number(value)
        console.log(match.team1_overs);
        if (match.team1_overs==0.2) {
            match.team1_overs=0.3
        } 
       else if (match.team1_overs%0.5==0 && match.team1_overs!=0 && match.team1_overs%1!=0) {
            match.team1_overs+=0.5
            const tempBatter = match.currentbatters[0];
            match.currentbatters[0] = match.currentbatters[1];
            match.currentbatters[1] = tempBatter;
        } else{
            match.team1_overs+=0.1
        }
       var id =  match.currentbatters[0].id
       var id1 =  match.currentbowler.id
        match.currentbatters[0].balls += 1
        match.currentbatters[0].runs += value; // Increase runs for current bowler
        match.currentbowler.runs += value; // Increase runs for current bowler
        match.currentbowler.balls += 1
        match.team1_player_batting_stats.forEach(player => {
            if (player.id === id) {
                player.runs += value; // Increase runs for the player with the matching ID
                player.balls += 1; // Increase balls for the player with the matching ID
            }
        });
        match.team2_player_bowling_stats.forEach(player => {
            if (player.id === id1) {
                player.runs += value; // Increase runs for the player with the matching ID
                player.balls += 1; // Increase balls for the player with the matching ID
            }
        });
        if (value==1 || value==3) {
            const tempBatter = match.currentbatters[0];
            match.currentbatters[0] = match.currentbatters[1];
            match.currentbatters[1] = tempBatter;
        }
       await match.save()
    })

    // res.redirect("/match/"+req.params.matchId);
 await res.send("hlo")
});


 app.listen(3000 )