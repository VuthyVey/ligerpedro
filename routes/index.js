var express        = require('express');
var passport       = require('passport');
const Router = require('express-promise-router')
const router = new Router()
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();
var pool           = require('../lib/pool-config');
var apartments     = require('./apartment');
var exchange       = require('./exchange');
var transfer       = require('./transfer');
var keeper         = require('./keeper');
var admin          = require('./admin');

apartments.set(router, pool);
exchange.set(router, pool);
transfer.set(router, pool);
keeper.set(router, pool);
admin.set(router, pool);

router.get('/', function(req, res) {
  // necessary to get the role of the user to find out what the menu should disp
  // if we store the user's role in cookies, no longer necessary to query the database
  console.log(req.session)
  if (req.user) {
    pool.query("SELECT * FROM account WHERE email = $1;", [req.user.email], function(err, result) {
      if (err) {
        console.error(err);
      } else {
        res.render('home', {
          user: req.user,
          data: result.rows
        });
      }
    });
  } else {
    res.render('home', {
      user: req.user
    });
  }
});

router.get('/login',
  function(req, res) {
    if (req.user) {
      res.render('notFound', {
        user: req.user
      });
    } else {
      if (req.session.returnTo) {
        var alert_message = 'You need to login before you can access!'
      }
      res.render('login', {
        title: 'Login',
        message: alert_message
      });
    }
  });

router.get('/test', function(req, res) {
  res.render('module', {
    recipient: 'Visal Sao',
    amount: 30
  });
});

router.get('/tutorials', ensureLoggedIn, function(req, res) {
  res.render('tutorials');
});


router.get('/contact_us', function(req, res) {
  res.render('contact_us', {
    user: req.user,
    env: env
  });
});

router.get('/history', ensureLoggedIn, function(request, response) {
  var userEmail = request.user.email;

  pool.query("SELECT * FROM transfer_logs WHERE sender = $1 OR recipient = $1 ORDER BY date DESC;", [userEmail], function(transferErr, transferHis) {
    if (transferErr) {
      console.error(transferErr);
      response.send("Error " + transferErr);
    } else {
      pool.query("SELECT * FROM exchange_list WHERE email = $1 ORDER BY timecreated DESC;", [userEmail], function(exchangeErr, exchangeHis) {
        if (exchangeErr) {
          console.error(exchangeErr);
          response.send("Error " + exchangeErr);
        } else {
          pool.query("SELECT * FROM account WHERE email = $1;", [userEmail], function(accountErr, accountResult) {
            if (accountErr) {
              response.send("Error " + accountErr);
            } else {
              for (var count = 0; count < transferHis.rows.length; count++) {
                transferHis.rows[count].userEmail = userEmail;
                transferHis.rows[count]
              }
              response.render('history', {
                data: accountResult.rows,
                transferHis: transferHis.rows,
                exchangeHis: exchangeHis.rows,
                accountInfo: accountResult.rows,
                user: request.user,
                userEmail: request.user.email
              });
            }
          });
        }
      });
    }
  });
});

router.get('/about_us', function(req, res) {
  // necessary to get the role of the user to find out what the menu should disp
  // if we store the user's role in cookies, no longer necessary to query the database
  if (req.user) {
    pool.query("SELECT * FROM account WHERE email = $1;",[req.user.email], function(err, result) {
      if (err) {
        console.error(err);
      } else {
        res.render('about_us', {
          user: req.user,
          data: result.rows
        });
      }
    });
  } else {
    res.render('about_us', {
      user: req.user
    });
  }
});

router.get('/tutorial', function(req, res) {
  // necessary to get the role of the user to find out what the menu should disp
  // if we store the user's role in cookies, no longer necessary to query the database
  if (req.user) {
    pool.query("SELECT * FROM account WHERE email = $1;", [req.user.email], function(err, result) {
      if (err) {
        console.error(err);
      } else {
        res.render('tutorial', {
          user: req.user,
          data: result.rows
        });
      }
    });
  } else {
    res.render('tutorial', {
      user: req.user
    });
  }
});

router.get('/settings', ensureLoggedIn, function(req, res) {
  pool.query("SELECT * FROM account WHERE email = $1;", [req.user.email], function(err, result) {
    if (err) {
      console.error(err);
    } else {
      res.render('settings', {
        user: req.user,
        data: result.rows
      });
    }
  });
});

router.post('/db', function(request, response) {
  var text = request.body.transfer;
  response.render('db', {
    transfer: text
  });
});

function sqlEscape(text) {
  return text.replace(/'/g, "''");
}


module.exports = router;