function france(id, url, domain, range, title, unit, plus) {

  this.init = function() {
                self.map = L.map(id, {center: [46.6, 2.1], zoom: 6, minZoom: 6, maxZoom: 9, renderer: L.canvas({padding: .4})})
                           .addLayer(new L.tileLayer('https://cartodb-basemaps-b.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
                              subdomains: 'abcd', detectRetina: true }));
                d3.json('/data/geo/base.topojson', function (e, json){
                  d3.csv('/data/stats/data.csv', function (e, data){
                    d3.csv(url, function (e, stats){
                      self.layers = {};
                      self.names = self.read(data);
                      self.densities = self.read(data,2);
                      self.stat = self.read(stats);
                      self.info();
                      self.draw(json);
                      self.map.on({zoomend: self.show, dragend: self.show});
                      if(self.map.getZoom() <= 8) {
                        for (l in self.layers) {
                          if (l.slice(0,3) == "can") self.map.addLayer(self.layers[l]);
                        }
                      }
                    })
                  })
                })
              }

  this.draw = function(json) {
                for (key in json.objects) {
                  geojson = topojson.feature(json, json.objects[key]);
                  new L.GeoJSON(geojson, { smoothFactor: .3,
                    onEachFeature: function (feature, json) {
                      self.layers[key] = self.layers[key] || new L.layerGroup();
                      self.layers[key].addLayer(json);
                      json.on({ mouseover: function(e) { e.target.setStyle({stroke: 1});
                                           d3.selectAll(".info .value").text(self.names[e.target.feature.id]+" : "+self.stat[e.target.feature.id]+" "+unit) },
                                 mouseout: function(e) { e.target.setStyle({stroke: 0});
                                           d3.selectAll(".info .value").text("").append("span").text("Survolez un territoire") }})
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
                if(self.map.getZoom() > 8) {
                  for (dep in d=self.layers["dep"]["_layers"]) {
                    if (self.map.getBounds().overlaps(d[dep].getBounds())) {
                      self.load(d[dep].feature.id)
                    }
                  }
                }
              }

  this.load =  function(i, callback) {
                if (self.layers["com-"+i]) {
                  if (callback) callback();
                }
                else {
                  d3.json('/data/geo/com'+i+'.topojson', function (e, json){
                    self.draw(json);
                    self.map.removeLayer(self.layers["can-"+i]);
                    self.map.addLayer(self.layers["com-"+i]);
                    if (callback) callback();
                  })
                }
              }

  this.read = function(csv, col) {
                array = {};
                for (obj in csv) array[csv[obj].insee] = csv[obj][Object.keys(csv[0])[(col || 1)]];
                return array;
              }

  this.info = function() {
                d3.selectAll(".info").remove();

                var div = d3.select(".leaflet-bottom.leaflet-left").append("div").attr("class", "info leaflet-control")

                div.append("div").attr("class", "title").text(title).append("span").text(" (en "+unit+")");
                div.append("div").attr("class", "value").text("").append("span").text("Survolez un territoire");

                var x = d3.scale.linear().domain([domain[0], domain[domain.length-1]]).range([1, 239]);
                var svg = div.append("svg").attr("width", 260).attr("height", 27).attr("transform", "translate(10,0)");

                svg.append("svg:defs").append("svg:linearGradient").attr("id", "gradient").selectAll("stop")
                    .data(range.map(function(d, i) { return { x: i < domain.length ? x(domain[i])/2 : x.range()[1]/2, z:d }}))
                    .enter().append("svg:stop").attr("offset", function(d) { return d.x+"%"; }).attr("stop-color", function(d) { return d.z; });

                svg.append("rect").attr("height", 12).attr("width", 240).attr("fill", "url(/#gradient)");

                svg.append("g").attr("transform", "translate(0,12)").attr("class", "key")
                   .call(d3.svg.axis().scale(x).tickFormat(d3.format((''||plus)+'.0f')).tickValues(domain).tickSize(3));
              }

  this.fill = function (url, _domain, _range, _title, _unit, _plus) {
                d3.csv(url, function (e, csv){
                  self.stat = self.read(csv);
                  title = _title, unit = _unit, range = _range, domain = _domain, plus = _plus;
                  self.info();
                  if (self.pop) self.popup(self.pop, self.i, self.b);
                  for (l in self.layers) {for (el in c=self.layers[l]["_layers"]) {
                      c[el].setStyle({
                        fillColor: d3.scale.linear().clamp(1).domain(domain).range(range)(self.stat[c[el].feature.id])
                      })
                    }
                  }
                })
              }

  this.look = function(id) {
                self.load(id.slice(0,2), function() {
                  for (el in c=self.layers["com-"+id.slice(0,2)]["_layers"]) {
                    if (id == c[el].feature.id) {
                      self.pop = L.popup(), self.b = c[el].getBounds(), self.i = c[el].feature.id;
                      self.popup(self.pop, self.i, self.b);
                      self.map.flyToBounds(self.b);
                    }
                  }
                })
              }

  this.popup = function(popup, i, b) {
                popup.setLatLng(L.latLng(b.getNorth(), (b.getWest()+b.getEast())/2))
                     .setContent('<strong>'+self.names[i]+'</strong><br />'+
                                 title+' : '+self.stat[i]+' '+unit+'</p>').openOn(self.map);
              }

  var self = this;
  self.init();

}
