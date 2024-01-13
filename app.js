const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const eoc = require('express-openid-connect');
const session = require('express-session')

const indexRouter = require('./routes/index');
const datatableRouter = require('./routes/datatable');
const apiRouter = require('./routes/api');
const profileRouter = require('./routes/profile');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'dghui9o2345zgsdfg',
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 60000}
}))

// Ova funkcija se okida svaki puta prije nego se pozove neka od ruta
app.use(function (req, res, next) {
    // Make "flash" object available in all .ejs views/templates
    res.locals.flash = req.session.flash;
    req.session.flash = undefined;
    next();
});

const config = {
    authRequired: false,
    idpLogout: true, //login not only from the app, but also from identity provider
    secret: 'proizvoljno',
    baseURL: 'http://localhost:3000',
    clientID: 'YuYWyMYw2iMKVmEuRnZaNCYa7kH6UkBB',
    issuerBaseURL: 'https://dev-a1hoxpqf7enjxxm0.us.auth0.com',
    clientSecret: 'z6nxTRRIKnYD3iMI6mf_AcTlw4XFIwtJKo6UC4661TchHbGyjoLLdK6-WDWNkhTd',
    authorizationParams: {
        response_type: 'code',
        //scope: "openid profile email"
    },
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(eoc.auth(config));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/datatable', datatableRouter);
app.use('/api/waeijiten', apiRouter);
app.use('/profile', profileRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
