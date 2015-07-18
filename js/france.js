function france(map) {

  $.getJSON("/data/topojson/can.topojson", function(json) {
    read(json);
    $.getJSON("/data/topojson/dep.topojson", function(json) {
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
            var el = layers[key];
            if (el === undefined) {
              el = new L.layerGroup();
              layers[key] = el;
            }
            el.addLayer(json);
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
}
