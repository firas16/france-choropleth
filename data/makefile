.PHONY: reset stats tmp geo clean

all: reset stats tmp geo clean

reset:
	rm -rf _tmp geo stats

tmp:
	mkdir -p _tmp
	curl -o _tmp/cog.zip 'http://www.insee.fr/fr/methodes/nomenclatures/cog/telechargement/2015/txt/comsimp2015.zip'
	curl -o _tmp/can.txt 'http://www.insee.fr/fr/methodes/nomenclatures/cog/telechargement/2015/txt/canton2015.txt'
	curl -o _tmp/cc.zip  'http://www.insee.fr/fr/ppp/bases-de-donnees/donnees-detaillees/base-cc-resume-stat/base-cc-resume-15.zip'
	curl -o _tmp/com.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/communes-20150101-5m-shp.zip'
	curl -o _tmp/cp.csv 'https://www.data.gouv.fr/s/resources/base-officielle-des-codes-postaux/20141106-120608/code_postaux_v201410.csv'
	unzip -oq "_tmp/*.zip" -d _tmp

stats: tmp
	mkdir -p stats geo
	mapshaper -i _tmp/communes-20150101-5m.shp -each 'id=insee, x = $$.centroidX, y = $$.centroidY' -o drop-table force id-field=id _tmp/centroids.csv
	python _generate.py

geo: stats
	mapshaper -i _tmp/communes-20150101-5m.shp -join _tmp/cog.csv keys=insee,id:str -each 'id = canton || insee' -rename-layers can -dissolve id -simplify visvalingam 1% -o drop-table force id-field=id geo/france.topojson

clean:
	rm -rf _tmp
