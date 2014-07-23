function HeapViz() {
  //Public graph properties
  this.objData = $R.state();
  this.radius = $R.state(40);
  this.width = $R.state(960);
  this.height = $R.state(640);

  //Connect it up
  var nodeData = $R(HeapViz.nodeData, this).bindTo(this.objData);
  var refLinkData = $R(HeapViz.refLinkData).bindTo(nodeData);
  var variableTableData = $R(HeapViz.variableTableData).bindTo(nodeData);
  var vizData = $R(HeapViz.vizData).bindTo(nodeData, refLinkData, variableTableData);

  var svg = $R(HeapViz.svg).bindTo(this.width, this.height);

  var refLinkGroup = $R(HeapViz.refLinkGroup).bindTo(svg);
  var nodeGroup = $R(HeapViz.nodeGroup).bindTo(svg);
  var labelGroup = $R(HeapViz.labelGroup).bindTo(svg);
  var varLinkGroup = $R(HeapViz.varLinkGroup).bindTo(svg);
  var nodeValuesGroup = $R(HeapViz.nodeValuesGroup).bindTo(svg);

  var varTable = $R(HeapViz.varTable);
  var varTableRows = $R(HeapViz.varTableRows).bindTo(varTable, vizData);

  var force = $R(HeapViz.force).bindTo(this.width, this.height, this.radius);
  var forceState = $R(HeapViz.forceState).bindTo(force, vizData);

  var nodes = $R(HeapViz.nodes).bindTo(nodeGroup, vizData, force, this.radius);
  var refLinks = $R(HeapViz.refLinks).bindTo(refLinkGroup, vizData);
  var labels = $R(HeapViz.labels).bindTo(labelGroup, vizData);
  var varLinks = $R(HeapViz.varLinks).bindTo(varLinkGroup, vizData);
  var nodeValues = $R(HeapViz.nodeValues).bindTo(nodeValuesGroup, vizData);

  var nextForceTick = $R(HeapViz.nextForceTick).bindTo(force, this.radius, refLinks, nodes, labels, varLinks, nodeValues)
}

//Util
HeapViz.colors = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
  "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c",
  "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5",
  "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f",
  "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"
];

HeapViz.scaleLinkTarget = function (link, r) {
  var dx = link.target.x - link.source.x;
  var dy = link.target.y - link.source.y;
  var l = Math.sqrt(dx * dx + dy * dy)
  dx = (dx / l) * (l - r)
  dy = (dy / l) * (l - r)
  return {x:link.source.x + dx, y:link.source.y + dy};
}
HeapViz.idForVarName = function (name) {
  return "var-row-"+name.replace("@","");
}
HeapViz.varLinkOrigin = function (name) {
  var bbox = document
    .getElementById(HeapViz.idForVarName(name))
    .getBoundingClientRect();
  return {x:bbox.top + (bbox.height/2), y:bbox.right-3}
}
HeapViz.objMap = function (objs) {
  var map = {};
  objs.forEach(function (obj) { map[obj.oid] = obj });
  return map;
}
HeapViz.highlight = function (d) {
  var oidSelector = '[data-oid="'+d.oid+'"]';
  var oidFilter = ':not('+oidSelector+')';
  d3.selectAll('.node,.var-link,.ref-link').filter(oidFilter).classed('diminished',true);
  d3.selectAll('.node-label').filter(oidFilter).classed("diminished-text", true);
  d3.selectAll('.ref-link').filter(oidFilter).attr("marker-end","url(#end-diminished)");
  d3.selectAll('.node-value').filter(oidSelector).style('visibility', 'visible');
}
HeapViz.clearHighlight = function (d) {
  d3.selectAll(".node,.var-link,.ref-link").classed('diminished', false)
  d3.selectAll(".ref-link").attr("marker-end","url(#end)")
  d3.selectAll(".node-label").classed("diminished-text",false)
  d3.selectAll('.node-value[data-oid="'+d.oid+'"]').style('visibility', 'hidden')
}
HeapViz.variableKeyFnc = function (d) { return d.name }
HeapViz.nodeKeyFnc = function (d) { return d.oid }
HeapViz.nodeData = function (objData) {

//Reactive Functions
  var oldNodeMap = HeapViz.objMap(this.oldNodeDataCache || []);
  var nodes = objData.map(function (obj,i) {
    var updatedNode = oldNodeMap[obj.oid];
    if (updatedNode) {
      ['klass','names','inboundReferences','value', 'orphan'].forEach(function (attr) {
        updatedNode[attr] = obj[attr]
      })
    } else {
      updatedNode = obj;
      updatedNode.color = HeapViz.colors.shift();
    }
    return updatedNode
  });
  this.oldNodeDataCache = nodes;
  return nodes;
}
HeapViz.refLinkData = function (objData) {
  var nodeMap = HeapViz.objMap(objData)
  var refLinks = []

  return refLinks.concat.apply(refLinks, objData.map(function (obj) {
    return obj.inboundReferences.map(function (ref_oid) {
      return {source:nodeMap[ref_oid], target:obj};
    });
  }));
}
HeapViz.variableTableData = function (objData) {
  var vars = [];
  objData.forEach(function (obj) {
    vars = vars.concat(obj.names.map(function (name) {
      return {name:name, oid:obj.oid, obj:obj};
    }));
  });
  return vars;
}

