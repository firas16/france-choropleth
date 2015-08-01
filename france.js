function france(map) {

  var layers = {};
  window.names = {};
  window.unemployement = {};
  window.density = {};

  queue().defer(d3.json, '/data/geo/base.topojson')
         .defer(d3.csv,  '/data/stats/data.csv')
         .defer(d3.csv,  '/data/stats/unemployement.csv')
         .await(function (error, json, data, stats){
           show(data);
           color(stats);
           read(json);
           draw();
         });

  map.on('zoomend', draw);
  map.on('dragend', draw);

  function read(json) {
    for (key in json.objects) {
      geojson = topojson.feature(json, json.objects[key]);
      new L.GeoJSON(geojson, {
        smoothFactor: 0,
        onEachFeature: function (feature, json) {
          if (!layers[key]) layers[key] = new L.layerGroup();
          layers[key].addLayer(json);
          json.on({
            mouseover: function(e) {
              e.target.setStyle({stroke: true});
              info.update(names[e.target.feature.id]);
            },
            mouseout: function(e) {
              e.target.setStyle({stroke: false});
              info.update();
            }
          });
        },
        style: function(feature){
          return {
            fillColor: d3.scale.linear().clamp(1).domain([6,14]).range(["#006837","#d62728"])(unemployement[feature.id]),
            color: "#333",
            weight: 1,
            stroke: false,
            opacity: .5,
            fillOpacity: d3.scale.log().clamp(1).domain([1,15000]).range([0,1])(density[feature.id])
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
            d3.json((layers["com-"+i] || '/data/geo/com'+i+'.topojson'), function (e, com){
              if (!e) read(com);
              map.addLayer(layers["com-"+i]).removeLayer(layers["can-"+i]);
            })
          })(d[dep].feature.id)
        }
      }
    }
  }

  function show(data) {
     info = L.control();
     info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div
    };
    info.update = function (props) {
      this._div.innerHTML = '<h4>Carte administrative</h4>'
         + (props ? props : '<span style="color:#aaa">Survolez un territoire</span>')
    };
    for (obj in data) {
      names[data[obj].insee] = data[obj].name;
      density[data[obj].insee] = data[obj].density;
    }
    info.addTo(map);
  }

  function color(data) {
    for (obj in data) {
      unemployement[data[obj].insee] = data[obj].unemployement;
    }
  }
}
