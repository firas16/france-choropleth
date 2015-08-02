function france(id, url, domain, range, name, unit) {

  this.init = function() {
                this.map = L.map(id, {center: [46.6, 2.1], zoom: 6, minZoom: 6, maxZoom: 10, renderer: L.canvas({padding: .5})})
                           .addLayer(new L.tileLayer('https://cartodb-basemaps-b.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
                              subdomains: 'abcd', detectRetina: true }));
                d3.json('/data/geo/base.topojson', function (e, json){
                d3.csv('/data/stats/data.csv', function (e, data){
                d3.csv(url, function (e, stats){
                  load(data, stats);
                  draw(json);
                  show();
                  map.on({zoomend: show, dragend: show});
                })})});
              }

  this.draw = function(json) {
                for (key in json.objects) {
                  geojson = topojson.feature(json, json.objects[key]);
                  new L.GeoJSON(geojson, { smoothFactor: 0,
                    onEachFeature: function (feature, json) {
                      layers[key] = layers[key] || new L.layerGroup();
                      layers[key].addLayer(json);
                      json.on({
                        mouseover: function(e) { e.target.setStyle({stroke: 1}); info.update(e.target.feature.id); },
                         mouseout: function(e) { e.target.setStyle({stroke: 0}); info.update(); }
                      });
                    },
                    style: function(feature){
                      return { color: "#333", weight: 1, stroke: 0, opacity: .5,
                         fillOpacity: d3.scale.log().clamp(1).domain([1,15000]).range([0,1])(densities[feature.id]),
                           fillColor: d3.scale.linear().clamp(1).domain(domain).range(range)(stat[feature.id])
                      }
                    }
                  })
                }
              }

  this.show = function() {
                if(map.getZoom() <= 8) {
                  for (l in layers) {
                    if (l.slice(0,3) == "com") map.removeLayer(layers[l]);
                    if (l.slice(0,3) == "can") map.addLayer(layers[l]);
                  }
                }
                else {
                  for (dep in d=layers["dep"]["_layers"]) {
                    if (map.getBounds().overlaps(d[dep].getBounds())) {
                      function reshow(i) { map.addLayer(layers["com-"+i]).removeLayer(layers["can-"+i]); }
                      (function(i) { if (layers["com-"+i]) reshow(i);
                        else d3.json('/data/geo/com'+i+'.topojson', function (e, json){ draw(json); reshow(i); })
                      })(d[dep].feature.id)
                    }
                  }
                }
              }

  this.read = function(csv, col=1) {
                array = {};
                for (obj in csv) array[csv[obj].insee] = csv[obj][Object.keys(csv[0])[col]];
                return array;
              }

  this.load = function(data, stats) {
                layers = {};
                names = read(data);
                densities = read(data,2);
                stat = read(stats);
                info = new (L.Control.extend({
                  onAdd: function () {
                    div = L.DomUtil.create('div', 'info');
                    this.update();
                    return div;
                  },
                  update: function (props) {
                    div.innerHTML = '<h4>'+name+'</h4>'
                    + (props ? names[props].replace("e Arr", "<sup>ème</sup> arr")+" : "+stat[props].replace(".", ",")+"&nbsp;"+unit
                      : '<span style="color:#aaa">Survolez un territoire</span>')
                  }
                }));
                info.addTo(map);
              }

  this.init();

}
