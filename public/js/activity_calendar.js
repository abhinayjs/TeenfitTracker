function get_today()
{
    var dt = new Date();
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 6, 0, 0);
}

function get_first_day_of_month(month, year)
{
    var firstDayOfMonth = new Date(year,month,1, 6, 0, 0); // take the first day of the year.
	return firstDayOfMonth;
}

function get_total_days_in_month(month, year)
{
    var _DaysOfMonth = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
    var dt = new Date();
	if ( month < 0 || month > 11 ) return 0;
	if ( year < 0 || year > dt.getFullYear() + 100 ) return 0;
	
	var rem = year % 4;
	if ( rem == 0 && month == 1 ) return 29;
	
	return _DaysOfMonth[month];
}

function get_last_day_of_month(month, year)
{
    var lastDayOfMonth = new Date(year, month, get_total_days_in_month(), 6, 0, 0);
    return lastDayOfMonth;
}

function write_header(month, year, monthName)
{
    var dt = new Date();
    
    var y1 = year-1;
    var m1 = month;
    
    var y2 = year;
    var m2 = month-1;
    if ( m2 < 0 ) { --y2; m2 = 11; }
    
    var y3 = year;
    var m3 = month+1;
    if ( m3 > 11 ) { ++y3; m3 = 0; }
    
    var y4 = year+1;
    var m4 = month;
        
    var htmlContent = "";
    htmlContent += "<TR height=100 width=500>";
    htmlContent += "<TD><A href='#' onClick='javascript:write_calendar(\"monthly_view\", " + m1 + ", " + y1 + ");'><B>&lt;&lt;</B></A></TD>";
    htmlContent += "<TD><A href='#' onClick='javascript:write_calendar(\"monthly_view\", " + m2 + ", " + y2 + ");'><B>&lt;</B></A></TD>";
    htmlContent += "<TD colspan=3 align=center><B>" + monthName + " " + year + "</B></TD>";
    htmlContent += "<TD><A href='#' onClick='javascript:write_calendar(\"monthly_view\", " + m3 + ", " + y3 + ");'><B>&gt;</B></A></TD>";
    htmlContent += "<TD><A href='#' onClick='javascript:write_calendar(\"monthly_view\", " + m4 + ", " + y4 + ");'><B>&gt;&gt;</B></A></TD";
    htmlContent += "</TR>";
    
    htmlContent += "<TR><TD><B>Sun</B></TD><TD><B>Mon</B></TD><TD><B>Tue</B></TD><TD><B>Wed</B></TD><TD><B>Thu</B></TD><TD><B>Fri</B></TD><TD><B>Sat</B></TD></TR>";
    
    return htmlContent;
}

var _wom = {};

function WomExists()
{
	this.value = false;
}

function Wom()
{
	this.dbValue = 0;
	this.changed = false;
	this.updatedValue = 0; 
}

function get_wom(day, month, year, exists)
{
	exists.value = false;
	
	if (_wom[year] == null) return 0;
	if (_wom[year][month] == null) return 0;
	
	var wom = _wom[year][month][day];
	if ( wom == null ) return 0;

	exists.value = true;
	
	if ( wom.changed ) return wom.updatedValue;
	
	return wom.dbValue;
}

function save_wom(inputEle, day, month, year, currentWOM)
{
    var tbValue = parseInt(inputEle.value);
    if ( tbValue == NaN ) return;
    if ( tbValue == currentWOM ) return;

    if (_wom[year] == null) _wom[year] = {};
    if (_wom[year][month] == null) _wom[year][month] = {};
    if (_wom[year][month][day] == null) _wom[year][month][day] = new Wom();
    
    _wom[year][month][day].changed = true;
    _wom[year][month][day].updatedValue = tbValue;

    var divEle = inputEle.parentNode;
    var tdEle = divEle.parentNode;
    
    tdEle.innerHTML = "<DIV style=\"background:orange;border:1px dotted black;\" onClick='javascript:write_text_box(this, " + day + ", " + month + ", " + year + ", " + tbValue + ");'><B>" + day + "</B><BR/><SUB>" + tbValue
			+ "</SUB></DIV><DIV><A href=\"#\" onClick=\"javascript:revert_wom_change(this, " +  day + ", " + month + ", " + year + ");\">x</A></DIV>";
}

