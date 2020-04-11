// NodeJS Erweiterungen
let express = require('express');
let app = express();
let bodyParser = require('body-parser')
let http = require('http').Server(app);
// Websocket Spass
let io = require('socket.io')(http);
// MongoDB Binding
let mongoose = require('mongoose');

// Eigenes
let W12=require('./W12.js');
let SETTINGS=require('./ChatParameter.js').Settings;
let HILFE=require('./ChatParameter.js').Hilfe;

// Init
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

// Settings
const dbUrl = "mongodb://testuser:testpass@localhost/test";

let Message = mongoose.model('Message',{
	name : String,
	message : String,
	zeitpunkt: Date
})

// Exalted Würfelparsing überschreibt vanilla Parsingfunktion
class ExaltedParser extends W12.Parser {
	parse(_becher) {
		this.erfolge=0;
		this.zehner=0;
		this.einser=0;
		this.erg="<div class='werg'>";
		for (let i=0; i<_becher.arr.length; i++) {
			let erfolg="";
			if (parseInt(_becher.arr[i].erg)>=7) { erfolg="erfolg"; this.erfolge++; }
			if (parseInt(_becher.arr[i].erg)==10) { erfolg="supererfolg"; this.erfolge++; this.zehner++; }
			if (parseInt(_becher.arr[i].erg)==1) { erfolg="einser"; this.einser++; }
			this.erg+="<span class='wuerfel "+erfolg+" "+_becher.arr[i].typ+"'>"+_becher.arr[i].erg+"</span>";
		}
		this.erg+="</div>";
		this.botch="";
		if (this.erfloge==0 && this.einser>0) this.botch=" <b>Sauber gebotched, Sir Botchalot!</b>";
		this.erg+='<p>Erfolge: '+this.erfolge+' ('+(this.erfolge-this.zehner)+')'+this.botch+'</p>';
		return this.erg;
	}
}

// Kommando Parsing
function parseMessage(req) {
	if (req.body.message.includes('!(') && req.body.message.includes(')')) {
		let inhalt = req.body.message.split('!(')[1].split(')')[0];

		if (inhalt.includes('GAME')) {
			req.name="<span class='whispers'>Whisper from the Abyss:</span>";
			req.body.message="<b>YOU JUST LOST THE GAME</b>";
		}
		else if (inhalt.includes('DAY')) {
			req.body.message="<img src='/dox/DayCasteSmall.png'>";
		}
		else if (inhalt.includes('PURGE')) {
			req.body.message="Der kleine Prinz ist nun sauber!";
			Message.deleteMany({}, () => { });
		}
		else if (inhalt.includes('HILFE')) {
			req.body.message=JSON.stringify(HILFE);
		}
		else if (inhalt.includes('SETTINGS')) {
			req.body.message=JSON.stringify(SETTINGS);
		}
		else if (inhalt.includes('{') && inhalt.includes('}')) {
			let json = JSON.parse(inhalt);
			SETTINGS=Object.assign(SETTINGS, json);
			req.body.message=JSON.stringify(SETTINGS);
		}   
		// !(NdW) - Würfle N dW ...
		// TODO: sauberes PatternMatching
		else if (inhalt.includes('d')) {
			let anzahl=inhalt.split('d')[0];
			let wuerfel=inhalt.split('d')[1];
			let becher=new W12.Becher();
			for (let i=0; i<anzahl; i++) becher.add(new W12.Wuerfel(wuerfel));
			becher.roll();
			// Ab hier Exaltedspezifisch
			let exaltedParser=new ExaltedParser();
			let vanillaParser=new W12.Parser();
			let ergebnis="";
			if (wuerfel=="10") ergebnis=exaltedParser.parse(becher); 
			else ergebnis=vanillaParser.parse(becher); 
			req.body.message=req.body.message.replace('!('+inhalt+')',ergebnis);
		}
	}
}
// Kommando Parsing Ende

// DB-Binding GET:
app.get('/messages', (req, res) => {
	Message.find({},(err, messages) => { res.send(messages); });
});

// DB-Bindinge POST:
app.post('/messages', (req, res) => {
	parseMessage(req);
	let message = new Message(req.body);
	message.save((err) => {
		if(err) sendStatus(500);
		io.emit('message', req.body); // Websocket Rückmeldung
		res.sendStatus(200);
	});
});

io.on('connection', () => { console.log('Neuer Client verbunden...'); });
mongoose.connect(dbUrl ,{ useNewUrlParser: true, useUnifiedTopology: true }, (err) => { console.log('mongodb verbunden, Fehler: ',err); });
let server = http.listen(3000, () => { console.log('Server läuft auf Port: ', server.address().port); });