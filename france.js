function france(map, url, domain, range) {

  queue().defer(d3.json, '/data/geo/base.topojson')
         .defer(d3.csv,  '/data/stats/data.csv')
         .defer(d3.csv,  url)
         .await(function (error, json, data, stats){
           init(data, stats);
           load(json);
           draw();
           map.on({zoomend: draw, dragend: draw});
         });

  function load(json) {
    for (key in json.objects) {
      geojson = topojson.feature(json, json.objects[key]);
      new L.GeoJSON(geojson, { smoothFactor: 0,
        onEachFeature: function (feature, json) {
          if (!layers[key]) layers[key] = new L.layerGroup();
          layers[key].addLayer(json);
          json.on({
            mouseover: function(e) { e.target.setStyle({stroke: 1}); info.update(names[e.target.feature.id]); },
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

  function draw() {
    if(map.getZoom() <= 8) {
      for (l in layers) {
        if (l.slice(0,3) == "com") map.removeLayer(layers[l]);
        if (l.slice(0,3) == "can") map.addLayer(layers[l]);
      }
    }
    else {
      for (dep in d=layers["dep"]["_layers"]) {
        if (map.getBounds().overlaps(d[dep].getBounds())) {
          (function(i) {
            d3.json((layers["com-"+i] || '/data/geo/com'+i+'.topojson'), function (error, json){
              if (!error) load(json);
              map.addLayer(layers["com-"+i]).removeLayer(layers["can-"+i]);
            })
          })(d[dep].feature.id)
        }
      }
    }
  }

  function read(csv, col=1) {
    array = {};
    for (obj in csv) array[csv[obj].insee] = csv[obj][Object.keys(csv[0])[col]];
    return array;
  }

  function init(data, stats) {
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
        div.innerHTML = '<h4>Carte administrative</h4>'
        + (props ? props : '<span style="color:#aaa">Survolez un territoire</span>')
      }
    }));
    info.addTo(map);
  }

}
