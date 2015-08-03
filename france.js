function france(id, url, domain, range, title, unit, plus) {

  this.init = function() {
                self.map = L.map(id, {center: [46.6, 2.1], zoom: 6, minZoom: 6, maxZoom: 10, renderer: L.canvas({padding: .5})})
                           .addLayer(new L.tileLayer('https://cartodb-basemaps-b.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
                              subdomains: 'abcd', detectRetina: true }));
                d3.json('/data/geo/base.topojson', function (e, json){
                  d3.csv('/data/stats/data.csv', function (e, data){
                    d3.csv(url, function (e, stats){
                      self.load(data, stats);
                      self.draw(json);
                      self.show();
                      self.map.on({zoomend: self.show, dragend: self.show});
                    })
                  })
                })
              }

  this.draw = function(json) {
                for (key in json.objects) {
                  geojson = topojson.feature(json, json.objects[key]);
                  new L.GeoJSON(geojson, { smoothFactor: 0,
                    onEachFeature: function (feature, json) {
                      self.layers[key] = self.layers[key] || new L.layerGroup();
                      self.layers[key].addLayer(json);
                      json.on({
                        mouseover: function(e) { e.target.setStyle({stroke: 1}); self.info.update(e.target.feature.id); },
                         mouseout: function(e) { e.target.setStyle({stroke: 0}); self.info.update(); }
                      })
                    },
                    style: function(feature){
                      return { color: "#333", weight: 1, stroke: 0, opacity: .5,
                         fillOpacity: d3.scale.log().clamp(1).domain([1,15000]).range([0,1])(self.densities[feature.id]),
                           fillColor: d3.scale.linear().clamp(1).domain(domain).range(range)(self.stat[feature.id])
                      }
                    }
                  })
                }
              }

  this.show = function() {
                if(self.map.getZoom() <= 8) {
                  for (l in self.layers) {
                    if (l.slice(0,3) == "com") self.map.removeLayer(self.layers[l]);
                    if (l.slice(0,3) == "can") self.map.addLayer(self.layers[l]);
                  }
                }
                else {
                  for (dep in d=self.layers["dep"]["_layers"]) {
                    if (self.map.getBounds().overlaps(d[dep].getBounds())) {
                      function reshow(i) { self.map.addLayer(self.layers["com-"+i]).removeLayer(self.layers["can-"+i]); }
                      (function(i) { if (self.layers["com-"+i]) reshow(i);
                        else d3.json('/data/geo/com'+i+'.topojson', function (e, json){ self.draw(json); reshow(i); })
                      })(d[dep].feature.id)
                    }
                  }
                }
              }

  this.read = function(csv, col) {
                array = {};
                for (obj in csv) array[csv[obj].insee] = csv[obj][Object.keys(csv[0])[(col || 1)]];
                return array;
              }

  this.load = function(data, stats) {
                self.layers = {};
                self.names = self.read(data);
                self.densities = self.read(data,2);
                self.stat = self.read(stats);
                self.info();
                self.lgnd();
              }

  this.info = function() {
                self.info = new (L.Control.extend({
                  onAdd: function () {
                    this.div = L.DomUtil.create('div', 'info');
                    this.update();
                    return this.div;
                  },
                  update: function (props) {
                    this.div.innerHTML = '<h4>'+title+'</h4>'
                    + (props ? self.names[props].replace("e Arr", "<sup>ème</sup> arr")+" : "+self.stat[props].replace(".", ",")+"&nbsp;"+unit
                      : '<span style="color:#aaa">Survolez un territoire</span>')
                  }
                }));
                self.info.addTo(self.map);
              }

  this.lgnd = function() {
                self.legend = new (L.Control.extend({
                  options: { position: 'bottomleft' },
                  onAdd: function () {
                    this.div = L.DomUtil.create('div', 'legend');
                    return this.div;
                  },
                  draw: function() {
                    d3.selectAll(".legend svg").remove();
                    var svg = d3.select(".legend").append("svg").attr("id", 'legend').attr("width", 250).attr("height", 40);
                    var x = d3.scale.linear().domain([Math.min.apply(Math, domain), Math.max.apply(Math, domain)]).range([0, 200]);
                    window.c = d3.scale.linear().domain(domain).range(range);
                    var axis = d3.svg.axis().scale(x).orient("top").tickSize(1).tickFormat(d3.format(('' || plus)+'.0f')).tickValues(c.domain())
                    var g = svg.append("g").attr("class", "key").attr("transform", "translate(5,16)");

                    svg.append("svg:defs").append("svg:linearGradient").attr("id", "gradient").selectAll("stop")
                        .data(c.range().map(function(d, i) { return { x: i < c.domain().length ? x(c.domain()[i])/2 : x.range()[1]/2, z:d }}))
                        .enter().append("svg:stop")
                        .attr("offset", function(d) { return d.x+"%"; })
                        .attr("stop-color", function(d) { return d.z; });

                    g.append("rect").attr("height", 10).attr("x", 0).attr("width", 200).style("fill", "url(#gradient)");
                    g.call(axis).append("text").attr("class", "caption").attr("y", 21).text(title+" ("+unit+")");
                  }
                }));
                self.legend.addTo(self.map);
                self.legend.draw();
              }

  this.fill = function (url, _domain, _range, _title, _unit, _plus) {
                d3.csv(url, function (e, csv){
                  self.stat = self.read(csv);
                  title = _title, unit = _unit;
                  range = _range, domain = _domain;
                  plus = _plus;
                  self.info.update();
                  self.legend.draw();
                  for (l in self.layers) {for (el in c=self.layers[l]["_layers"]) {
                      c[el].setStyle({
                        fillColor: d3.scale.linear().clamp(1).domain(domain).range(range)(self.stat[c[el].feature.id])
                      })
                    }
                  }
                })
              }


  var self = this;
  self.init();

}
