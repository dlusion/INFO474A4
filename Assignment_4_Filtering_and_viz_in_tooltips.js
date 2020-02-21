// Set the margins for our graph as well as define the svg dimensions
var margin = { top: 10, right: 0, bottom: 40, left: 200 },
    width = 1500 - margin.left - margin.right,
    height = 750 - margin.top - margin.bottom;

// Create the svg within the DOM
let svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", "svg")

// Create a div that will be used by the tooltips
let tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .attr('style', 'position: absolute; opacity: 0;');

// Function for making a graph - defines the axis, adds the circles that make up our scatterplot - all 
// according to the data that is passed in as a parameter.
makeGraph = function (data) {

    // Filters the data such that only datapoints from 1980 are visible.
    let filteredData = data.filter(d => d["year"] == 1980)

    // Finds the max and min of the population sizes and then scales all population sizes to a radius size. 
    let popBounds = d3.extent(filteredData, function(d) { return d["population"] });
    let popSizes = [popBounds[0], 200000000, 400000000, 600000000, 800000000, popBounds[1]];
    let popConvert = d3.scaleLinear()
        .domain(popSizes)
        .range([1.25, 8, 10, 12, 14, 15.5])

    // Finds the largest and smallest fertility values within the dataset that is passed in and uses them
    // to scale the x-axis and x-values.
    let fertBounds = d3.extent(filteredData, function(d) { return d["fertility"] });
    let xScale = d3.scaleLinear()
        .domain([fertBounds[0] - 1, (fertBounds[1] + 1)])
        .range([margin.left, (width - 50)])


    // Appends our x-axis to the graph
    let xAxis = d3.axisBottom(xScale)
    svg.append("g")
        .attr("id", "x-axis")
        .attr("transform", "translate(0," + (height) + ")")
        .call(xAxis)
        .call(g => g.append("text") // Adds the x-axis label to the x-axis
            .attr("class", "x label")
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("x", (width + margin.left + margin.right) / 2)
            .attr("y", (40))
            .attr("fill", "black")
            .text("Fertility"));

    // Scales the y-axis
    let leBounds = d3.extent(filteredData, function(d) { return d["life_expectancy"] });
    let yScale = d3.scaleLinear()
        .domain([leBounds[1] + 5, leBounds[0] - 5])
        .range([(margin.top + margin.bottom), height])

    // Appends y-axis to the graph
    let yAxis = d3.axisLeft(yScale)
    svg.append("g")
        .attr("id", "y-axis")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(yAxis)
        .call(g => g.append("text")
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("x", -(height + margin.bottom + margin.top) / 2)
            .attr("y", -40)
            .attr("fill", "black")
            .attr("transform", "rotate(-90)")
            .text("Life Expectancy"));

    // group that will contain all of the circles and labels
    var circles = svg.selectAll("g")
        .data(filteredData)
        .enter()
        .append("g")

    // Creates labels (containing the country name) for countries that have a population size > 100M
    circles.append("text")
        .attr("x", function(d) { return xScale(d["fertility"]) + 20; })
        .attr("y", function(d) { return yScale(d["life_expectancy"]) + 5; })
        .text(function(d) { return d["population"] > 100000000 ? d["country"] : ""; });

    // Creates the circles that represent our data in the scatterplot and appends them to the graph
    // also contains a mouseover event that will display a linegraph of population over time for the
    // country that the user is hovering over.
    circles.append("circle")
        .attr("class", "circles")
        .attr("cx", function (d) { return xScale(d["fertility"]); })
        .attr("cy", function (d) { return yScale(d["life_expectancy"]); })
        .attr("r", function (d) { return popConvert(d["population"]); })
        .attr("fill", "white")
        .attr("stroke-width", 2.25)
        .style("stroke", "#4f73b0")
        .on("mouseover", function (d) {
            let country = d.country; // Stores the hovered country

            tooltip.transition()
                .duration(200)
                .style("opacity", 1);

            tooltip.style("left", (d3.event.pageX + 30) + "px")
                .style("top", (d3.event.pageY - 120) + "px");

            // Appends a new SVG element for use in the linegraph
            let tSvg = tooltip.append("svg")
                .attr("height", "300px")
                .attr("width", "325px")

            // Appends text containing the name of the country that was hovered over to the linegraph
            tSvg.append("text")
                .attr("text-anchor", "middle")
                .attr("font-size", "16px")
                .attr("x", (325) / 2)
                .attr("y", (15))
                .attr("fill", "black")
                .text(country);

            // Filters overall dataset for information regarding hovered country only, excludes data
            // from 2016, due to presence of nulls.
            let countryData = data.filter(d => d["country"] == country && d["year"] != 2016)
            let yearLimits = d3.extent(countryData, d => d["year"])
            let popLimits = d3.extent(countryData, d => d["population"])

            // Creates new x-axis scale and x-axis
            let xScale = d3.scaleLinear()
                .domain([yearLimits[0], yearLimits[1]])
                .range([75, 315])
            let xAxis = d3.axisBottom(xScale)
                .ticks(7)
            tSvg.append("g")
                .attr("id", "x-axis2")
                .attr("transform", "translate(0," + (250) + ")")
                .call(xAxis)
                .call(g => g.append("text") // Adds the x-axis label to the x-axis
                    .attr("class", "x label")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("x", (325) / 2)
                    .attr("y", (35))
                    .attr("fill", "black")
                    .text("Year"));

            // Creates new y-axis sclae and y-axis
            let yScale = d3.scaleLinear()
                .domain([popLimits[0], popLimits[1]])
                .range([250, 10])
            let yAxis = d3.axisLeft(yScale)
                .ticks(4, ".1s")
            tSvg.append("g")
                .attr("id", "y-axis2")
                .attr("transform", "translate(" + (75) + ",0)")
                .call(yAxis)
                .call(g => g.append("text")
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("x", -(325) / 2)
                    .attr("y", -55)
                    .attr("fill", "black")
                    .attr("transform", "rotate(-90)")
                    .text("Population"));

            // d3's line generator
            let line = d3.line()
                .x(d => xScale(d["year"])) // set the x values for the line generator
                .y(d => yScale(d["population"])) // set the y values for the line generator 
            

            // append line to svg
            tSvg.append("path")
                .datum(countryData)
                .attr("d", function (d) { 
                    return line(d) 
                })
                .attr("fill", "steelblue")
                .attr("stroke", "steelblue")
        })
        .on("mouseout", function (d) {
            tooltip.transition()
                .duration(0)
                .style("opacity", 0)
            tooltip.selectAll("svg")
                .attr("height", "0px")
                .attr("width", "0px")
        });
}

// Loads the gapminder csv file and converts necessary variables to numeric values 
d3.csv("./gapminder.csv", (data) => {
    data.forEach(function (d) {
        d["fertility"] = +d["fertility"];
        d["life_expectancy"] = +d["life_expectancy"];
        d["year"] = +d["year"]
        d["population"] = +d["population"];
    });

    makeGraph(data) // makes our initial graph
});