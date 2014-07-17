function HeapVisualization() {
  //Public graph properties
  this.data = $R.state();
  this.radius = $R.state(40);
  this.width = $R.state(960);
  this.height = $R.state(500);

  //Connect it up
  var graphData = $R(HeapVisualization.graphData).bindTo(this.data);
  var svg = $R(HeapVisualization.svg).bindTo(this.width, this.height);
  var linkGroup = $R(HeapVisualization.linkGroup).bindTo(svg);
  var nodeGroup = $R(HeapVisualization.nodeGroup).bindTo(svg);
  var labelGroup = $R(HeapVisualization.labelGroup).bindTo(svg);
  var force = $R(HeapVisualization.force).bindTo(this.width, this.height, this.radius);
  var forceState = $R(HeapVisualization.forceState).bindTo(force, graphData);
  var nodes = $R(HeapVisualization.nodes).bindTo(nodeGroup, graphData, force, this.radius);
  var links = $R(HeapVisualization.links).bindTo(linkGroup, graphData);
  var labels = $R(HeapVisualization.labels).bindTo(labelGroup, graphData);
  var nextForceTick = $R(HeapVisualization.nextForceTick).bindTo(force, this.radius, links, nodes, labels)
}
HeapVisualization.scaleLinkTarget = function (link, r) {
  var dx = link.target.x - link.source.x;
  var dy = link.target.y - link.source.y;
  var l = Math.sqrt(dx * dx + dy * dy)
  dx = (dx / l) * (l - r)
  dy = (dy / l) * (l - r)
  return {x:link.source.x + dx, y:link.source.y + dy};
}
HeapVisualization.graphData = function (data) {
  var nodeMap = {};
  var links = []
  data.forEach(function(obj) { nodeMap[obj.oid] = obj });

  links = links.concat.apply(links, data.map(function (obj) {
    return obj.references.map(function (ref) {
      return {source:nodeMap[ref.oid], target:obj};
    });
  }));

  return {nodes:data, links:links};
}
HeapVisualization.svg = function (width, height) {
  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

  //Specific ordering for z-index
  svg.append("g").attr("class", "links");
  svg.append("g").attr("class", "nodes");
  svg.append("g").attr("class", "labels");

  svg.append("svg:defs").selectAll("marker")
      .data(["end"])
    .enter().append("svg:marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
    .append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");

  return svg;
}
HeapVisualization.nodeGroup = function (svg) {
  return svg.select(".nodes");
}
HeapVisualization.linkGroup = function (svg) {
  return svg.select(".links");
}
HeapVisualization.labelGroup = function (svg) {
  return svg.select(".labels");
}

HeapVisualization.force = function (width, height, radius) {
  var force = d3.layout.force()
    .friction(0.5)
    .chargeDistance(500)
    .charge(-1200)
    .linkDistance(200)
    .size([width, height]);
  return force;
}
HeapVisualization.forceState = function (force, graphData) {
  force
    .nodes(graphData.nodes)
    .links(graphData.links)
    .start();
}
HeapVisualization.nextForceTick = function (force, radius, links, nodes, labels) {
  force.on("tick", function() {
    links
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return HeapVisualization.scaleLinkTarget(d,radius).x })
      .attr("y2", function(d) { return HeapVisualization.scaleLinkTarget(d,radius).y });

    nodes.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });

    labels.attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; });
  });
}
HeapVisualization.nodes = function (nodeGroup, graphData, force, radius) {
  var node = nodeGroup
    .selectAll(".node")
    .data(graphData.nodes, function(d) { return d.oid });
  node.enter()
    .append("circle")
    .attr("class", "node")
  node
    .attr("r", radius)
    .call(force.drag);
  node.exit()
    .remove()
  return node;
}
HeapVisualization.links = function (linkGroup, graphData) {
  var link = linkGroup.selectAll(".link").data(graphData.links);
  link.enter()
    .append("line")
    .attr("class", "link")
    .attr("marker-end", "url(#end)");
  link.exit()
    .remove()
  return link;
}
HeapVisualization.labels = function (labelGroup, graphData) {
  var label = labelGroup.selectAll("text")
    .data(graphData.nodes, function (d) { return d.oid })
  label.enter()
    .append("text")
      .attr("text-anchor", "middle")
  label
    .text(function (d) { return d.klass + "#" + d.oid.toString(16).substring(7)});
  label.exit()
    .remove();
  return label;
}
