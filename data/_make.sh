# Create temporary folder
mkdir -p _tmp

# Download files
[ -f _tmp/dep.zip ] || curl -o _tmp/dep.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/departements-20140306-5m-shp.zip'
[ -f _tmp/can.zip ] || curl -o _tmp/can.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/cantons-2015-shp.zip'
[ -f _tmp/com.zip ] || curl -o _tmp/com.zip 'http://osm13.openstreetmap.fr/~cquest/openfla/export/communes-20150101-5m-shp.zip'
[ -f _tmp/cog.zip ] || curl -o _tmp/cog.zip 'http://www.insee.fr/fr/methodes/nomenclatures/cog/telechargement/2015/txt/comsimp2015.zip'

# Unzip communes
unzip -oq "_tmp/*.zip" -d _tmp

# Generate departements
mapshaper -i _tmp/departements-20140306-5m.shp -rename-layers dep -simplify visvalingam 1% -dissolve code_insee -o drop-table force id-field=code_insee geo/dep.topojson

# Communes to cantons correspondence
iconv -f iso-8859-15 -t utf-8 _tmp/comsimp2015.txt > _tmp/comsimp2015-utf8.txt
sed 's/	/,/g' _tmp/comsimp2015-utf8.txt > _tmp/comsimp2015.csv
awk -F, '{OFS=","; print $4$5,$4"-"$7}' _tmp/comsimp2015.csv > _tmp/cog.txt
sed '/-$/d;/-9[0-9]$/d;1s/.*/insee,canton/' _tmp/cog.txt > _tmp/cog.csv

# Generate cantons
mapshaper _tmp/communes-20150101-5m.shp -join _tmp/cog.csv keys=insee,insee:str -each 'insee = canton || insee, obj = insee.slice(0,2)' -rename-layers can -split obj -dissolve insee -simplify visvalingam 1% -o drop-table force id-field=insee geo/can.topojson

# Generate communes
mapshaper -i _tmp/communes-20150101-5m.shp -simplify visvalingam 10% -o force id-field=insee _tmp/communes.topojson ; \
for i in 0{1..9} {10..19} 2A 2B {21..95}; do \
mapshaper -i _tmp/communes.topojson -rename-layers "com-$i" -filter "insee.substring(0,2) == '$i'" -dissolve insee -o drop-table force id-field=insee geo/"com$i.topojson"; done

# Generate name list
mapshaper -i _tmp/cantons_2015.shp -each 'insee=ref.substring(1,6), name=nom, delete nom, delete ref, delete bureau, delete canton, delete dep, delete jorf, delete population, delete Nom_1, delete wikipedia' -o force _tmp/namecan.csv
mapshaper -i _tmp/communes-20150101-5m.shp -each 'delete obj, delete wikipedia, delete surf_m2' -merge-layers -o force _tmp/namecom.csv
awk 'FNR==1 && NR!=1{next;}{print}' _tmp/name*.csv > geo/names.csv

# Remove temporary folder
rm -rf _tmp