function revert_wom_change(aEle, day, month, year)
{
    if (_wom[year] == null) return;
    if (_wom[year][month] == null) return;

	var wom = _wom[year][month][day];
	if ( wom == null ) return;
	
	wom.changed = false;
	wom.updatedValue = 0;
	
	if ( wom.dbValue == 0 )
		_wom[year][month][day] = null;

    var divEle = aEle.parentNode;
    var tdEle = divEle.parentNode;
    
    tdEle.innerHTML = "<DIV onClick='javascript:write_text_box(this, " + day + ", " + month + ", " + year + ", " + wom.dbValue + ");'><B>" + day + "</B><BR/><SUB>" + wom.dbValue
			+ "</SUB></DIV><DIV><A href=\"#\" onClick=\"javascript:revert_wom_change(this, " +  day + ", " + month + ", " + year + ");\">x</A></DIV>";
}

function erase_db_wom(aEle, day, month, year)
{
	alert('hi');
}

function save_wom_if_text_modified_at_least_once(inputEle, day, month, year, currentWOM)
{
	if (inputEle == null) return;
	
    var divEle = inputEle.parentNode;
    if (divEle == null) return;
    
    var tdEle = divEle.parentNode;
    if (tdEle == null) return;

    if (_wom[year] == null || _wom[year][month] == null || _wom[year][month][day] == null)
	{
    	tdEle.innerHTML = "<DIV onClick=\"javascript:write_text_box(this, " + day + ", " + month + ", " + year + ", " + currentWOM + ");\"><B>" + day + "</B><BR/><SUB>" + currentWOM + "</SUB></DIV>" 
    			+ "<DIV><A href=\"#\" onClick=\"javascript:revert_wom_change(this, " +  day + ", " + month + ", " + year + ");\">x</A></DIV>";
    	return;
	}
    
    var tbValue = parseInt(inputEle.value);
    if ( tbValue == NaN || tbValue == currentWOM )
    {
    	tdEle.innerHTML = "<DIV onClick=\"javascript:write_text_box(this, " + day + ", " + month + ", " + year + ", " + currentWOM + ");\"><B>" + day + "</B><BR/><SUB>" + currentWOM + "</SUB></DIV>"
    			+ "<DIV><A href=\"#\" onClick=\"javascript:revert_wom_change(this, " +  day + ", " + month + ", " + year + ");\">x</A></DIV>";
    	return;
    }

    save_wom(inputEle, day, month, year, currentWOM);
}
    
function write_text_box(divEle, day, month, year, currentWOM)
{
    var textBoxId = "wom_" + day + "_" + (month+1) + "_" + year;
    var paramsWithTextBoxId = textBoxId + "', " + day + ", " + (month+1) + ", " + year + ", " + currentWOM;
    

	    divEle.innerHTML = "<B>"
			+ day
			+ "</B><BR/>&nbsp;<INPUT class=\"wom_input\" type=text size=3 id=\"" + textBoxId + "\" name=\"" + textBoxId + "\" value=\"" + currentWOM
        + "\"  onChange=\"javascript:save_wom(this, " +  day + ", " + month + ", " + year + ", " + currentWOM + ");\""
        + " onBlur=\"javascript:save_wom_if_text_modified_at_least_once(this, " +  day + ", " + month + ", " + year + ", " + currentWOM + ");\""
        + " style=\"color:#000000;\"/>"
    document.getElementById(textBoxId).focus();
    document.getElementById(textBoxId).select();
}

