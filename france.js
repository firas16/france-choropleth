function france(map, stat, domain, range, title, unit, plus) {

  this.init = function() {
                d3.json('/data/geo/france.topojson', function (e, json){
                  d3.csv('/data/geo/data.csv', function (e, data){
                    d3.csv('/data/stats/'+stat+'.csv', function (e, stats){
                      $.read(data, stats);
                      $.info();
                      $.search();
                      $.draw(json);
                    })
                  })
                })
              }

  this.read = function() {
                for (var file in arguments) {
                  var f = arguments[file];
                  if (!$.data) {
                    $.data = {};
                    for (var i in f) {
                      $.data[f[i].id] = {};
                    }
                  }
                  for (var j in f[0]) {
                    if (j != 'id') {
                      for (var i in f) {
                        $.data[f[i].id][j] = f[i][j];
                      }
                    }
                  }
                }
              }

  this.draw = function(json) {
                var alpha = d3.scale.log().clamp(1).domain([1,15000]).range([0,1]);
                var color = d3.scale.linear().clamp(1).domain(domain).range(range);
                $.layer = new L.GeoJSON(topojson.feature(json, json.objects["can"]), {
                    smoothFactor: .3,
                    onEachFeature: function (feature, layer) {
                      layer.on({ mouseover: function() { d3.selectAll(".info .value").attr("value", $.data[feature.id].name+" : "+$.data[feature.id][stat].replace(".",",")+" "+unit) },
                                 mouseout:  function() { d3.selectAll(".info .value").attr("value", "") } })
                    },
                    style: function(feature){
                      if ($.data[feature.id]) return { stroke: 0,
                        fillOpacity: Math.max(alpha($.data[feature.id].density), .05),
                        fillColor: color($.data[feature.id][stat])
                      }
                    }
                  });
                $.layer.addTo(map);
              }

  this.info = function() {
                d3.selectAll(".info").remove();

                var div = d3.select(".leaflet-bottom.leaflet-left").append("div").attr("class", "info leaflet-control")
                div.append("div").attr("class", "title").text(title).append("span").text(" (en "+unit+")");
                div.append("input").attr("class", "value").attr("disabled","").attr("placeholder","Survolez un territoire");

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
                var div = d3.select(".leaflet-top.leaflet-left").append("div").attr("class", "search leaflet-control");
                var search = div.append("input").attr("type", "text").attr("id", "search").attr("placeholder","Commune ou un code postal");

                L.DomEvent.disableClickPropagation(div.node());
                L.DomEvent.on(div.node(), 'mousewheel', L.DomEvent.stopPropagation);

                var list = [];
                for (var c in $.data) {
                  if ($.data[c].x && $.data[c].y) {
                    list.push($.data[c].name+" ("+$.data[c].postcode+")");
                  }
                }

                new Awesomplete( document.getElementById("search"), { list: list, maxItems: 20 });

                search.on('awesomplete-selectcomplete', function(){
                  var value = search.node().value;
                  for (var i in $.data) {
                    if (value == $.data[i].name+" ("+$.data[i].postcode+")" && i[3] != "-") {
                      $.i = i;
                      $.popup(i);
                      map.flyTo(L.latLng($.data[i].y, $.data[i].x), 9);
                      break;
                    }
                  }
                });
              }

 this.popup = function(i) {
                $.marker = L.popup().setLatLng(L.latLng($.data[i].y, $.data[i].x))
                            .setContent('<strong>'+$.data[i].name+'</strong><br />'+
                              title+' : '+$.data[i][stat].replace(".",",")+' '+unit).openOn(map);
              }

  this.load = function (_stat, _domain, _range, _title, _unit, _plus) {
                stat = _stat, domain = _domain, unit = _unit;
                title = _title, range = _range, plus = _plus;
                var color = d3.scale.linear().clamp(1).domain(domain).range(range);

                if ($.data[Object.keys($.data)[0]][stat]) {
                  refresh(stat);
                }
                else {
                  d3.csv('/data/stats/'+stat+'.csv', function (err, csv){
                    $.read(csv);
                    refresh(stat);
                  })
                }

                function refresh(csv) {
                  $.layer.eachLayer( function(e) {
                    if ($.data[e.feature.id]) {
                      e.setStyle({ fillColor: color($.data[e.feature.id][stat]) });
                    }
                  });
                  $.info();
                  if ($.marker) {
                    $.popup($.i);
                  }
                }
              }

  var $ = this;
  $.init();

}
