var raw_data;

window.onload = function(){
    d3.csv('./data/KAPF-1-unicode.csv', function(e, csv_data){
        raw_data = csv_data;
        //csv_data = csv_data.slice(0, 100);
        var moon = agg_by_day(csv_data.filter(function(row){
            return row.name == '¹®ÀçÀÎ';
        }));
        var ahn = agg_by_day(csv_data.filter(function(row){
            return row.name == '¾ÈÃ¶¼ö';
        }));
        var yoo = agg_by_day(csv_data.filter(function(row){
            return row.name == 'À¯½Â¹Î';
        }));
        var sim = agg_by_day(csv_data.filter(function(row){
            return row.name == '½É»óÁ¤';
        }));
        render(moon, 'moon');
        render(ahn, 'ahn');
        render(yoo, 'yoo');
        render(sim, 'sim');
    })
}

function agg_by_day(data){
    var day_agg = d3.nest()
        .key(function(d) { return d.date; })
        .rollup(function(d) {
            return d3.sum(d, function(g) { return parseInt(g.fee.replace(',', '')); });
        }).entries(data)
        .sort(function(a, b){ return d3.ascending(a.key, b.key); });
    return day_agg
}

function render(data, name){
    var svg = d3.select("svg#" + name),
        margin = {top: 20, right: 20, bottom: 110, left: 70},
        margin2 = {top: 430, right: 20, bottom: 30, left: 70},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        height2 = +svg.attr("height") - margin2.top - margin2.bottom;

    var parseDate = d3.timeParse("%Y-%m-%d");

    var x = d3.scaleTime().range([0, width]),
        x2 = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        y2 = d3.scaleLinear().range([height2, 0]);

    var xAxis = d3.axisBottom(x),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y);

    var brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on("brush end", brushed);

    var zoom = d3.zoom()
        .scaleExtent([1, Infinity])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);

    var area = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return x(parseDate(d.key)); })
        .y0(height)
        .y1(function(d) { return y(d.value); });

    var area2 = d3.area()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return x2(parseDate(d.key)); })
        .y0(height2)
        .y1(function(d) { return y2(d.value); });

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
    .append("rect")
        .attr("width", width)
        .attr("height", height);

    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    // render
    x.domain(d3.extent(data, function(d) { return parseDate(d.key); }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    focus.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area);

    focus.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    focus.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);

    context.append("path")
        .datum(data)
        .attr("class", "area")
        .attr("d", area2);

    context.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    context.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, x.range());

    svg.append("rect")
        .attr("class", "zoom")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom);

    function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || x2.range();
        x.domain(s.map(x2.invert, x2));
        focus.select(".area").attr("d", area);
        focus.select(".axis--x").call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));
    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        x.domain(t.rescaleX(x2).domain());
        focus.select(".area").attr("d", area);
        focus.select(".axis--x").call(xAxis);
        context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
    }
    
}