function write_calendar(divId, month, year)
{
	var dt = new Date();
	var oldestDatePossible = new Date(dt.getFullYear()-21, dt.getMonth(), 1, 6, 0, 0);
	var latestDatePossible = new Date(dt.getFullYear()+21, dt.getMonth(), 1, 6, 0, 0);
	
	var currentDateRequested = new Date(year, month, 1, 6, 0, 0);
        if (currentDateRequested < oldestDatePossible) { return; }
        if (currentDateRequested > latestDatePossible) { return; }
	
    var _MonthNames = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November','December');

    var htmlContent = "<TABLE class=\"monthly_activity_table\">";
    htmlContent += write_header(month, year, _MonthNames[month]);
    
    var numDaysInMonth = get_total_days_in_month(month, year);
    var firstDayOfMonth = get_first_day_of_month(month, year);
    var firstDayIndex = firstDayOfMonth.getDay(); // gets the index of the day (0-Monday,1-Tuesday, ... 6-Sunday)

    htmlContent += "<TR>";

    // write empty spaces for the first week
    var dayIndex = firstDayOfMonth.getDay(); // gets the index of the day (0-Monday,1-Tuesday, ... 6-Sunday)
    for ( var i = 0; i < dayIndex; ++i )
    {
        htmlContent += "<TD width=\"14%\">&nbsp;</TD>";
    }

    // write the first row days
    var currentDay = 1;
    for ( ; dayIndex < 7; ++dayIndex, ++currentDay )
    {
    	var womExists = new WomExists();
    	var wom = get_wom(currentDay, month, year, womExists);
    	if ( !womExists.value )
    	{
    		htmlContent += "<TD><DIV onClick=\"javascript:write_text_box(this, " + currentDay + ", " + month + ", " + year + ", " + wom + ");\"><B>" + currentDay + "</B>";
            htmlContent += "<BR/><SUB>" + wom + "</SUB></DIV><DIV><A href=\"#\" onClick=\"javascript:erase_db_wom(this, " +  currentDay + ", " + month + ", " + year + ");\">x</A></SUB></DIV></TD>";
    	}
    	else
    	{
    		htmlContent += "<TD><DIV style=\"background:orange;border:1px dotted black;\" onClick='javascript:write_text_box(this, " + currentDay + ", " + month + ", " + year + ", " + wom + ");'><B>" + currentDay + "</B>";
            htmlContent += "<BR/><SUB>" + wom + "</SUB></DIV><DIV><A href=\"#\" onClick=\"javascript:revert_wom_change(this, " +  currentDay + ", " + month + ", " + year + ");\">x</A></SUB></DIV></TD>";
    	}
    }
    
    // write subsequent days
    while ( currentDay <= numDaysInMonth )
    {
        htmlContent += "</TR>";
        htmlContent += "<TR>";
        for ( dayIndex = 0; dayIndex < 7 && currentDay <= numDaysInMonth; ++dayIndex, ++currentDay )
        {
        	var womExists = new WomExists();
        	var wom = get_wom(currentDay, month, year, womExists);
        	if ( !womExists.value )
        	{
        		htmlContent += "<TD><DIV onClick=\"javascript:write_text_box(this, " + currentDay + ", " + month + ", " + year + ", " + wom + ");\"><B>" + currentDay + "</B>";
                htmlContent += "<BR/><SUB>" + wom + "</SUB></DIV><DIV><A href=\"#\" onClick=\"javascript:erase_db_wom(this, " +  currentDay + ", " + month + ", " + year + ");\">x</A></SUB></DIV></TD>";
        	}
        	else
        	{
        		htmlContent += "<TD><DIV style=\"background:orange;border:1px dotted black;\" onClick='javascript:write_text_box(this, " + currentDay + ", " + month + ", " + year + ", " + wom + ");'><B>" + currentDay + "</B>";
                htmlContent += "<BR/><SUB>" + wom + "</SUB></DIV><DIV><A href=\"#\" onClick=\"javascript:revert_wom_change(this, " +  currentDay + ", " + month + ", " + year + ");\">x</A></DIV></TD>";
        	}
        }
    }
    
    // write last week filler
    while ( dayIndex % 7 != 0 )
    {
        htmlContent += "<TD>&nbsp;</TD>";
        ++dayIndex;
    }

    htmlContent += "</TR>";
    htmlContent += "</TABLE>";
    
    document.getElementById(divId).innerHTML = htmlContent;
}
