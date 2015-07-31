# Create folders
mkdir -p _tmp geo stats

# Download files
[ -f _tmp/dep.zip ] || curl -o _tmp/dep.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/departements-20140306-5m-shp.zip'
[ -f _tmp/com.zip ] || curl -o _tmp/com.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/communes-20150101-5m-shp.zip'
[ -f _tmp/cog.zip ] || curl -o _tmp/cog.zip 'http://www.insee.fr/fr/methodes/nomenclatures/cog/telechargement/2015/txt/comsimp2015.zip'
[ -f _tmp/can.txt ] || curl -o _tmp/can.txt 'http://www.insee.fr/fr/methodes/nomenclatures/cog/telechargement/2015/txt/canton2015.txt'
[ -f _tmp/cc.zip ]  || curl -o _tmp/cc.zip  'http://www.insee.fr/fr/ppp/bases-de-donnees/donnees-detaillees/base-cc-resume-stat/base-cc-resume-15.zip'

# Unzip communes
unzip -oq "_tmp/*.zip" -d _tmp

# Process stats
python3 _generate.py

# Generate TopoJSON
mapshaper -i _tmp/departements-20140306-5m.shp -rename-layers dep -simplify visvalingam 1% -dissolve code_insee -o drop-table force id-field=code_insee geo/dep.topojson
mapshaper _tmp/communes-20150101-5m.shp -join _tmp/cog.csv keys=insee,insee:str -each 'insee = canton || insee, obj = insee.slice(0,2)' -rename-layers can -split obj -dissolve insee -simplify visvalingam 1% -o drop-table force id-field=insee geo/can.topojson
mapshaper -i _tmp/communes-20150101-5m.shp -simplify visvalingam 5% -o force id-field=insee _tmp/communes.topojson ; \
for i in 0{1..9} {10..19} 2A 2B {21..95}; do \
mapshaper -i _tmp/communes.topojson -rename-layers "com-$i" -filter "insee.substring(0,2) == '$i'" -dissolve insee -o drop-table force id-field=insee geo/"com$i.topojson"; done

# Remove temporary folder
rm -rf _tmp
