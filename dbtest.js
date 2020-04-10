var mongoose = require('mongoose');
var dbUrl ='mongodb://testuser:testpass@localhost/test';

mongoose.connect(dbUrl , (err) => { 
   console.log("mongodb connected",err);
});



var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("alles ok!");
});
