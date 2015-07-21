function france(map) {

  queue().defer(d3.json, '/data/geo/dep.topojson')
         .defer(d3.json, '/data/geo/can.topojson')
         .defer(d3.csv,  '/data/geo/names.csv')
         .await(function (error, dep, can, names){
           info(names);
           read(dep);
           read(can);   
           reset();        
         });

  map.on('zoomend', reset);
  map.on('dragend', reset);

  function read(data) {
    if (!window.l) window.l = {};
    for (key in data.objects) {
      geojson = topojson.feature(data, data.objects[key]);
      new L.GeoJSON(geojson, {
        onEachFeature: function (feature, json) {
          var el = l[key];
          if (!el ) { el = new L.layerGroup(); l[key] = el; }
          el.addLayer(json);
          if (key != "dep")
            json.on('mouseover', function () { infobox.update(names[feature.id]) });
            json.on('mouseout',  function () { infobox.update() });
        },
        style: {
          fillColor: "#ccc",
          color: "#aaa",
          weight: 1,
          opacity: 1,
          fillOpacity: .8
        }
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
      for (dep in l["dep"]["_layers"]) {
        d = l["dep"]["_layers"][dep]; i=d.feature.id;
        if (map.getBounds().contains(d.getBounds()) || map.getBounds().intersects(d.getBounds())) {
          if (!l["com-"+i]) (function(i){ $.getJSON("/data/geo/com"+i+".topojson", function(json) {
              read(json); map.addLayer(l["com-"+i]).removeLayer(l["can-"+i]);});})(i);  
          else map.addLayer(l["com-"+i]).removeLayer(l["can-"+i]);
         }
      }
    if(map.getZoom() <= 6)
      map.addLayer(l["dep"]);
    else
      map.removeLayer(l["dep"]);
  }

  function info(data){
    window.infobox = L.control();
    infobox.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };
    infobox.update = function (props) {
      this._div.innerHTML = '<h4>Carte administrative</h4>'
         + (props ? props : '<span style="color:#aaa">Survolez un territoire</span>')
    };
    infobox.addTo(map);

    window.names = {};
    for (obj in data)
      names[data[obj].insee] = data[obj].name;
  }
}
