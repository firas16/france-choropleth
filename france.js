function france( map ) {


    this.init = function() {

                  // Download geospatial vector data and metadata
                  d3.json( '/data/geo/france.topojson', function ( e, json ) {
                    d3.csv( '/data/geo/data.csv', function ( e, data ) {

                      // Convert TopoJSON to GeoJSON
                      $.topo = topojson.feature( json, json.objects["can"] );

                      // Store metadata
                      $.read( data );

                      // Display the first layer
                      $.load( arg[1] );

                      // Display search field
                      $.search();

                      // Layer control if two layers or more
                      arg[2] && $.select();

                    });
                  });

                }


    this.read = function( f ) {

                  // Create object for each feature
                  if ( !$.data ) {
                    $.data = {};
                    for ( var i in f ) {
                      $.data[ f[i].id ] = {};
                    }
                  }

                  // Attach metadata for each feature
                  for ( var j in f[0] ) {
                    if ( j != 'id' ) {
                      for ( var i in f ) {
                        $.data[ f[i].id ][j] = f[i][j];
                      }
                    }
                  }

                }


    this.load = function ( arg ) {

                  // Store selected arguments
                  for ( var i in arg ) {
                    $[i] = arg[i];
                  }

                  // Download the selected stat
                  d3.csv( '/data/stats/' + $.stat + '.csv', function ( err, csv ) {

                    // Store metadata
                    $.read( csv );

                    // (Re)draw the map
                    $.draw();

                    // Display legend
                    $.legend();

                    // Update an existing popup
                    d3.select(".leaflet-popup").remove();
                    $.i && $.popup( $.i );

                  });

                }


    this.draw = function() {

                  var
                        // Scale for density
                        alpha = d3.scale.log()
                                  .clamp( true )
                                  .domain( [1, 15000] )
                                  .range( [0, 1] ),

                        // Scale for color
                        color = d3.scale.linear()
                                         .clamp( true )
                                        .domain( $.domain )
                                         .range( $.range ),

                        // Define the renderer
                        canvas = L.canvas( { padding: .6 } );

                  // Remove previous canvas and layer
                  d3.select( ".leaflet-pane canvas" ).remove();
                  map._events.moveend_idx   = { "39_36": map._events.moveend_idx["39_36"]   };
                  map._events.zoomend_idx   = { "33_30": map._events.zoomend_idx["33_30"]   };
                  map._events.viewreset_idx = { "37_36": map._events.viewreset_idx["37_36"] };
                  map._layers = {};

                  // Define new layer
                  map.addLayer(
                    new L.GeoJSON($.topo, {
                      renderer: canvas,
                      smoothFactor: .3,

                      // Show feature name and data on hover
                      onEachFeature: function ( feature, layer ) {
                        layer.on( {
                          mouseover: function() {
                                        d3.select( ".legend .value" )
                                          .attr( "value", (
                                            feature.id.slice( 2, 3 ) == "-" ? "Canton d"
                                            + ( ( /^[EÉAOUIY]/i ).test( $.data[ feature.id ].name ) ? "’" : "e " ) : "" )
                                            + $.data[ feature.id ].name + " : "
                                            + $.data[ feature.id ][ $.stat ].replace( ".", "," ) + " "
                                            + $.unit
                                          )
                                      },

                           mouseout: function() {
                                        d3.select( ".legend .value" )
                                            .attr( "value", "" )
                                        }
                        } )
                      },

                      // Color depending on data
                      style: function( feature ) {
                               return {

                                 fillOpacity:
                                   $.data[ feature.id ] ? Math.max(alpha( $.data[ feature.id ].density ), .05 ) : .2,

                                 fillColor:
                                   color( $.data[ feature.id ] ? $.data[ feature.id ][$.stat ] : "#000"  ),

                                  stroke: 0

                               };
                             }
                    })
                  );

                }


  this.legend = function() {

                  // Delete existing legend to update it
                  d3.select( ".legend" ).remove();

                  var
                        // Create legend control
                        div = d3.select( ".leaflet-bottom.leaflet-left" ).append( "div" )
                                  .attr( "class", "legend leaflet-control" ),

                        // Display title and unit
                        title = div.append( "div" )
                                     .attr( "class", "title" )
                                     .text( $.title )
                                   .append( "span" )
                                     .text( " ( en " + $.unit + " )" ),

                        // Input where to display communes on hover
                        input = div.append( "input" )
                                     .attr( "class", "value" )
                                     .attr( "disabled", "" )
                                     .attr( "placeholder", "Survolez un territoire" ),

                        // Prepare linear scale and axis for gradient legend
                        x = d3.scale.linear()
                                    .domain( [$.domain[0], $.domain[$.domain.length-1]] )
                                     .range( [1, 239] ),

                        canvas = div.append( "canvas" )
                                      .attr( "height", 10 )
                                      .attr( "width", 250 )
                                      .node().getContext( "2d" ),

                        gradient = canvas.createLinearGradient( 0, 0, 240, 10 ),

                        stops = $.range.map( function( d, i ) { return { x: x( $.domain[i] ), color:d } } );

                  // Define color stops on the legend
                  for ( var s in stops ) {
                    gradient.addColorStop( stops[s].x/239, stops[s].color );
                  }

                  // Draw the gradient rectangle
                  canvas.fillStyle = gradient;
                  canvas.fillRect( 10, 0, 240, 10 );

                  // Draw horizontal axis
                  div.append( "svg" )
                       .attr( "width", 260 )
                       .attr( "height", 14 )
                     .append( "g" )
                       .attr( "class", "key" )
                       .attr( "transform", "translate( 10, 0 )" )
                       .call( d3.svg.axis()
                              .tickFormat( d3.format( $.plus + '.0f' ) )
                              .tickValues( $.domain )
                                .tickSize( 3 )
                                   .scale( x )
                          );
                }


  this.search = function() {

                  var
                        // Create the search control
                        div = d3.select( ".leaflet-top.leaflet-left" ).append( "div" )
                                  .attr( "class", "search leaflet-control" ),

                        // Create the search field
                        search = div.append( "input" )
                                      .attr( "type", "text" )
                                      .attr( "id", "field" )
                                      .attr( "placeholder", "Commune ou code postal" ),

                        // Initialize an empty list for autocompelte
                        list = [];

                  // Disable click propagation to make clicks work
                  L.DomEvent.disableClickPropagation( div.node() );
                  L.DomEvent.on( div.node(), 'mousewheel', L.DomEvent.stopPropagation );

                  // Create an autocomplete list
                  for ( var c in $.data ) {
                    $.data[c].x && list.push( $.data[c].name + " ( " + $.data[c].postcode + " )" );
                  }

                  // Use Awesomplete to autocomplete search input
                  new Awesomplete( document.getElementById( "field" ), { list: list, maxItems: 20 });

                  // Search for the commune when selected
                  search.on( 'awesomplete-selectcomplete', function() {

                    // Store the value before the loop
                    var value = search.node().value;

                    // Look for the right commune
                    for ( var i in $.data ) {
                      if ( value == $.data[i].name + " ( " + $.data[i].postcode + " )" ) {

                        // Open popup
                        $.popup( i );

                        // Clear the search field
                        search.node().value = '';

                        // Jump to the selected commune
                        map.flyTo( L.latLng( $.data[i].y, $.data[i].x ), 9 );

                        break;
                      }
                    }
                  });
                }


   this.popup = function( i ) {

                  // Prevent load() to reopen a closed popup
                  map.on( "popupclose", function() { delete $.i } );
                  $.i = i;

                  // Open a popup showing communes name and data
                  map.openPopup(L.popup().setLatLng( L.latLng( $.data[i].y, $.data[i].x ) )
                                         .setContent( '<b>' + $.data[i].name + '</b><br />'
                                                      + $.title + ' : '
                                                      + $.data[i][ $.stat ].replace( ".", "," ) + ' '
                                                      + $.unit) );

                }


  this.select = function() {

                  // Create a control layer and disable click events
                  var control = L.control.layers().addTo( map );
                  control._onInputClick = function () {};

                  // Create radio for each available layer
                  for ( var i = 1; i < arg.length; i++ ) {

                    var

                          div = d3.select( ".leaflet-control-layers-base" ).append( "div" ),

                          input = div.append( "input" )
                                       .attr( "type", "radio" )
                                       .attr( "name", "select" )
                                       .attr( "id", "select" + i )
                                       .attr( i==1 ? "checked" : "unchecked", "" ),

                          span = div.append( "span" ).text( ' ' + arg[i].title );

                    // Detect selected layer and load it
                    div.on( "click", function() {
                      d3.select( this ).select( "input" ).node().checked = true;
                      $.load( arg[ d3.select( this ).select( "input" ).attr( "id" ).slice( 6 ) ] );
                    });

                  }

                }

    var $ = this, arg = arguments;
    $.init();

}
