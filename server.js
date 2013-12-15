#!/usr/bin/env node

var express = require('express');
var cors = require('cors')
var mongojs = require('mongojs');

/**
 *  Key value store application.
 */
var KeyValApp = function() {

    //  Scope.
    var self = this;

    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.app_name  = process.env.OPENSHIFT_APP_NAME || 'keyval';
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };

    self.setupDatabase = function() {
    	self.db = mongojs(process.env.OPENSHIFT_MONGODB_DB_URL, [self.app_name])[self.app_name];
    }

    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating %s app ...', Date(Date.now()), sig, self.app_name);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()));
    };

    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };

    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.app = express();
        self.app.use(cors());
        self.app.use(express.bodyParser());

        self.app.get('/', function(req, res) {
            res.send('');
        });

        self.app.get('/:key', function(req, res) {
            self.db.find({_id: req.params.key}, {_id:0}, function(err, docs) {
                if (docs.length) {
                    res.send(docs[0]);
                }
                else {
                    res.status(404).send({error: 'Key not found', key: req.params.key});
                }
            }); 
        });

        self.app.post('/:key', function(req, res) {
            var data = req.body;
            data._id = req.params.key;
            self.db.save(data);
            
            res.send({result: 'OK'});
        });
    };

    /**
     *  Initializes the application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.setupDatabase();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };
};

/**
 *  main():  Main code.
 */
var app = new KeyValApp();
app.initialize();
app.start();

