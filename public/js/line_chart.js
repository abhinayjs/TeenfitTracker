function draw_line_chart(data,goals)
{
    var margin = {top: 40, right: 20, bottom: 80, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    
    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    var line = d3.svg.line()
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.PAL); });

    var color = d3.scale.ordinal().range(["#3c98d0","#d03c98"]);
    var svg = d3.select("#line_view")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text("Line Chart");
    
    var dateFormat = d3.time.format("%Y-%m-%d");
    
    data.forEach(function(d) {
        d.date = dateFormat.parse(d.date);
        d.PAL = +d.PAL;
    });
      
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain(d3.extent(data, function(d) { return d.PAL; }));
  
    svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
            .style("text-anchor","end")
            .attr("dx","-.8em")
            .attr("dy",".15em")
            .attr("transform","rotate(-30)");

    svg.append("g").attr("class", "y axis")
        .call(yAxis)
    .append("text").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Goal Scores");
    
    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);
        

    goals.forEach(function(d) {
        d.date = dateFormat.parse(d.date);
        d.goal = +d.goal;
    });
    
    svg.selectAll("dot")
        .data(goals)
        .enter().append("circle")
            .attr("r", 3.5)
            .attr("cx", function(d) { return x(d.date); })
            .attr("cy", function(d) { return y(d.goal); })
            .style("fill", function(d) { return "#d03c98"; });

    var legendStr = [];
    legendStr[0] = "Milestones";
    legendStr[1] = "Actual Scores";
    var legend = svg.selectAll(".legend")
      .data(legendStr.slice().reverse())
      .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(function(d) { return d; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color); 
}