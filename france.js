function france(map, stat, domain, range, title, unit, plus) {

  this.init = function() {
                d3.json('/data/geo/base.topojson', function (e, json){
                  d3.csv('/data/stats/data.csv', function (e, data){
                    d3.csv('/data/stats/'+stat+'.csv', function (e, stats){
                      self.read(data, stats);
                      self.info();
                      self.search();
                      self.draw(json);
                    })
                  })
                })
              }

  this.read = function() {
                for (var file in arguments) {
                  var f = arguments[file];
                  if (!self.data) {
                    self.data = {};
                    for (var line in f) {
                      self.data[f[line].insee] = {};
                    }
                  }
                  for (var column in f[0]) {
                    if (column != 'insee') {
                      for (var line in f) {
                        self.data[f[line].insee][column] = f[line][column];
                      }
                    }
                  }
                }
              }

  this.draw = function(json) {
                var alpha = d3.scale.log().clamp(1).domain([1,15000]).range([0,1]);
                var color = d3.scale.linear().clamp(1).domain(domain).range(range);

                for (var key in json.objects) {
                  self.layer = new L.GeoJSON(topojson.feature(json, json.objects[key]), {
                      smoothFactor: .3,
                      onEachFeature: function (feature, layer) {
                        layer.on({ mouseover: function(e) { d3.selectAll(".info .value").text(self.data[e.target.feature.id].name+" : "+self.data[e.target.feature.id][stat].replace(".",",")+" "+unit) },
                                   mouseout:  function(e) { d3.selectAll(".info .value").text("").append("span").text("Survolez un territoire") } })
                      },
                      style: function(feature){
                        if (self.data[feature.id]) return { stroke: 0,
                          fillOpacity: alpha(self.data[feature.id].density),
                          fillColor: color(self.data[feature.id][stat])
                        }
                      }
                    });
                  self.layer.addTo(map);
                }
              }

  this.info = function() {
                d3.selectAll(".info").remove();

                var div = d3.select(".leaflet-bottom.leaflet-left").append("div").attr("class", "info leaflet-control")
                div.append("div").attr("class", "title").text(title).append("span").text(" (en "+unit+")");
                div.append("div").attr("class", "value").text("").append("span").text("Survolez un territoire");

                var x = d3.scale.linear().domain([domain[0], domain[domain.length-1]]).range([1, 239]);
                var canvas = div.append("canvas").attr("height",10).attr("width",250).node().getContext("2d");
                var gradient = canvas.createLinearGradient(0,0,240,10);
                var a = range.map(function(d, i) { return { x: x(domain[i]), z:d }});
                for (var el in a) {
                  gradient.addColorStop(a[el].x/239,a[el].z);
                }
                canvas.fillStyle = gradient;
                canvas.fillRect(10,0,240,10);

                div.append("svg").attr("width", 260).attr("height", 14).append("g").attr("transform", "translate(10,0)").attr("class", "key")
                   .call(d3.svg.axis().scale(x).tickFormat(d3.format((''||plus)+'.0f')).tickValues(domain).tickSize(3));
              }

 this.search = function() {
              var list = [];
              for (var c in self.data) {
                if (c.slice(2,3) != "-") {
                  list.push(self.data[c].name+" ("+c.slice(0,2)+")");
                }
              }
              var div = d3.select(".leaflet-top.leaflet-left").append("div").attr("class", "search leaflet-control");
              var input = div.append("input").attr("type", "text").attr("id", "search");
              new Awesomplete( document.getElementById("search"), { list: list, maxItems: 20 });
              L.DomEvent.disableClickPropagation(div.node());
              L.DomEvent.on(div.node(), 'mousewheel', L.DomEvent.stopPropagation);
              input.on('awesomplete-selectcomplete', function(){
                var value = input.node().value;
                for (var i in self.data) {
                  if (i.slice(0,2) == value.slice(-3,-1) && self.data[i].name == value.slice(0,-5) ) {
                    self.i = i;
                    self.popup(i);
                    map.flyTo(L.latLng(self.data[i].y, self.data[i].x), 9);
                  }
                }
              });
            }

 this.popup = function(i) {
                self.marker = L.popup().setLatLng(L.latLng(self.data[i].y, self.data[i].x))
                            .setContent('<strong>'+self.data[i].name+'</strong><br />'+
                              title+' : '+self.data[i][stat].replace(".",",")+' '+unit).openOn(map);
              }

  this.load = function (_stat, _domain, _range, _title, _unit, _plus) {
                stat = _stat, domain = _domain, unit = _unit;
                title = _title, range = _range, plus = _plus;
                var color = d3.scale.linear().clamp(1).domain(domain).range(range);
                d3.csv('/data/stats/'+_stat+'.csv', function (e, csv){
                  self.read(csv);
                  self.layer.eachLayer( function(e) {
                    if (self.data[e.feature.id]) {
                      e.setStyle({ fillColor: color(self.data[e.feature.id][stat]) });
                    }
                  });
                  self.info();
                  if (self.marker) {
                    self.popup(self.i);
                  }
                })
              }

  var self = this;
  self.init();

}
