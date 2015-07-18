.PHONY: all reset dep can com clean
.SILENT: all reset dep can com clean

all: reset dep can com clean

reset: 
	rm -rf tmp topojson

dep:
	mkdir -p tmp topojson
	[ -f tmp/dep.zip ] || curl -o tmp/dep.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/departements-20140306-5m-shp.zip'
	unzip -oq tmp/dep -d tmp
	mapshaper -i tmp/departements-20140306-5m.shp -simplify visvalingam 1% \
			  -each 'insee=code_insee, delete nom, delete code_insee, delete wikipedia, delete nuts3' \
			  -o force id-field=insee format=topojson topojson/dep.json

can: 
	mkdir -p tmp topojson
	[ -f tmp/can.zip ] || curl -o tmp/can.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/cantons-2015-shp.zip'
	unzip -oq tmp/can -d tmp
	mapshaper -i tmp/cantons_2015.shp \
			  -each 'insee=ref, delete ref, delete bureau, delete canton, delete dep, delete jorf, delete population, delete Nom_1, delete wikipedia' \
			  -o force id-field=insee format=geojson tmp/cantons.json

	[ -f tmp/com.zip ] || curl -o tmp/com.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/communes-20150101-5m-shp.zip'
	unzip -oq tmp/com -d tmp
	mapshaper -i tmp/communes-20150101-5m.shp \
			  -filter "['75101','75102','75103','75104','75105','75106','75107','75108','75109','75110','75111','75112','75113','75114','75115','75116','75117','75118','75119','75120','69381','69382','69383','69384','69385','69386','69387','69388','69389','69003','69029','69033','69034','69040','69044','69046','69271','69063','69273','69068','69069','69071','69072','69275','69081','69276','69085','69087','69088','69089','69278','69091','69096','69100','69279','69116','69117','69127','69282','69283','69284','69142','69143','69149','69152','69153','69163','69286','69168','69191','69194','69202','69199','69204','69205','69207','69290','69233','69292','69293','69296','69244','69250','69256','69259','69260','69266'].indexOf(insee)>=0" \
			  -each 'insee="0"+insee, delete surf_m2, delete wikipedia' \
			  -o force id-field=insee format=geojson tmp/metropoles.json

	mapshaper -i tmp/metropoles.json tmp/cantons.json combine-files -merge-layers -simplify visvalingam 1% \
			  -o force id-field=insee format=topojson topojson/can.json

com:
	mkdir -p tmp topojson
	[ -f tmp/com.zip ] || curl -o tmp/com.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/communes-20150101-5m-shp.zip'
	unzip -oq tmp/com -d tmp
	for i in 0{1..9} {10..19} 2A 2B {21..95}; do \
		mapshaper -i tmp/communes-20150101-5m.shp -each "delete surf_m2, delete wikipedia" \
				  -filter "insee.substring(0,2) == '$$i'" -o force id-field=insee format=topojson "topojson/com$$i.json" ; done

clean:
	rm -rf tmp
