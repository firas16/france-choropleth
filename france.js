function france(map) {

  var l = {}, names = {}, info = L.control();

  queue().defer(d3.json, '/data/geo/dep.topojson')
         .defer(d3.json, '/data/geo/can.topojson')
         .defer(d3.csv,  '/data/geo/names.csv')
         .await(function (error, dep, can, names){
           show(names);
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
        onEachFeature: function (feature, json) {
          var el = l[key];
          if (!el ) { el = new L.layerGroup(); l[key] = el; }
          el.addLayer(json);
          if (key != "dep")
            json.on('mouseover', function () { info.update(names[feature.id]) });
            json.on('mouseout',  function () { info.update() });
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
      for (dep in d=l["dep"]["_layers"]) {
        i=d[dep].feature.id;
        if (map.getBounds().overlaps(d[dep].getBounds())) {
          if (!l["com-"+i]) (function(i){ $.getJSON("/data/geo/com"+i+".topojson", function(json) {
              draw(json); map.addLayer(l["com-"+i]).removeLayer(l["can-"+i]);});})(i);  
          else map.addLayer(l["com-"+i]).removeLayer(l["can-"+i]);
         }
      }

    if(map.getZoom() <= 6)
      map.addLayer(l["dep"]);

    else
      map.removeLayer(l["dep"]);

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

    for (obj in data)
      names[data[obj].insee] = data[obj].name;

    info.addTo(map);

  }
}
