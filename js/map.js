const width = 960;
const height = 600;

const svg = d3.select("body").select("svg#vis");
const svgL = d3.select("body").select("svg#line");

const g = {
    
    basemap: svg.select("g#basemap"),
    outline: svg.select("g#outline"),
    symbols: svg.select("g#buyouts"),
    tooltip: svg.select("g#tooltip"),
    details: svg.select("g#details"),
    line: svg.select("g#line")
};
    
let all_paths_sel;
let all_symbols_sel;
let all_outline_sel;
// setup tooltip (shows neighborhood name)
const tip = g.tooltip.append("text").attr("id", "tooltip");
tip.attr("text-anchor", "end");
tip.attr("dx", -5);
tip.attr("dy", -5);
tip.style("visibility", "hidden");

// add details widget
// https://bl.ocks.org/mbostock/1424037
const details = g.details.append("foreignObject")
    .attr("id", "details")
    .attr("width", 960)
    .attr("height", 600)
    .attr("x", 0)
    .attr("y", 0);

const body = details.append("xhtml:body")
    .style("text-align", "left")
    .style("background", "none")
    .html("<p>Graffiti Incidents</p>");

var color = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([0, 300]) 
details.style("visibility", "hidden");

var colorLegend = d3.scaleOrdinal(["#fc008b", "#256bb5", "#00a400"]);

// setup projection
// https://github.com/d3/d3-geo#geoConicEqualArea
const projection = d3.geoConicEqualArea();
projection.parallels([37.692514, 37.840699]);
projection.rotate([122, 0]);

// setup path generator (note it is a GEO path, not a normal path)
const path = d3.geoPath().projection(projection);

var buyouts = [];
var nhoods = [];
var stats = [];
var per_capita = new Map();

var final = new Map();
var promises = [
    d3.json("../data/neighborhoods.geojson"),
    d3.json("../data/stats.json"),
    d3.csv("../data/buyouts.csv")
]

Promise.all(promises).then(ready)

function ready(data) {
    nhoods = data[0]
    stats = data[1]
    buyouts = data[2]
    projection.fitSize([960, 600], nhoods);
    drawBasemap(nhoods);
    drawBuyouts(buyouts);
}

var zoom = d3.zoom()
    .scaleExtent([1, 1.5])
    .on('zoom', () => {
        all_paths_sel
            .attr('transform', d3.event.transform);
        all_outline_sel
            .attr('transform', d3.event.transform);
        all_symbols_sel
            .attr('transform', d3.event.transform)
            .attr('stroke-width', 1 / d3.event.transform.k)
            .attr('r', 4 / d3.event.transform.k)
        // g.symbols.selectAll("circle.active")
        //     .attr('stroke-width', 1 / d3.event.transform.k);

    });

svg.call(zoom);

