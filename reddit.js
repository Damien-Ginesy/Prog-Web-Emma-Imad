const express = require('express');
const {openDb} = require("./db")

const session = require('express-session')
const app = express()
const bodyParser = require('body-parser'); 
const path = require('path');
//const SQLiteStore = require('connect-sqlite3')(session);
const port = 3000

const authentification = {
  username: "username",
  password: "password"
}


const sess = {
  //store: new SQLiteStore,
  secret: 'secret key',
  resave: true,
  rolling: true,
  cookie: {
    maxAge: 1000 * 3600//ms
  },
  saveUninitialized: true
}
app.use(session(sess))


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', './views'); 
app.set('view engine', 'jade');


app.post('/logout',(req, res) => {
  req.session.logged = false
  res.redirect('/login')
})

app.get("/", async(req, res) => {
  if(!req.session.logged){
    res.redirect(302,'/login')
    return
  }
  const db = await openDb()
  const article = await db.all(`
    SELECT * FROM article ORDER BY up DESC
  `)
  const data = {
    article:article
  }
  res.render('accueil',data)
  })

app.get("/signup", async(req, res) => {
  res.render('signup')
})

app.post('/signup', async(req, res) => {
  const db = await openDb()
  const new_user = req.body.username
  const new_email = req.body.email
  const new_password = req.body.password 
  const password_check = req.body.password_check

  let data = {
  }
  if ( password_check !== new_password ) {
    data = {
      errors: "Les deux mots de passe ne correspondent pas",
      logged: false
    }
    res.render('signup',data)
  }

  else {
    const user = await db.get(` SELECT * FROM user WHERE username=? `, [new_user])
    if(user !== undefined){
      data = {
        errors: "Cet utilisateur est déjà utilisé",
        logged: false
      }
      res.render('signup',data)
    }
    else{
      db.run(`INSERT INTO user(username,email,password) VALUES(?,?,?)`, [new_user,new_email,new_password])
      data = {
        success: "Vous êtes log",
        logged: true
      }
      req.session.logged=true
    }
  }
  res.redirect(302,'/')
  })



app.get('/login', (req, res) => {
  res.render('login', {logged: req.session.logged})
})


  app.post('/login', async(req, res) => {
    const db = await openDb()
    const username = req.body.username
    const password = req.body.password
    const user = await db.get(`
    SELECT * FROM user WHERE username=? AND password=?
    `, [username,password])
    let data = {
    }
    if( user == undefined ) {
      data = {
        errors: "Le login est incorrect",
        logged: false
      }
      res.render('login',data)
    }
    else {
      req.session.logged = true
      data = {
        success: "Vous êtes log",
        logged: true
      }
    }
    res.redirect('/')
  })






app.get('/:id', async (req, res) => {
   const db = await openDb()
   const id = req.params.id
   const article = await db.get(`
     SELECT * FROM article
     WHERE id = ?
     `,[id])
    console.log(article.name)
    const data = {
      id: id,
      article_name:article.name,
      article_content:article.content
    }
   res.render("article",data)
  })


app.get('/:id/edit', async (req, res) => {

  const db = await openDb()
  const id = req.params.id
  const name = req.body.name
  const article = await db.get(`
    SELECT * FROM article
    WHERE id = ?
  `,[id])
  const data = {
    id: id,
    article_name: article.name,
    article_content: article.content
  }
  res.render("article-edit",data)
  })


app.post('/:id', async (req, res) => {
  const name = req.body.name
  const content = req.body.content
  const id = req.params.id
  const db = await openDb()
  await db.run(`
    UPDATE article
    SET name = ?, content = ?
    WHERE id = ?
  `,[name,content,id])
  res.redirect("/" + id)
  })

app.get('/article/create', async (req, res) => {
  if(!req.session.logged){
    res.redirect(302,'/login')
    return
  }
  const db = await openDb()

  const article = await db.all(`
    SELECT * FROM article
  `)
  res.render("article-create",{article: article})
  })

app.post('/article/create', async (req, res) => {
  if(!req.session.logged){
    res.redirect(302,'/login')
    return
  }

  const db = await openDb()
  const id = req.params.id
  const name = req.body.name
  const content = req.body.content
  const up = 0
  const article = await db.run(`
    INSERT INTO article(name,content,up)
    VALUES(?, ?, ?)
  `,[name, content, up])
  res.redirect("/" + article.lastID)
  })


app.post('/article/:id/delete', async (req, res) => {
  if(!req.session.logged){
    res.redirect(302,'/login')
    return
  }
  const id = req.params.id
  const db = await openDb()
  const article = await db.get(`
    DELETE FROM article
    WHERE id = ?
  `,[id])
  res.redirect(302,'/')
  })

app.get('/:id/up', async (req, res) => {
  if(!req.session.logged){
    res.redirect(302,'/login')
    return
  }
  const id = req.params.id
  const up = await db.get(`
    SELECT * FROM article
    WHERE id = ?
    `, [id])
  vote = up.up + 1
  const db = await openDb()
  await db.run(`
    UPDATE article
    SET up = ?
    WHERE id = ?
  `,[vote,id])
  res.redirect(302,'/')
  })

app.get('/:id/down', async (req, res) => {
  if(!req.session.logged){
    res.redirect(302,'/login')
    return
  }
  const id = req.params.id
  const up = await db.get(`
    SELECT * FROM article
    WHERE id = ?
    `, [id])
  vote = up.up - 1
  const db = await openDb()
  await db.run(`
    UPDATE article
    SET up = ?
    WHERE id = ?
  `,[vote,id])
  res.redirect(302,'/')
  })
app.listen(port,() => { 
  console.log("Listening on port ", port) 
})
