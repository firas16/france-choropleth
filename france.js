function france(map) {

  window.l = {};
  window.names = {};
  window.unemployement = {};
  window.density = {};

  queue().defer(d3.json, '/data/geo/base.topojson')
         .defer(d3.csv,  '/data/stats/data.csv')
         .defer(d3.csv,  '/data/stats/unemployement.csv')
         .await(function (error, base, data, stats){
           show(data);
           color(stats);
           read(base);
           draw();
         });

  map.on('zoomend', draw);
  map.on('dragend', draw);

  function read(data) {
    for (key in data.objects) {
      geojson = topojson.feature(data, data.objects[key]);
      new L.GeoJSON(geojson, {
        smoothFactor: 0,
        onEachFeature: function (feature, json) {
          if (!l[key]) l[key] = new L.layerGroup();
          l[key].addLayer(json);
          json.on({mouseover: hover, mouseout: out });
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
      for (el in l) {
        if (el.slice(0,3) == "com") map.removeLayer(l[el]);
        if (el.slice(0,3) == "can") map.addLayer(l[el]);
      }
    }
    else {
      for (dep in d=l["dep"]["_layers"]) {
        if (map.getBounds().overlaps(d[dep].getBounds())) {
          (function(i) {
            d3.json((l["com-"+i] || '/data/geo/com'+i+'.topojson'), function (e, com){
              if (!e) read(com);
              map.addLayer(l["com-"+i]).removeLayer(l["can-"+i]);
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

  function hover(e) {
    e.target.setStyle({stroke: true});
    info.update(names[e.target.feature.id]);
  }

  function out(e) {
    e.target.setStyle({stroke: false});
    info.update();
  }

}