HeapViz.vizData = function (nodeData, refLinkData, variableTableData) {
  return {nodes:nodeData, refLinks:refLinkData, variables: variableTableData};
}
HeapViz.svg = function (width, height) {
  var svg = d3.select("body > svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("g").attr("class", "var-links");
  svg.append("g").attr("class", "ref-links");
  svg.append("g").attr("class", "nodes");
  svg.append("g").attr("class", "labels");
  svg.append("g").attr("class", "node-values");

  svg.append("svg:defs").selectAll("marker")
      .data(["end", "end-diminished"])
    .enter().append("svg:marker")
      .attr("id", String)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
    .append("svg:path")
      .attr("class", function (d) { return "arrow-marker-"+d })
      .attr("d", "M0,-5L10,0L0,5");

  return svg;
}

HeapViz.varTable = function () {
  return d3.select("#var-table tbody");
}
HeapViz.varTableRows = function (varTable, vizData) {
  var rows = varTable.selectAll("tr")
    .data(vizData.variables, HeapViz.variableKeyFnc);
  rows.enter()
    .append("tr")
      .attr("id", function (d) { return HeapViz.idForVarName(d.name) })
  rows.exit().remove()

  var names = rows.selectAll("td.var-name").data(function (d) { return [d.name] })
  names.enter().append("td").attr("class","var-name")
  names.text(String)

  var refs = rows.selectAll("td.var-ref").data(function (d) {
    return [{
      oid: d.obj.displayOid,
      color: d.obj.color
    }]
  })
  refs.enter().append("td").attr("class","var-ref")
  refs
    .text(function (d) { return d.oid +" |"})
    .style("color", function (d) { return d.color });

  return rows;
}

HeapViz.force = function (width, height, radius) {
  var force = d3.layout.force()
    .friction(0.5)
    .chargeDistance(500)
    .charge(-1200)
    .linkDistance(200)
    .size([width+100, height-100]);
  return force;
}
HeapViz.forceState = function (force, vizData) {
  force
    .nodes(vizData.nodes)
    .links(vizData.refLinks)
    .start();
}
HeapViz.nextForceTick = function (force, radius, refLinks, nodes, labels, varLinks, nodeValues) {
  force.on("tick", function() {
    refLinks
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return HeapViz.scaleLinkTarget(d,radius).x })
      .attr("y2", function(d) { return HeapViz.scaleLinkTarget(d,radius).y });

    nodes
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });

    labels
      .attr("x", function(d) { return d.x; })
      .attr("y", function(d) { return d.y; });

    nodeValues
      .attr("x", function(d) { return d.x+(radius+10); })
      .attr("y", function(d) { return d.y; });

    var diag = d3.svg.diagonal()
      .projection(function (d) {return [d.y, d.x]})
      .source(function (d,i) { return HeapViz.varLinkOrigin(d.name) })
      .target(function (d,i) {
        var link = {
          source: HeapViz.varLinkOrigin(d.name),
          target: {x:d.obj.y, y:d.obj.x}
        };
        var scaledL = HeapViz.scaleLinkTarget(link, radius);
        return {x:scaledL.x, y:scaledL.y}
      })
    varLinks.attr("d", diag);
  });
}

