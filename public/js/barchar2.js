
function type(d) {
  d.frequency = +d.frequency;
  return d;
}
function draw_barChart(data,flag)
{
    var margin = {top: 40, right: 20, bottom: 80, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var formatPercent = d3.format("");
    var PALTypes = [];
    PALTypes[0] = "PAL";
    PALTypes[1] = "schePAL";
    var x0 = d3.scale.ordinal().rangeRoundBands([0, width], .1);
    var x1 = d3.scale.ordinal();

    var y = d3.scale.linear().range([height, 0]);
    data.forEach(function(d){
      d.PALs = PALTypes.map(function(name){
        return {name:name, value: d[name]};
      });
    });

    var color = d3.scale.ordinal().range(["#98abc5", "#8a89a6"]);

    var xAxis = d3.svg.axis()
    .scale(x0)
    .orient("bottom");

    var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(d3.format(".2s"));

    var svg = d3.select("#barChartWeekly").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom)
              .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
              svg.append("text")
              .attr("x", (width / 2))             
              .attr("y", 0 - (margin.top / 2))
              .attr("text-anchor", "middle")  
              .style("font-size", "16px") 
              .style("text-decoration", "underline")  
              .text("Weekly Chart");
    
        x0.domain(data.map(function(d) { return d.date; }));
        x1.domain(PALTypes).rangeRoundBands([0, x0.rangeBand()]);
        y.domain([0, d3.max(data, function(d) { return d3.max(d.PALs, function(d) { return d.value; }); })]);
        
        svg = d3.select("#barChartWeekly").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text("Weekly Chart");

       svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

        svg.append("g").
        attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Total Scores");
      var date = svg.selectAll(".date")
      .data(data)
      .enter().append("g")
      .attr("class", "date")
      .attr("transform", function(d) { return "translate(" + x0(d.date) + ",0)"; });

      date.selectAll("rect")
      .data(function(d) { return d.PALs; })
      .enter().append("rect")
      .attr("width", x1.rangeBand())
      .attr("x", function(d) { return x1(d.name); })
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); })
      .style("fill", function(d) { return color(d.name); });
      
      // var date = svg.selectAll(".date").data(data)
      //     .enter().append("rect")
      //     .attr("class", "bar")
      //     .attr("x", function(d) { return x0(d.date); })
      //     .attr("width", x.rangeBand())
      //     .attr("y", function(d) { return y(d.PAL); })
      //   .attr("height", function(d) { return height - y(d.PAL); })
      //   .style({fill: "#2c8cd9"});

   
 
    
 
    
    // svg.call(tip);
    

    

    
    

}
