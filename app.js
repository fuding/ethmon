const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const express_logger = require('morgan');
const pug = require('pug');
const routes = require('./routes/index');
const app = express();
const sendmail = require('sendmail')();

var miners = require('./routes/miners');
var sentEmails = {"low_hashrate": [], "rig_offline": []}; // Lists of rigs with problems

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express_logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Make miner data accessible to the router
app.use(function(req, res, next) {
    req.json = {
        "cors_anywhere_host" : config.cors_anywhere_host,
        "wallet"             : config.wallet,
	    "explorer"           : config.explorer,
        "title"              : config.title,
        "animation"          : config.animation,
        "header"             : config.header ? config.header : config.title,
        "miners"             : miners.json,
        "refresh"            : config.web_refresh,
        "tolerance"          : config.tolerance,
        "temperature"        : config.temperature,
        "hashrates"          : config.hashrates,
        "updated"            : moment().format("YYYY-MM-DD HH:mm:ss")
    };
    next();
});

app.use('/', routes);
app.use('/miners', miners);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handlers

// Development error handler will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// Production error handler, no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;

// --------------- BOOT ---------------

const config = require('./config.json');

const log4js = require('log4js');
const logger = log4js.getLogger();
logger.setLevel(config.log_level ? config.log_level : 'INFO');

// Send warning to Email function
function warningSend(subject, html, rig, warningType) {
    if (config.notifications_email && sentEmails[warningType].indexOf(rig) == -1) { 
        sendmail({
            from: 'bot@' + config.email_domain,
            to: config.notifications_email,
            subject: subject,
            html: html,
        }, function(err, reply) {
            console.log(err && err.stack);
            console.dir(reply);
        });
        sentEmails[warningType].push(rig);
    }
}

logger.warn('app: booting');

// --------------- /BOOT ---------------

// --------------- REQUESTER ---------------

const net = require('net');
const moment = require('moment');
require("moment-duration-format");

var miners = [];
miners.json = [];

logger.info('config: ' + config.miners.length + ' rig(s) configured');

config.miners.forEach(function(item, i, arr) {
    logger.trace(item.name + ': config[' + i + ']');

    // settings
    var m = miners[i] = {};
    var c = config.miners[i];
    var j = miners.json[i];

    m.name = c.name;
    m.host = c.host;
    m.port = c.port;
    m.poll = (typeof c.poll !== 'undefined') ? c.poll : config.miner_poll;
    m.timeout = (typeof c.timeout !== 'undefined') ? c.timeout : config.miner_timeout;

    function hostname() {
        return c.hostname ? c.hostname : (m.host + ':' + m.port);
    }

    // stats
    m.reqCnt = 0;
    m.rspCnt = 0;

    // it was never seen and never found good yet
    c.last_seen = null;
    c.last_good = null;

    // socket
    m.socket = new net.Socket()

    .on('connect', function() {
        logger.info(m.name + ': connected to ' + m.socket.remoteAddress + ':' + m.socket.remotePort);
        var req = '{"id":0,"jsonrpc":"2.0","method":"miner_getstat1"}';
        ++m.reqCnt;
        logger.trace(m.name + ': req[' + m.reqCnt + ']: ' + req);
        m.socket.write(req + '\n');
        m.socket.setTimeout(m.timeout);
    })

    .on('timeout', function() {
        logger.warn(m.name + ': response timeout');
        m.socket.destroy();
        miners.json[i] = {
            "name"      : m.name,
            "host"      : hostname(),
            "uptime"    : "",
            "eth"       : "",
            "eth_hr"    : "",
            "temps"     : "",
            "pools"     : "",
            "ver"       : "",
            "target_eth": "",
            "comments"  : c.comments,
            "offline"   : c.offline,
            "warning"   : null,
            "error"     : 'Error: no response',
            "last_seen" : c.last_seen ? c.last_seen : 'never'
        };
        warningSend('Rig ' + m.name + ' is offline!', miners.json[i].error, i, 'rig_offline');
    })

    .on('data', function(data) {
        ++m.rspCnt;
        logger.trace(m.name + ': rsp[' + m.rspCnt + ']: ' + data.toString().trim());
        c.last_seen = moment().format("YYYY-MM-DD HH:mm:ss");
        m.socket.setTimeout(0);
        var d = JSON.parse(data);

        // Add connection button
        if (c.connect_url != undefined) {
            var conn_url = '<br><a href=' + '"' + c.connect_url + '"' + 'target="_blank"><button>Connect</button></a>';
        } else {
            var conn_url = '';
        }
        miners.json[i] = {
            "name"       : m.name,
            "host"       : hostname() + conn_url,
            "uptime"     : moment.duration(parseInt(d.result[1]), 'minutes').format('d [days,] hh:mm'),
            "eth"        : d.result[2],
            "eth_hr"     : d.result[3],
            "temps"      : d.result[6],
            "pools"      : d.result[7],
            "ver"        : d.result[0],
            "target_eth" : c.target_eth,
            "comments"   : c.comments,
            "offline"    : c.offline,
            "ti"         : c.ti ? c.ti : null,
            "error"      : null
        };
	m.socket.destroy();
	var wIndex = sentEmails['rig_offline'].indexOf(i);
        if (wIndex != -1) { sentEmails['rig_offline'].splice(wIndex, wIndex); };
        if (c.target_eth && config.tolerance) {
            if (miners.json[i].eth.split(';')[0] / 1000 < c.target_eth * (1 - config.tolerance / 100)) {
                miners.json[i].warning = 'Low hashrate';
                miners.json[i].last_good = c.last_good ? c.last_good : 'never';
                warningSend('Low hashrate on rig ' + i + '!', 'Last good: ' + miners.json[i].last_good, i, 'low_hashrate');
            } else {
                miners.json[i].warning = null;
                c.last_good = moment().format("YYYY-MM-DD HH:mm:ss");
                var wIndex = sentEmails['low_hashrate'].indexOf(i);
                if (wIndex != -1) { sentEmails['low_hashrate'].splice(wIndex, wIndex); };
            }
        }
    })

    .on('close', function() {
        logger.info(m.name + ': connection closed');
        setTimeout(poll, m.poll);
    })

    .on('error', function(e) {
        logger.error(m.name + ': socket error: ' + e.message);
        miners.json[i] = {
            "name"       : m.name,
            "host"       : hostname(),
            "uptime"     : "",
            "eth"        : "",
            "eth_hr"     : "",
            "temps"      : "",
            "pools"      : "",
            "ver"        : "",
            "target_eth" : "",
            "comments"   : c.comments,
            "offline"    : c.offline,
            "warning"    : null,
            "error"      : e.name + ': ' + e.message,
            "last_seen"  : c.last_seen ? c.last_seen : 'never'
        };
        warningSend('Rig ' + m.name + ' is offline!', miners.json[i].error, i, 'rig_offline');
    });

    function poll() {
        m.socket.connect(m.port, m.host);
    }

    if ((typeof c.offline === 'undefined') || !c.offline) {
        poll();
    } else {
        miners.json[i] = {
            "name"       : m.name,
            "host"       : hostname(),
            "uptime"     : "",
            "eth"        : "",
            "eth_hr"     : "",
            "temps"      : "",
            "pools"      : "",
            "ver"        : "",
            "target_eth" : "",
            "comments"   : c.comments,
            "offline"    : c.offline,
            "error"      : null
        };
    }
});

// --------------- /REQUESTER ---------------
