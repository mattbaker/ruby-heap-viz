function HeapVisualization() {
  //Public graph properties
  this.objData = $R.state();
  this.radius = $R.state(40);
  this.width = $R.state(960);
  this.height = $R.state(500);

  //Connect it up
  var nodeData = $R(HeapVisualization.nodeData).bindTo(this.objData);
  var linkData = $R(HeapVisualization.linkData).bindTo(this.objData);
  var variableTable = $R(HeapVisualization.variableTable).bindTo(this.objData);
  var vizData = $R(HeapVisualization.vizData).bindTo(nodeData, linkData, variableTable);

  var svg = $R(HeapVisualization.svg).bindTo(this.width, this.height);

  var linkGroup = $R(HeapVisualization.linkGroup).bindTo(svg);
  var nodeGroup = $R(HeapVisualization.nodeGroup).bindTo(svg);
  var labelGroup = $R(HeapVisualization.labelGroup).bindTo(svg);
  var varLinkGroup = $R(HeapVisualization.varLinkGroup).bindTo(svg);

  var varTable = $R(HeapVisualization.varTable);
  var varTableRows = $R(HeapVisualization.varTableRows).bindTo(varTable, vizData);

  var force = $R(HeapVisualization.force).bindTo(this.width, this.height, this.radius);
  var forceState = $R(HeapVisualization.forceState).bindTo(force, vizData);

  var nodes = $R(HeapVisualization.nodes).bindTo(nodeGroup, vizData, force, this.radius);
  var links = $R(HeapVisualization.links).bindTo(linkGroup, vizData);
  var labels = $R(HeapVisualization.labels).bindTo(labelGroup, vizData);
  var varLinks = $R(HeapVisualization.varLinks).bindTo(varLinkGroup, vizData);

  var nextForceTick = $R(HeapVisualization.nextForceTick).bindTo(force, this.radius, links, nodes, labels, varLinks)
}
HeapVisualization.colors = d3.scale.category10();

HeapVisualization.hexifyOid = function (oid) {
  return "0x"+oid.toString(16).substring(7);
}
HeapVisualization.scaleLinkTarget = function (link, r) {
  var dx = link.target.x - link.source.x;
  var dy = link.target.y - link.source.y;
  var l = Math.sqrt(dx * dx + dy * dy)
  dx = (dx / l) * (l - r)
  dy = (dy / l) * (l - r)
  return {x:link.source.x + dx, y:link.source.y + dy};
}
HeapVisualization.nodeData = function (objData) {
  objData.forEach(function (obj, i) {
    obj.color = HeapVisualization.colors(i);
  });
  return objData;
}
HeapVisualization.linkData = function (objData) {
  var nodeMap = {};
  var links = []
  objData.forEach(function(obj) { nodeMap[obj.oid] = obj });

  return links.concat.apply(links, objData.map(function (obj) {
    return obj.references.map(function (ref_oid) {
      return {source:nodeMap[ref_oid], target:obj};
    });
  }));
}
HeapVisualization.variableTable = function (objData) {
  var vars = [];
  objData.forEach(function (obj) {
    vars = vars.concat(obj.names.map(function (name) {
      return {name:name, oid:obj.oid, obj:obj};
    }));
  });
  return vars;
}
HeapVisualization.vizData = function (nodeData, linkData, variableTable) {
  return {nodes:nodeData, links:linkData, variables: variableTable};
}
HeapVisualization.svg = function (width, height) {
  var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

  //Specific ordering for z-index
  svg.append("g").attr("class", "sym-links");
  svg.append("g").attr("class", "sym-link-labels");
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
HeapVisualization.varTable = function () {
  return d3.select("#var-table tbody");
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
HeapVisualization.varLinkGroup = function (svg) {
  return svg.select(".sym-links");
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
HeapVisualization.forceState = function (force, vizData) {
  force
    .nodes(vizData.nodes)
    .links(vizData.links)
    .start();
}
HeapVisualization.nextForceTick = function (force, radius, links, nodes, labels, varLinks) {
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

    var diag = d3.svg.diagonal()
      .projection(function (d) {return [d.y, d.x]})
      .source(function (d,i) { return {x:43+(i*28), y:228} })
      .target(function (d,i) {
        var l = {source:{x:43+(i*28), y:228}, target:{x:d.obj.y, y:d.obj.x}};
        var scaledL = HeapVisualization.scaleLinkTarget(l, radius);
        return {x:scaledL.x, y:scaledL.y}
      })
    varLinks.attr("d", diag);
  });
}
HeapVisualization.nodes = function (nodeGroup, vizData, force, radius) {
  var node = nodeGroup
    .selectAll(".node")
    .data(vizData.nodes, function(d) { return d.oid });
  node.enter()
    .append("circle")
    .attr("class", "node")
    .style("stroke", function (d,i) { return d.color })
  node
    .attr("r", radius)
    .call(force.drag);
  node.exit()
    .remove()
  return node;
}
HeapVisualization.links = function (linkGroup, vizData) {
  var link = linkGroup.selectAll(".link").data(vizData.links);
  link.enter()
    .append("line")
    .attr("class", "link")
    .attr("marker-end", "url(#end)");
  link.exit()
    .remove()
  return link;
}
HeapVisualization.labels = function (labelGroup, vizData) {
  var label = labelGroup.selectAll("text")
    .data(vizData.nodes, function (d) { return d.oid })
  label.enter()
    .append("text")
      .attr("text-anchor", "middle")
  label
    .text(function (d) { return d.klass + "#" + HeapVisualization.hexifyOid(d.oid)});
  label.exit()
    .remove();
  return label;
}
HeapVisualization.varLinks = function (varLinkGroup, vizData) {
  var varLinks = varLinkGroup.selectAll("path")
    .data(vizData.variables,function (d) { return d.name });
  varLinks.enter()
    .append("path")

  varLinks
    .style("stroke", function (d,i) { return d.obj.color })

  varLinks.exit()
    .remove()
  return varLinks;
}
HeapVisualization.varTableRows = function (varTable, vizData) {
  var rows = varTable.selectAll("tr")
    .data(vizData.variables, function (d) { return d.name });
  rows.enter()
    .append("tr");
  rows.exit().remove()

  var names = rows.selectAll("td.var-name").data(function (d) {
    return [d.name]
  })
  names.enter()
    .append("td").attr("class","var-name")
  names
    .text(String)

  var refs = rows.selectAll("td.var-ref").data(function (d) {
    return [{
      oid: HeapVisualization.hexifyOid(d.oid),
      color: d.obj.color
    }]
  })
  refs.enter()
    .append("td").attr("class","var-ref")
  refs
    .text(function (d) { return d.oid +" |"})
    .style("color", function (d) { return d.color });

  return rows;
}
