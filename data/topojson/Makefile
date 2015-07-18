.PHONY: all reset dep can com clean
.SILENT: all reset dep can com clean

all: reset dep can com clean

reset: 
	rm -rf tmp && find . -name "*.topojson" -exec rm -rf {} \;

dep:
	mkdir -p tmp
	[ -f tmp/dep.zip ] || curl -o tmp/dep.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/departements-20140306-5m-shp.zip'
	unzip -oq tmp/dep -d tmp
	mapshaper -i tmp/departements-20140306-5m.shp -rename-layers dep -o force id-field=code_insee tmp/dep.topojson
	mapshaper -i tmp/dep.topojson -simplify visvalingam 1% -o drop-table force id-field=code_insee dep.topojson

can: 
	mkdir -p tmp
	[ -f tmp/can.zip ] || curl -o tmp/can.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/cantons-2015-shp.zip'
	[ -f tmp/com.zip ] || curl -o tmp/com.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/communes-20150101-5m-shp.zip'
	unzip -oq tmp/can -d tmp
	unzip -oq tmp/com -d tmp
	mapshaper -i tmp/cantons_2015.shp -rename-layers can -each 'insee=ref.substring(1,3)+"0"+ref.substring(4,6), obj=ref.substring(1,3), delete ref, delete bureau, delete canton, delete dep, delete jorf, delete population, delete Nom_1, delete wikipedia' -o force id-field=insee tmp/can.topojson
	mapshaper -i tmp/communes-20150101-5m.shp -rename-layers can -each 'obj=insee.substring(0,2), delete surf_m2, delete wikipedia' -filter "['75101','75102','75103','75104','75105','75106','75107','75108','75109','75110','75111','75112','75113','75114','75115','75116','75117','75118','75119','75120','69381','69382','69383','69384','69385','69386','69387','69388','69389','69003','69029','69033','69034','69040','69044','69046','69271','69063','69273','69068','69069','69071','69072','69275','69081','69276','69085','69087','69088','69089','69278','69091','69096','69100','69279','69116','69117','69127','69282','69283','69284','69142','69143','69149','69152','69153','69163','69286','69168','69191','69194','69202','69199','69204','69205','69207','69290','69233','69292','69293','69296','69244','69250','69256','69259','69260','69266'].indexOf(insee)>=0" -o force id-field=insee tmp/metropoles.topojson
	mapshaper -i tmp/metropoles.topojson tmp/can.topojson combine-files -split obj -o force id-field=insee tmp/can.topojson
	mapshaper -i tmp/can.topojson -simplify visvalingam 1% -o drop-table force id-field=insee can.topojson

com:
	mkdir -p tmp
	[ -f tmp/com.zip ] || curl -o tmp/com.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/communes-20150101-5m-shp.zip'
	unzip -oq tmp/com -d tmp
	for i in 0{1..9} {10..19} 2A 2B {21..95}; do \
	mapshaper -i tmp/communes-20150101-5m.shp -rename-layers "com-$$i" -simplify visvalingam 10% -filter "insee.substring(0,2) == '$$i'" -o force id-field=insee "tmp/com$$i.topojson" ; \
	mapshaper -i "tmp/com$$i.topojson" -o drop-table force id-field=insee "com$$i.topojson"; done

clean:
	rm -rf tmp
