function calculate(){

	var vin = 0;
	var vout = 0;
	var rload = 0;
	var rin = 0;
	var err = 0;
	document.getElementById("txt_results").innerHTML = "";

	var useAdvanced = false;
	if (document.getElementById("div_advanced").style.display != "none")
	{
		useAdvanced = true;
	}

	try {
		vin = parseFloat(document.getElementById("txt_inputVoltage").value);
		if (isNaN(vin)) {
			throw false;
		}
	}
	catch (ex) {
		document.getElementById("txt_results").innerHTML += "unable to parse input voltage\n";
		err = 1;
	}
	try {
		vout = parseFloat(document.getElementById("txt_outputVoltage").value);
		if (isNaN(vout)) {
			throw false;
		}
	}
	catch (ex) {
		document.getElementById("txt_results").innerHTML += "unable to parse output voltage\n";
		err = 1;
	}

	if (vin == 0 || vout == 0) {
		document.getElementById("txt_results").innerHTML += "unable to use 0 voltage\n";
		err = 1;
	}
	else if ((vin < 0 && vout > 0) || (vin > 0 && vout < 0)) {
		document.getElementById("txt_results").innerHTML += "unable to create negative divider\n";
		err = 1;
	}

	if (useAdvanced){
		try {
			var txt = document.getElementById("txt_outputLoad").value.trim().toLowerCase();
			if (txt.length <= 0) {
				rload = 0;
			}
			else if (txt.indexOf("inf") >= 0 || txt.indexOf("hi") >= 0) {
				rload = 0;
			}
			else {
				rload = parseResistance(txt);
				if (isNaN(rload)) {
					throw false;
				}
				if (rload < 0) {
					throw false;
				}
			}
		}
		catch (ex) {
			document.getElementById("txt_results").innerHTML += "unable to parse output load\n";
			err = 1;
		}

		try {
			var txt = document.getElementById("txt_inputResistance").value.trim().toLowerCase();
			if (txt.length <= 0) {
				rin = 0;
			}
			else {
				rin = parseResistance(txt);
				if (isNaN(rin)) {
					throw false;
				}
				if (rin < 0) {
					throw false;
				}
			}
		}
		catch (ex) {
			document.getElementById("txt_results").innerHTML += "unable to parse input resistance\n";
			err = 1;
		}
	}

	if (err != 0) {
		return;
	}

	vin = Math.abs(vin);
	vout = Math.abs(vout);
	var ratio = vout/vin;

	var r = 0;
	try {
		r = document.getElementById("txt_listOfResistors").value.split(/\s+/g);
	}
	catch (ex) {
		document.getElementById("txt_results").innerHTML += "unable to split resistor entries\n";
		return;
	}
	if (r.length <= 1) {
		document.getElementById("txt_results").innerHTML += "not enough values\n";
		return;
	}
	var vals = new Array();
	var valStrs = new Array();
	for (var i = 0; i < r.length; i++)
	{
		var x = 0;
		var s = r[i].trim();
		if (s.length <= 0) {
			continue;
		}
		try {
			x = parseResistance(r[i]);
		}
		catch (ex) {
			document.getElementById("txt_results").innerHTML += "unable to parse \"" + r[i] + "\"\n";
			continue;
		}
		if (x <= 0 || isNaN(x))
		{
			document.getElementById("txt_results").innerHTML += "unable to use value \"" + r[i] + "\"\n";
			continue;
		}
		vals.push(x);
		valStrs.push(s);
	}
	if (vals.length <= 1) {
		document.getElementById("txt_results").innerHTML += "not enough values\n";
		return;
	}
	var resultList = new Array();
	for (var i = 0; i < vals.length; i++)
	{
		var x = vals[i];
		for (var j = 0; j < vals.length; j++)
		{
			var y = vals[j];
			var ratioAsR1;
			var ratioAsR2;
			var diffAsR1;
			var diffAsR2;
			if (useAdvanced)
			{
				ratioAsR1 = vdiv(x + rin, parallel(y, rload));
				ratioAsR2 = vdiv(y + rin, parallel(x, rload));
			}
			else
			{
				ratioAsR1 = vdiv(x, y);
				ratioAsR2 = vdiv(y, x);
			}
			diffAsR1 = Math.abs(ratioAsR1 - ratio);
			diffAsR2 = Math.abs(ratioAsR2 - ratio);

			var resObj1 = { r1:valStrs[i] , r2:valStrs[j] , ratio:ratioAsR1 , diff:diffAsR1 };
			var resObj2 = { r1:valStrs[j] , r2:valStrs[i] , ratio:ratioAsR2 , diff:diffAsR2 };
			if (resultlist_contains(resultList, resObj1) == false) {
				resultList.push(resObj1);
			}
			if (resultlist_contains(resultList, resObj2) == false) {
				resultList.push(resObj2);
			}
		}
	}
	resultList.sort(function(a,b){
		return Math.abs(a.diff)-Math.abs(b.diff);
	});
	document.getElementById("txt_results").innerHTML += "results from best to worst:\n";
	for (var i = 0; i < resultList.length; i++) {
		document.getElementById("txt_results").innerHTML += "R1= " + resultList[i].r1 + " ; R2= " + resultList[i].r2 + " ; Vout= ";
		var nvout = resultList[i].ratio * vin;
		document.getElementById("txt_results").innerHTML += nvout.toFixed(8) + "V\n";
	}
}

var onclick_advanced_visible = false;
function onclick_advanced(){
	if(onclick_advanced_visible){
		var display ='none';
	} else {
		var display ='';
	}
	document.getElementById("div_advanced").style.display = display;
	onclick_advanced_visible = !onclick_advanced_visible;
}


function parseResistance(x) {
	x = x.trim().toLowerCase();
	var r = NaN;
	var m;
	var regex;

	regex = new RegExp("(\\d+)([kmr])(\\d+)", ["i"]);
	m = regex.exec(x);
	if (m != null)
	{
		r = parseFloat(m[1]);
		if (m[2] == "m")
		{
			r = m[1] + "." + m[3];
			r = parseFloat(m[1] + "." + m[3]);
			if (isNaN(r)) {
				return NaN;
			}
			return r * 1000000;
		}
		else if (m[2] == "k")
		{
			r = m[1] + "." + m[3];
			r = parseFloat(m[1] + "." + m[3]);
			if (isNaN(r)) {
				return NaN;
			}
			return r * 1000;
		}
		else if (m[2] == "r")
		{
			r = m[1] + "." + m[3];
			r = parseFloat(m[1] + "." + m[3]);
			if (isNaN(r)) {
				return NaN;
			}
			return r;
		}
	}
	regex = new RegExp("(\\d+)(\\s*)([kmr])", ["i"]);
	m = regex.exec(x);
	if (m != null)
	{
		r = parseFloat(m[1]);
		if (m[3] == "m")
		{
			r *= 1000000;
		}
		else if (m[3] == "k")
		{
			r *= 1000;
		}
		return r;
	}
	return parseFloat(x);
}

function resultlist_contains(list, obj) {
	for (var i = 0; i < list.length; i++) {
		if (list[i].r1.trim().toLowerCase() == obj.r1.trim().toLowerCase() && list[i].r2.trim().toLowerCase() == obj.r2.trim().toLowerCase()) {
			if (list[i].ratio == obj.ratio && list[i].diff == obj.diff) {
				return true;
			}
		}
	}
	return false;
}

function vdiv(r1, r2){
	return r2 / (r1 + r2);
}

function parallel(x, y){
	if (x == 0) {
		return y;
	}
	if (y == 0) {
		return x;
	}
	return (x * y) / (x + y);
}

