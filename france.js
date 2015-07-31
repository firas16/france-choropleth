function france(map) {

  window.l = {};
  window.names = {};
  window.density = {};
  var info = L.control();

  queue().defer(d3.json, '/data/geo/dep.topojson')
         .defer(d3.json, '/data/geo/can.topojson')
         .defer(d3.csv,  '/data/geo/data.csv')
         .await(function (error, dep, can, data){
           show(data);
           draw(dep);
           draw(can);
           reset();
         });

  map.on('zoomend', reset);
  map.on('dragend', reset);

  function draw(data) {
    for (key in data.objects) {
      geojson = topojson.feature(data, data.objects[key]);
      new L.GeoJSON(geojson, {
        smoothFactor: 0,
        onEachFeature: function (feature, json) {
          if (!l[key]) l[key] = new L.layerGroup();
          l[key].addLayer(json);
          json.on({mouseover: hover, mouseout: out });
        },
        style: function(feature){return {
          fillColor: "#333",
          color: "#333",
          weight: 1,
          stroke: false,
          opacity: .5,
          fillOpacity: (density[feature.id] || 0)
        }}
      })
    }
  }

  function reset() {
    if(map.getZoom() <= 8)
      for (el in l) {
        if (el.slice(0,3) == "com") map.removeLayer(l[el]);
        if (el.slice(0,3) == "can") map.addLayer(l[el]);
      }
    else
      for (dep in d=l["dep"]["_layers"]) {
        if (map.getBounds().overlaps(d[dep].getBounds())) {
          (function(i){
            d3.json((l["com-"+i] || '/data/geo/com'+i+'.topojson'), function (e, com){
              if (!e) draw(com);
              map.addLayer(l["com-"+i]).removeLayer(l["can-"+i]);
            })
          })(d[dep].feature.id)}
      }
  }

  function show(data){
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
      density[data[obj].insee] = data[obj].opacity/100;
    }
    info.addTo(map);
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
