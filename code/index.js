var express = require('express');
var proxy = require('express-http-proxy');
var cookiejar = require('cookiejar');

var handler = require('./src/handler');
var log = require('./src/log');
var routes = require('./src/routes.json')
    .filter(route => !process.env.VIEW || process.env.VIEW === route.view);

// Create server
var app = express();
app.disable('x-powered-by');

// Server setup
//app.use(log());

// Bind routes
routes.forEach(route => {
    app.get(route.pattern, handler(route));
});

app.use('/', express.static(__dirname + '/scratch-www/build'));

//app.get('/projects/editor', function(req, res) {
  //res.redirect('/projects/editor');
//  res.send("nonono");
//});

var middlewareOptions = {};
if (process.env.USE_DOCKER_WATCHOPTIONS) {
    middlewareOptions = {
        watchOptions: {
            aggregateTimeout: 500,
            poll: 2500,
            ignored: ['node_modules', 'build']
        }
    };
}


var proxyHost = process.env.FALLBACK || '';
console.log('Proxy', proxyHost);
if (proxyHost !== '') {
    // Fall back to scratchr2 in development
    // This proxy middleware must come last
    app.use('/', proxy(proxyHost));
}

var mainProxy = proxy('scratch.mit.edu', {
  https: true,
  changeOrigin: true,

  proxyReqPathResolver: function(req, res) {
      //console.log(req.originalUrl)
      return req.originalUrl;
  },

  proxyErrorHandler: function(err, res, next) {
    //console.log(res);
    next(err);
  },

  proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
    // console.log(proxyReqOpts);
    // console.log(srcReq);
    //console.log(proxyReqOpts.headers['referer']);
    proxyReqOpts.headers['referer'] = 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted';
    //proxyReqOpts.headers['cookie'] = '_ga=GA1.3.56049463.1551923197; _gid=GA1.3.1267038613.1551923197; scratchcsrftoken=BC1zZfGtcgBAfbc9MfOIdQsSFIfEVZe0; permissions=%7B%7D';
    proxyReqOpts.headers['x-requested-with'] = 'XMLHttpRequest';

    return proxyReqOpts;
  },

  userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
    //
    //console.log(proxyReq);
    //console.log(headers);
    const setCookieHeaders = proxyRes.headers['set-cookie'] || []
    let modifiedSetCookieHeaders = setCookieHeaders
      .map(str => new cookiejar.Cookie(str))
      .map(cookie => {
        if (cookie.path && cookie.path[0] === '/') {
          cookie.path = `/api${cookie.path}`
        }
    //console.log(cookie);
    cookie.domain = undefined;
    cookie.explicit_domain = false;
    cookie.secure = false;
    cookie.path = '/';
    cookie.explicit_path = true;
        return cookie
      })
      .map(cookie => cookie.toString())
    modifiedSetCookieHeaders.push('abcd=123');
    //console.log(modifiedSetCookieHeaders);
    //modifiedSetCookieHeaders=['a=3'];

    headers['set-cookie'] = modifiedSetCookieHeaders;
    //headers['set-cookie'] = 'a=3';
    //headers['set-cookiea'] = 'ab=3';
    //headers['set-cookiea'] = 'ab=3';
    //headers['set-cookie'] = 'd=3';

    headers['Access-Control-Allow-Origin'] = '*';
    //headers['Access-Control-Allow-Credentials'] = 'true';
    return headers;
  }
});

app.use('/csrf_token', mainProxy);
app.use('/accounts', mainProxy);
app.use('/session', mainProxy);
app.use('/internalapi', mainProxy);


var projectsProxy = proxy('projects.scratch.mit.edu', {
  https: true,
  changeOrigin: true,

  proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
    // console.log(proxyReqOpts);
    // console.log(srcReq);
    console.log(proxyReqOpts.headers['referer']);
    proxyReqOpts.headers['referer'] = 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted';
    //proxyReqOpts.headers['cookie'] = '_ga=GA1.3.56049463.1551923197; _gid=GA1.3.1267038613.1551923197; scratchcsrftoken=BC1zZfGtcgBAfbc9MfOIdQsSFIfEVZe0; permissions=%7B%7D';
    //proxyReqOpts.headers['x-requested-with'] = 'XMLHttpRequest';
    proxyReqOpts.headers['Content-Type'] = 'application/json';

    return proxyReqOpts;
  }
});

app.use('/projects-proxy', projectsProxy);


var apiProxy = proxy('api.scratch.mit.edu', {
  https: true,
  changeOrigin: true,

  //proxyReqPathResolver: function(req, res) {
  //  console.log(req.originalUrl)
  //  return req.originalUrl.replace(/\/api-proxy/, '');
  //},


  proxyReqOptDecorator: function(proxyReqOpts, srcReq) {
    // console.log(proxyReqOpts);
    // console.log(srcReq);
    console.log(proxyReqOpts.headers['referer']);
    proxyReqOpts.headers['referer'] = 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted';
    //proxyReqOpts.headers['cookie'] = '_ga=GA1.3.56049463.1551923197; _gid=GA1.3.1267038613.1551923197; scratchcsrftoken=BC1zZfGtcgBAfbc9MfOIdQsSFIfEVZe0; permissions=%7B%7D';
    //proxyReqOpts.headers['x-requested-with'] = 'XMLHttpRequest';
    proxyReqOpts.headers['Content-Type'] = 'application/json';

    return proxyReqOpts;
  }
});

app.use('/api-proxy', apiProxy);



// Start listening
var port = process.env.PORT || 8333;
app.listen(port, function () {
    process.stdout.write('Server listening on port ' + port + '\n');
    if (proxyHost) {
        process.stdout.write('Proxy host: ' + proxyHost + '\n');
    }
});
