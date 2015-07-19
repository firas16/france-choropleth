function france(map) {

  queue().defer(d3.json, '/data/topojson/dep.topojson')
         .defer(d3.json, '/data/topojson/can.topojson')
         .defer(d3.csv,  '/data/topojson/names.csv')
         .await(function (error, dep, can, names){
           info(names);
           read(dep);
           read(can);   
           reset();        
         });

  map.on('zoomend', reset);
  map.on('dragend', reset);

  function read(data) {
    if (window.layers === undefined)
      window.layers = {};
      for (key in data.objects) {
        geojson = topojson.feature(data, data.objects[key]);
        new L.GeoJSON(geojson, {
          onEachFeature: function (feature, json) {
            var el = layers[key];
            if (el === undefined) {
              el = new L.layerGroup();
              layers[key] = el;
            }
            el.addLayer(json);
            if (key != "dep")
              json.on('mouseover', function () { infobox.update(names[key.slice(0,3)+feature.id]) });
              json.on('mouseoff',  function () { infobox.update() });
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
      for (el in layers) {
        if (el.slice(0,3) == "com") map.removeLayer(layers[el]);
        if (el.slice(0,3) == "can") map.addLayer(layers[el]);
      }
    else
      for (dep in layers["dep"]["_layers"]) {
        d = layers["dep"]["_layers"][dep]; id=d.feature.id;
        if (map.getBounds().contains(d.getBounds()) ||
            map.getBounds().intersects(d.getBounds())) {
          if (layers["com-"+id] != undefined)
            map.addLayer(layers["com-"+id]).removeLayer(layers["can-"+id]);
          else
            (function(id){ $.getJSON("/data/topojson/com"+id+".topojson", function(json) {
              if (layers["can-"+id].com != true){
                read(json);
                layers["can-"+id].com = true;
              }
              if(map.getZoom()>8)
                map.addLayer(layers["com-"+id]).removeLayer(layers["can-"+id]);
            });})(id);        
         }
      }
    if(map.getZoom() <= 6)
      map.addLayer(layers["dep"]);
    else
      map.removeLayer(layers["dep"]);
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
      names[data[obj].insee] = data[obj].nom;
  }
}
