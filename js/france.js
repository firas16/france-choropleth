function france(map) {

  $.getJSON("/data/topojson/can.json", function(json) {
    read(json);
    $.getJSON("/data/topojson/dep.json", function(json) {
      read(json);
      reset();
    });
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
            switch (feature.properties.insee.length) {
              case 6: id = "can" + feature.properties.insee.substring(1,3); break;
              case 5: id = "com" + feature.properties.insee.substring(0,2); break;
              default: id = "dep";
            }
            var el = layers[id];
            if (el === undefined) {
              el = new L.layerGroup();
              layers[id] = el;
            }
            el.addLayer(json);
            json.on('mouseover', function () { info.update(feature.properties.nom) });
            json.on('mouseout', function () { info.update() });
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
        if (el.substring(0,3) == "com") map.removeLayer(layers[el]);
        if (el.substring(0,3) == "can") map.addLayer(layers[el]);
      }
    else
      for (dep in layers["dep"]["_layers"]) {
        d = layers["dep"]["_layers"][dep]; id=d.feature.id;
        if (map.getBounds().contains(d.getBounds()) ||
            map.getBounds().intersects(d.getBounds())) {
          if (layers["com"+id] != undefined)
            map.addLayer(layers["com"+id]).removeLayer(layers["can"+id]);
          else
            (function(id){ $.getJSON("/data/topojson/com"+id+".json", function(json) {
              if (layers["can"+id].com != true){
                read(json);
                layers["can"+id].com = true;
              }
              if(map.getZoom()>8)
                map.addLayer(layers["com"+id]).removeLayer(layers["can"+id]);
            });})(id);        
         }
      }
    if(map.getZoom() <= 6)
      map.addLayer(layers["dep"]);
    else
      map.removeLayer(layers["dep"]);
  }

  window.info = L.control();
  info.onAdd = function (map) {
      this._div = L.DomUtil.create('div', 'info'); 
      this.update();
      return this._div;
  };
  info.update = function (props) {
    this._div.innerHTML = '<h4>Carte administrative</h4>' 
       + (props ? props : '<span style="color:#aaa">Survolez un territoire</span>')
  };
  info.addTo(map);
  
}
