
function type(d) {
  d.frequency = +d.frequency;
  return d;
}
function draw_bar_chart(data,flag)
{
    var margin = {top: 40, right: 20, bottom: 80, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var formatPercent = d3.format("");

    var PALTypes = [];
    PALTypes[0] = "activity_coefficient";
    //PALTypes[1] = "schePAL";

    data.forEach(function(d){
      d.PALs = PALTypes.map(function(name){
        return {name:name, value: +d[name]};
      });
    });
    var PALTypesDisplay = [];
    PALTypesDisplay[0] = "Activity Coefficient";
    //PALTypesDisplay[1] = "Scheduled Scores";

    var color = d3.scale.ordinal().range(["#d03c98"]);

    var x0 = d3.scale.ordinal().rangeRoundBands([0, width], .1);
    var x1 = d3.scale.ordinal();
    var y = d3.scale.linear().range([height, 0]);

    var xAxis = d3.svg.axis().scale(x0).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(formatPercent);

    if(flag == 0){
      var svg = d3.select("#barChartDaily").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text("Daily Chart");

        x0.domain(data.map(function(d) { return d.date; }));
        x1.domain(PALTypes).rangeRoundBands([0, x0.rangeBand()]);
        y.domain([0, d3.max(data, function(d) { return d3.max(d.PALs, function(d) { return d.value; }); })]);
        
        svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
            .style("text-anchor","end")
            .attr("dx","-.8em")
            .attr("dy",".15em")
            .attr("transform","rotate(-50)");

        svg.append("g").
        attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Activity Coefficient");

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


    }else if(flag == 1){
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

        svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
            .style("text-anchor","end")
            .attr("dx","-.8em")
            .attr("dy",".15em")
            .attr("transform","rotate(-30)");

        svg.append("g").
        attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Activity Coefficient");

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

    }else{
      var svg = d3.select("#barChartMonthly").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom)
        .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        svg.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 2))
        .attr("text-anchor", "middle")  
        .style("font-size", "16px") 
        .style("text-decoration", "underline")  
        .text("Monthly Chart");

       x0.domain(data.map(function(d) { return d.date; }));
        x1.domain(PALTypes).rangeRoundBands([0, x0.rangeBand()]);
        y.domain([0, d3.max(data, function(d) { return d3.max(d.PALs, function(d) { return d.value; }); })]);

        svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
            .style("text-anchor","end")
            .attr("dx","-.8em")
            .attr("dy",".15em")
            .attr("transform","rotate(-30)");

        svg.append("g").
        attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Activity Coefficient");

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
    }

    var legend = svg.selectAll(".legend")
      .data(PALTypesDisplay.slice().reverse())
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

var randomColor = (function(){
  var golden_ratio_conjugate = 0.618033988749895;
  var h = 1;

  var hslToRgb = function (h, s, l){
      var r, g, b;

      if(s == 0){
          r = g = b = l; // achromatic
      }else{
          function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          }

          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }

      return '#'+Math.round(r * 255).toString(16)+Math.round(g * 255).toString(16)+Math.round(b * 255).toString(16);
  };
  
  return function(){
    h += golden_ratio_conjugate;
    h %= 1;
    return hslToRgb(h, 0.5, 0.60);
  };
})();