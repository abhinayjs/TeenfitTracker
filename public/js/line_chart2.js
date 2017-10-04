function draw_lineChart(data){
	var margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

	var parseDate = d3.time.format("%Y-%m-%d").parse;

	var x = d3.time.scale()
	    .range([0, width]);

	var y = d3.scale.linear()
	    .range([height, 0]);

	var color = d3.scale.ordinal().range(["#d03c98", "#3c98d0"]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left");
	var PALTypes = [];
    PALTypes[0] = "PAL";
    PALTypes[1] = "schePAL";

	var line = d3.svg.line()
	    .x(function(d) { return x(d.date); })
	    .y(function(d) { return y(d.PAL); });

	var svg = d3.select("#line_view")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	  data.forEach(function(d) {
	    d.date = parseDate(d.date);
	  });
	 //  data.forEach(function(d){
		//   d.PALs = PALTypes.map(function(name){
		//     return {name:name, value: +d[name]};
		//   });
		// });

	  var goalScores = PALTypes.map(function(name) {
	    return {
	      name: name,
	      values: data.map(function(d) {
	        return {date: d.date, PAL: +d[name]};
	      })
	    };
	  });
	  alert(PALTypes);

	  x.domain(d3.extent(data, function(d) { return d.date; }));

	  y.domain([
	    d3.min(goalScores, function(c) { return d3.min(c.values, function(v) { return v.PAL; }); }),
	    d3.max(goalScores, function(c) { return d3.max(c.values, function(v) { return v.PAL; }); })
	  ]);

	  // y.domain(d3.extent(data, function(d) { return d.PAL; }));

	  svg.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis);

	  svg.append("g")
	      .attr("class", "y axis")
	      .call(yAxis)
	    .append("text")
	      .attr("transform", "rotate(-90)")
	      .attr("y", 6)
	      .attr("dy", ".71em")
	      .style("text-anchor", "end")
	      .text("Goal Scores");

	  var goalScore = svg.selectAll(".goalScore")
	      .data(goalScores)
	    .enter().append("g")
	      .attr("class", "goalScore");

	  goalScore.append("path")
	      .attr("class", "line")
	      .attr("d", function(d) { return line(d.values); })
	      .style("stroke", function(d) { return color(d.name); });

	  goalScore.append("text")
	      .datum(function(d) { return {name: d.name, value: d.values[d.values.length - 1]}; })
	      .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.PAL) + ")"; })
	      .attr("x", 3)
	      .attr("dy", ".35em")
	      .text(function(d) { return d.name; });

	  goalScore.selectAll("circle")
	    .data(function(d){return d.values})
	    .enter()
	    .append("circle")
	    .attr("r", 3)
	    .attr("cx", function(d) { return x(d.date); })
	    .attr("cy", function(d) { return y(d.PAL); })
	    .style("fill", function(d,i,j) { return color(goalScores[j].name); });

	
}