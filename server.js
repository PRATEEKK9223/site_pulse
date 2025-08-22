require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const auditRoutes = require('./src/routes/auditRoutes');

const app = express();

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', auditRoutes);

// basic health route
app.get('/health', (req, res) => res.send({ status: 'ok', time: new Date() }));


// this is new feature that i added now 

app.get('/about',(req,res)=>{
    res.render("about");
});

app.get('/contact',(req,res)=>{
    res.render("contact");
});

app.get('/privacy',(req,res)=>{
    res.render('privacy')
});

app.get('/terms',(req,res)=>{
    res.render('terms')
});

app.get('/support',(req,res)=>{
    res.render('support');
})



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Site Pulse running at http://localhost:${PORT}`));