function drawBasemap(json) {

    let sum = 0;

    // 35 buyouts without neighborhoods
    buyouts = buyouts.filter(b => b.neighborhood.length != 0);

    const basemap = g.basemap.selectAll("path.land")
        .data(json.features)
        .enter()
        .append("path")
        .attr("fill", function(d) {
            let amount = +stats.find(x => d.properties.nhood == x.nhood).amount_per_capita;
            return color(amount); })
        .attr("d", path)
        .attr("class", "land");

    const outline = g.outline.selectAll("path.neighborhood")
        .data(json.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "neighborhood")
        .each(function(d) {
        // save selection in data for interactivity
        // saves search time finding the right outline later
        d.properties.outline = this;
      });


      all_paths_sel = basemap;
      all_outline_sel = outline;


  // add highlight
  basemap.on("mouseover.highlight", function(d) {
    // console.log(g.symbols.selectAll("#circle"));
    let object = stats.find(x => d.properties.nhood == x.nhood);
    const html = ` <table border="0" cellspacing="0" cellpadding="2">
      <tbody>
        <tr>
            <th style="text-align:left;font-size:15px">Neighborhood Statistics</th>
        </tr>
        <tr>
          <th>Neighborhood:</th>
          <td>${d.properties.nhood}</td>
        </tr>
        <tr>
          <th>Population:</th>
          <td>${object.population}</td>
        </tr>
        <tr>
          <th>Buyouts w available info:</th>
          <td>${object.full_info_count}</td>
        </tr>
        <tr>
          <th>Buyouts w unavailable info:</th>
          <td>${object.count - object.full_info_count}</td>
        </tr>
        <tr>
          <th>Buyout amount per capita:</th>
          <td>${formatter.format(object.amount_per_capita)}</td>
        </tr>
        <tr>
          <th>Average buyout amount:</th>
          <td>${formatter.format(object.average_buyout_amount)}</td>
        </tr>
      </tbody>
      </table>`

    body.html(html);

    details
        .transition()
        .style("visibility", "visible");
    
    d3.select(d.properties.outline).raise();
    d3.select(d.properties.outline).classed("active", true);
    displayLine(d.properties.nhood)
  })
  .on("mouseout.highlight", function(d) {
    details.style("visibility", "hidden");
    d3.select(d.properties.outline).classed("active", false);
    svgL.selectAll("g").remove();
    svgL.selectAll("path").remove();
    svgL.selectAll("text").remove();
  });
}

function drawBuyouts(json) {



    // loop through and add projected (x, y) coordinates
    // (just makes our d3 code a bit more simple later)
    json.forEach(d => {
        const latitude = parseFloat(d.lat);
        const longitude = parseFloat(d.lon);
        const pixels = projection([longitude, latitude]);
        d.x = pixels[0];
        d.y = pixels[1];
    });

    const symbols = g.symbols.selectAll("circle")
        .data(json)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 4)
        .attr("stroke-width", 1)
        .attr("class", "symbol")
        .attr("neighborhood", d => d.neighborhood)
        .style("fill", d => {
            if(d.tenants > 2) return colorLegend("3+")
            else return colorLegend(d.tenants.toString())
        }

        );

    all_symbols_sel = symbols;

    symbols.on("mouseover", function(d) {
        let object = stats.find(x => d.neighborhood == x.nhood);
        const html = ` <table border="0" cellspacing="0" cellpadding="2">
        <tbody>
            <tr>
                <th style="text-align:left;font-size:15px">Buyout Statistics</th>
            </tr>
            <tr>
            <th>Case #:</th>
            <td>${d.case}</td>
            </tr>
            <tr>
            <th>Buyout date:</th>
            <td>${d.date}</td>
            </tr>
            <tr>
            <th>Buyout amount:</th>
            <td>${formatter.format(d.amount)}</td>
            </tr>
            <tr>
            <th>Neigborhood average amount:</th>
            <td>${formatter.format(object.average_buyout_amount)}</td>
            </tr>
            <tr>
            <th>Difference from average:</th>
            <td>${formatter.format(d.amount - object.average_buyout_amount)}</td>
            </tr>

            <tr>
            <th></th>
            <td></td>
            </tr>
            <tr>
            <th>Address:</th>
            <td>${d.address}</td>
            </tr>
            <tr>
            <th>Neighborhood::</th>
            <td>${d.neighborhood}</td>
            </tr>
            <tr>
            <th>Tenants #::</th>
            <td>${d.tenants}</td>
            </tr>
        </tbody>
        </table>`

        body.html(html);

        details
            .transition()
            .style("visibility", "visible");

        d3.select(this).classed("active", true);
        
    });
        
    symbols.on("mouseout", function() {
        d3.select(this).classed("active", false);
        details.style("visibility", "hidden");
    });

    // add legend   
    let legend = svg.append("g")
        .attr("class", "legend")
        .attr("x", width - 65)
        .attr("y", 25)
        .attr("height", 100)
        .attr("width", 100)


    legend.append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", 120)
        .attr("height", 100)
        .attr("transform", "translate(790,0)")
        .attr("fill", "white")
        .attr("opacity", "0.7")

    d3.select('.legend').append("text")
        .attr("x", 700 - 50)
        .attr("y", 0)
        .attr("height", 30)
        .attr("width", 100)
        .style("fill", "black")
        .style("font-weight", 700)
        .text("Number of Tenants")
        .attr("transform", "translate(155,25)");

    source_map = {
        "1": "1",
        "2": "2",
        "3+": "3+"
    }

    legend.selectAll('g').data(["1", "2", "3+"])
        .enter()
        .append('g')
        .each(function(d, i) {
            var g = d3.select(this);
            g.append("circle")
                .attr('r', 5)
                .attr("cx", 700 - 65)
                .attr("cy", i * 25)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", colorLegend(d))
                .attr("transform", "translate(190,50)");

            g.append("text")
                .attr("x", 700 - 50)
                .attr("y", i * 25 + 4)
                .attr("height", 30)
                .attr("width", 100)
                .style("fill", "black")
                .text(source_map[d])
                .attr("transform", "translate(190,50)");
        });
}

