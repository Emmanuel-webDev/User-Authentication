const express = require('express');

const bcryptjs = require('bcryptjs')

const path = require('path')

const db = require('./data/database')

const session = require('express-session')
const mongodbStore = require('connect-mongodb-session')

const app = express();

app.use(express.urlencoded({extended: true}));

app.use(express.static('public'))

const MongodbStore = mongodbStore(session)

const sessionStore = new MongodbStore({
    uri:'mongodb://127.0.0.1:27017',
    databaseName: 'verification',
    collection: 'sessions'
})
app.use(session({
    secret : 'super-secret',
    resave : false,
    saveUninitialized: false,
    store: sessionStore
}))

app.set('views', path.join(__dirname, 'UI'));
app.set('view engine', "ejs")

app.get('/', (req,res)=>{
    res.render('index')
})

app.get('/signup', (req,res)=>{
    res.render('signup')
})

app.post('/signin', async (req, res)=>{
    const userData = req.body;
    const name = userData.uname;
    const mail =userData.umail;
    const cmail = userData.cmail;
    const code = userData.ucode;

    if(!name || !mail || !cmail || !code || mail !== cmail || code.trim() < 5){
        console.log('No correct data')
            return res.redirect('/signup')
    }
    const existingUser = await db.getDb().collection('users').findOne({Email : mail})
    if(existingUser){
        return res.redirect('/login')
    }

    const hashedPassword = await bcryptjs.hash(code, 12);

    const data = {
       name : name,
       Email : mail,
       ConfirmMail : cmail,
       password : hashedPassword
    }
    const mydb = await db.getDb().collection('users').insertOne(data); 
    console.log(mydb)
    res.redirect('/login')
})

app.get('/login', (req,res)=>{
    res.render('login')
})

app.get('/adminPage', (req,res)=>{
if(!req.session.isAuthenticated){
    return res.status(401).render('404')
}

    res.render('admin')
})

app.post('/loginUser', async (req, res)=>{
    const userData = req.body;
    const mail =userData.umail;
    const code = userData.ucode;

    const existingUser = await db.getDb().collection('users').findOne({Email : mail})
    if(!existingUser){
        console.log("Couldn't login");
        return res.redirect('/login')
    }

    const equalPassword = await bcryptjs.compare(code, existingUser.password);
    if(!equalPassword){
        console.log('Could not login password');
        return res.redirect('/login')
    }

   req.session.user = { id: existingUser._id, email: existingUser.Email},
   req.session.isAuthenticated= true,
   req.session.save(()=>{
    res.redirect('/adminPage');
   })
   

})

app.post('/logout', (req,res)=>{
    req.session.user = null,
    req.session.isAuthenticated = null
    res.redirect('/')
})

app.use((error, req, res, next)=>{
    res.render('505')
})
db.connection().then(()=>{
    app.listen(3000)
})