HeapViz.nodeGroup = function (svg) {
  return svg.select(".nodes");
}
HeapViz.nodes = function (nodeGroup, vizData, force, radius) {
  var node = nodeGroup
    .selectAll(".node")
    .data(vizData.nodes, HeapViz.nodeKeyFnc);
  node.enter()
    .append("circle")
    .attr("data-oid", function (d) { return d.oid })
    .attr("class", "node")
    .on('mouseover', HeapViz.highlight)
    .on('mouseout', HeapViz.clearHighlight);
  node
    .attr("r", radius)
    .style("stroke", function (d,i) { return d.orphan ? "#aaa" : d.color })
    .style("stroke-dasharray", function (d,i) { return d.orphan ? "3,3" : "0" })
    .call(force.drag);
  node.exit()
    .each(function (d) { HeapViz.colors.push(d.color); }) //reclaim colors
    .remove()
  return node;
}

HeapViz.nodeValuesGroup = function (svg) {
  return svg.select(".node-values");
}
HeapViz.nodeValues = function (nodeValuesGroup, vizData) {
  var nodeValues = nodeValuesGroup.selectAll("text")
    .data(vizData.nodes, HeapViz.nodeKeyFnc);
  nodeValues.enter()
    .append("text")
      .attr("data-oid", function (d) { return d.oid })
      .attr("class", "node-value")

  nodeValues
    .text(function (d) { return d.value })

  nodeValues.exit()
    .remove()
  return nodeValues;
}


HeapViz.refLinkGroup = function (svg) {
  return svg.select(".ref-links");
}
HeapViz.refLinks = function (refLinkGroup, vizData) {
  var refLink = refLinkGroup.selectAll(".ref-link").data(vizData.refLinks);
  refLink.enter()
    .append("line")
    .attr("class", "ref-link")
    .attr("data-oid", function (d) { return d.source.oid })
    .attr("marker-end", "url(#end)");
  refLink.exit()
    .remove()
  return refLink;
}

HeapViz.labelGroup = function (svg) {
  return svg.select(".labels");
}
HeapViz.labels = function (labelGroup, vizData) {
  var label = labelGroup.selectAll("text")
    .data(vizData.nodes, HeapViz.nodeKeyFnc)
  label.enter()
    .append("text")
      .attr("data-oid", function (d) { return d.oid })
      .attr("class", "node-label")
      .attr("text-anchor", "middle")
  label
    .text(function (d) { return d.klass + "#" + d.displayOid});
  label.exit()
    .remove();
  return label;
}

HeapViz.varLinkGroup = function (svg) {
  return svg.select(".var-links");
}
HeapViz.varLinks = function (varLinkGroup, vizData) {
  var varLinks = varLinkGroup.selectAll("path")
    .data(vizData.variables, HeapViz.variableKeyFnc);
  varLinks.enter()
    .append("path")
    .attr("class", "var-link")

  varLinks
    .attr("data-oid", function (d) { return d.obj.oid })
    .style("stroke", function (d,i) { return d.obj.color })

  varLinks.exit()
    .remove()
  return varLinks;
}
