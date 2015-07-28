# Create temporary folder
mkdir -p tmp

# Download files
[ -f tmp/dep.zip ] || curl -o tmp/dep.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/departements-20140306-5m-shp.zip'
[ -f tmp/can.zip ] || curl -o tmp/can.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/cantons-2015-shp.zip'
[ -f tmp/com.zip ] || curl -o tmp/com.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/communes-20150101-5m-shp.zip'
[ -f tmp/cog.zip ] || curl -o tmp/cog.zip 'http://www.insee.fr/fr/methodes/nomenclatures/cog/telechargement/2015/txt/comsimp2015.zip'

# Unzip communes
unzip -oq "tmp/*.zip" -d tmp

# Generate departements
mapshaper -i tmp/departements-20140306-5m.shp -rename-layers dep -simplify visvalingam 1% -dissolve code_insee -o drop-table force id-field=code_insee tmp/dep.topojson

# Communes to cantons correspondence
iconv -f iso-8859-15 -t utf-8 tmp/comsimp2015.txt > tmp/comsimp2015-utf8.txt
sed 's/	/,/g' tmp/comsimp2015-utf8.txt > tmp/comsimp2015.csv
awk -F, '{OFS=","; print $4$5,$4"-"$7}' tmp/comsimp2015.csv > tmp/cog.txt
sed '/-$/d;1s/.*/insee,canton/' tmp/cog.txt > tmp/cog.csv

# Generate cantons
mapshaper tmp/communes-20150101-5m.shp -join tmp/cog.csv keys=insee,insee:str -each 'insee = canton || insee, obj = insee.slice(0,2)' -rename-layers can -split obj -dissolve insee -simplify visvalingam 1% -o drop-table force id-field=insee can.topojson

# Generate communes
mapshaper -i tmp/communes-20150101-5m.shp -simplify visvalingam 10% -o force id-field=insee tmp/communes.topojson ; \
for i in 0{1..9} {10..19} 2A 2B {21..95}; do \
mapshaper -i tmp/communes.topojson -rename-layers "com-$i" -filter "insee.substring(0,2) == '$i'" -dissolve insee -o drop-table force id-field=insee "com$i.topojson"; done

# Generate name list
mapshaper -i tmp/cantons_2015.shp -each 'insee=ref.substring(1,6), name=nom, delete nom, delete ref, delete bureau, delete canton, delete dep, delete jorf, delete population, delete Nom_1, delete wikipedia' -o force tmp/can.csv
mapshaper -i tmp/communes-20150101-5m.shp -each 'delete obj, delete wikipedia, delete surf_m2' -merge-layers -o force tmp/com.csv
awk 'FNR==1 && NR!=1{next;}{print}' tmp/*.csv > names.csv

# Remove temporary folder
rm -rf tmp