function displayLine(d) {
    let object = stats.find(x => x.nhood ==d);

    var x = d3.scaleBand()
        .range([0, 350])
        .domain([2015, 2016, 2017, 2018, 2019])
        

    svgL.append("g")
      .attr("transform", "translate(90," + 360 + ")")
      .call(d3.axisBottom(x));

    svgL.append('text')
        .attr('x', width/4 + 25)
        .attr('y', 390)
        .attr('text-anchor', 'middle')
        .attr('class', 'label')
        .text('Year')

    svgL.append("g")
      .attr("transform", "translate(520," + 360 + ")")
      .call(d3.axisBottom(x));

    svgL.append('text')
        .attr('x', width - width/4 - 25)
        .attr('y', 390)
        .attr('text-anchor', 'middle')
        .attr('class', 'label')
        .text('Year')

    let max = d3.max(object.data, function(d) { return +d.amount; })
    var y1 = d3.scaleLinear()
        .domain([0, max + max/6])
        .range([ 350, 0 ]);
      
    svgL.append("g")
        .attr("transform", "translate(90,10)")
        .call(d3.axisLeft(y1).ticks(6));

    svgL.append('text')
        .attr('x', (-(350/2)))
        .attr('y', 25)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('class', 'label')
        .text('Total Amount')

    // Add the line
    svgL.append("path")
        .datum(object.data)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 3)
        .attr("d", d3.line()
            .x(function(d) {return x(d.year) + 90 + 38})
            .y(function(d) {return y1(d.amount) })
        )

    max = d3.max(object.data, function(d) { return +d.count; })

    var y2 = d3.scaleLinear()
        .domain([0, max + max/6])
        .range([ 350, 0 ]);
      
    svgL.append("g")
        .attr("transform", "translate(520,10)")
        .call(d3.axisLeft(y2).ticks(6));

    svgL.append('text')
        .attr('x', (-(350/2)))
        .attr('y', 520 - 40)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('class', 'label')
        .text('Number of buyouts')
    // Add the line
    svgL.append("path")
        .datum(object.data)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 3)
        .attr("d", d3.line()
            .x(function(d) {
                return x(d.year) + 520 + 38})
            .y(function(d) {
                return y2(+d.count) })
        )
}

var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

function arrayToCSV(objArray) {
            const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
            let str = `${Object.keys(array[0]).map(value => `"${value}"`).join(",")}` + '\r\n';

            return array.reduce((str, next) => {
                str += `${Object.values(next).map(value => `"${value}"`).join(",")}` + '\r\n';
                return str;
                }, str);
        }

function translate(x, y) {
  return "translate(" + String(x) + "," + String(y) + ")";
}

function zoomed() {
      svg.selectAll('path') // To prevent stroke width from scaling
        .attr('transform', d3.event.transform);
    svg.selectAll('circle') // To prevent stroke width from scaling
        .attr('transform', d3.event.transform);
    }