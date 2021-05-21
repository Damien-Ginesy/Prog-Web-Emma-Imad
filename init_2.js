const {openDb} = require("./db")

const tablesNames = ["user","article"]



async function createNewUser(db){
  const insertRequest = await db.prepare("INSERT INTO user(username,email, password) VALUES(?,?,?)")
  const account = [{
    username: "bob",
    email: "bob@bob.fr",
    password: "bob"
  },
    {
      username: "max",
      email: "max@max.fr",
      password: "max"
    }
  ]
  return await Promise.all(account.map(user => {
    return insertRequest.run([user.username,user.email, user.password])
  }))
}

async function createArticle(db){
  const insertRequest = await db.prepare("INSERT INTO article(name, content) VALUES(?, ?)")
  const contents = [{
    name: "Article 1",
    content: "Hello c'est un nouvel article"
  },
    {
      name: "Article 2",
      content: "C'est juste un test"
    }
  ]
  return await Promise.all(contents.map(article => {
    return insertRequest.run([article.name, article.content])
  }))
}

async function createTables(db){
  const accounts = db.run(`
    CREATE TABLE IF NOT EXISTS user(
      id INTEGER PRIMARY KEY,
      username varchar(255),
      email varchar(255),
      password varchar(255)
    )
  `)
  const articles = db.run(`
        CREATE TABLE IF NOT EXISTS article(
          id INTEGER PRIMARY KEY,
          name varchar(255),
          content text
        )
  `)
  return await Promise.all([accounts,articles])
}


async function dropTables(db){
  return await Promise.all(tablesNames.map( tableName => {
      return db.run(`DROP TABLE IF EXISTS ${tableName}`)
    }
  ))
}

(async () => {
  // open the database
  let db = await openDb()
  await dropTables(db)
  await createTables(db)
  await createNewUser(db)
  await createArticle(db)
})()
