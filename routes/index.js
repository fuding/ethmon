const express = require('express');
const router = express.Router();

// GET home page
router.get('/', function(req, res, next) {
    res.render('index', {
                            title: req.json.title,
                            header: req.json.header,
                            hashrates: req.json.hashrates,
                            wallet: req.json.wallet,
                            cors_anywhere_host: req.json.cors_anywhere_host,
			    explorer: req.json.explorer
                        });
});

module.exports = router;
