const express = require("express");
const cors = require("cors");
const csrf = require('csurf');
const session = require("express-session");
const MongoStore = require("connect-mongodb-session")(session);
const substanceRouter = require("./routes/substanceRoutes");
const userRoutes = require("./routes/userRoutes");
const cookieParser = require('cookie-parser');

const corsOptions = {
  origin: "https://roh7771.github.io/Reagent-List",
  credentials: true,
};

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

const store = new MongoStore({
  collection: "sessions",
  uri: DB,
});

const app = express();

app.use(express.json());
app.use(cors(corsOptions));
app.use(
  session({
    secret: "some secret value",
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: 'none',
      secure: true
    },
    store,
  })
);
app.use(cookieParser());
app.use(csrf());
app.use(function(req, res, next) {
  let token = req.csrfToken();
  res.cookie('X-CSRF-TOKEN', token, {
    sameSite: 'none',
    secure: true
  });
  res.locals.csrfToken = token;
  next();
});

// 3) ROUTES
app.use("/api/v1/substances", substanceRouter);
app.use("/api/v1/users", userRoutes);

module.exports = app;
