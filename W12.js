// WÜRFEL - Objekt
function WUERFEL(_s) {
	if (typeof _s == 'undefined') this.seiten=6;
	else this.seiten=_s;
	this.typ="W"+this.seiten;
	this.erg=this.seiten;
	this.rollCallback=function() {};
}

WUERFEL.prototype.rollRange = function(_von, _bis) {
	return Math.floor(Math.random()*(_bis-_von+1)+_von);
}

WUERFEL.prototype.roll = function() {
	this.erg=this.rollRange(1,this.seiten);
	this.rollCallback();
	return this.erg;
}

WUERFEL.prototype.json = function() {
	return "{TYP:"+this.typ+", ERG:"+this.erg+"}";
}

// WürfelBECHER - Objekt
function BECHER() {
	this.arr= [];
	this.rollCallback=function() {};
	this.Parser= new PARSER();
}
BECHER.prototype.add = function(_wuerfel) { this.arr.push(_wuerfel); }
BECHER.prototype.del = function(_wuerfel) { return this.arr.pop(); }
BECHER.prototype.clear = function() { this.arr=[]; }
BECHER.prototype.roll = function() {
	let erg=[];
	for (let i=0; i<this.arr.length; i++) {
		let wurf={};
		wurf.w=this.arr[i].roll();
		wurf.t=this.arr[i].typ;
		erg.push(wurf);
	}
	this.rollCallback(erg);
	return erg;
}
BECHER.prototype.json = function() {
	let erg="[";
	for (let i=0; i<this.arr.length; i++) {
		erg+=this.arr[i].json();
		if (i<this.arr.length-1) erg+=",";
	}
	erg+="]";
	return erg;
}
BECHER.prototype.parse = function(_mw) {
	if (typeof(_mw)!="undefined") this.Parser.Mindestwurf=_mw;
	return this.Parser.parse(this);
}

// WurfParser Template, kann/soll überschrieben werden
class PARSER {
	erg="";
	parse(_becher) {
		this.erg="<div class='werg'>";
		for (let i=0; i<_becher.arr.length; i++) {
			this.erg+="<span class='wuerfel "+_becher.arr[i].typ+"'>"+_becher.arr[i].erg+"</span>";
		}
		this.erg+="</div>";
		return this.erg;
	}
}

module.exports = {
	Becher:BECHER,
	Wuerfel:WUERFEL,
	Parser:PARSER
}