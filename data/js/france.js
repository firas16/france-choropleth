function france(map){
  var layers = {};
  $.getJSON("data/topojson/cantons.json", function(json) {
    read(json);
    $.getJSON("data/topojson/departements.json", function(json) {
      read(json);
      reset();
    });
  });

  map.on('moveend', reset);

  function read(data, cl) {
    if (data.type === "Topology")
      for (key in data.objects) {
        geojson = topojson.feature(data, data.objects[key]);
        new L.GeoJSON(geojson, {style: color, onEachFeature: store})
      }
  }

  function store(feature, json) {
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
  }

  function color(feature) {
    return {
      fillColor: "#ccc",
      color: "#aaa",
      weight: 1,
      opacity: 1,
      fillOpacity: .8
    }
  }

  function communes(i){
    $.getJSON("data/topojson/"+i+".json", function(json) {
      if (layers["can"+i].com != true){
        read(json);
        layers["can"+i].com = true;
      }
      if(map.getZoom()>8)
        map.addLayer(layers["com"+i]).removeLayer(layers["can"+i]);
      });
  }

  function reset() {
    if(map.getZoom()<=8) {
      map.removeLayer(layers["dep"]);
      for (el in layers) {
        if (el.substring(0,3) == "com") map.removeLayer(layers[el]);
        if (el.substring(0,3) == "can") map.addLayer(layers[el]);
      }
    }
    if(map.getZoom()<=6)
      map.addLayer(layers["dep"]);
    if(map.getZoom()>8)
      for (dep in layers["dep"]["_layers"]) {
        d = layers["dep"]["_layers"][dep]; id=d.feature.id;
        if (map.getBounds().contains(d.getBounds()) ||
            map.getBounds().intersects(d.getBounds())) {
          if (layers["com"+id] != undefined)
            map.addLayer(layers["com"+id]).removeLayer(layers["can"+id]);
          else
            communes(id);
        }
      }
  }
  
  return layers;

}