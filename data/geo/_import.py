import io, os, csv, requests, tarfile, zipfile, subprocess, shutil

# Downloading source files

source = "http://osm13.openstreetmap.fr/~cquest/openfla/export/"
shp    = ["departements-20140306-5m", "cantons-2015", "communes-20131218-5m"]

def download(shp):
  for f in shp:
    print('Processing '+f+'...')
    url = requests.get(source+f+"-shp.zip")
    zipfile.ZipFile(io.BytesIO(url.content)).extractall(path="./shp")

download(shp)


# Processing departements

subprocess.call(['mapshaper', '-i', './shp/departements-20140306-5m.shp',
                              '-each', "insee=code_insee, delete code_insee, delete wikipedia, delete nuts3", 
                              '-simplify', 'visvalingam', '1%',
                              '-o','force', 'id-field=insee', 'format=topojson', 'topo/departements.json'])

# # Processing cantons (with missing Lyon metropole and Paris)

lyon = [69123, 69003, 69029, 69033, 69034, 69040, 69044, 69046, 69271, 69063, 69273, 69068, 69069, 69071, 69072,
        69275, 69081, 69276, 69085, 69087, 69088, 69089, 69278, 69091, 69096, 69100, 69279, 69116, 69117, 69127,
        69282, 69283, 69284, 69142, 69143, 69149, 69152, 69153, 69163, 69286, 69168, 69191, 69194, 69202, 69199,
        69204, 69205, 69207, 69290, 69233, 69292, 69293, 69296, 69244, 69250, 69256, 69259, 69260, 69266, 75056]

s = ""
for i in lyon:
  s+='insee == '+str(i)+' || '

subprocess.call(['mapshaper', '-i', './shp/communes-fla10.shp', '-filter', s[:-4],
                              '-o', 'force', 'format=shapefile', 'shp/metropoles.shp', '-info'])

subprocess.call(['mapshaper', '-i', './shp/cantons_2015.shp', 
                              '-each', "insee=ref, delete ref, delete bureau, delete canton, delete nom, delete dep, delete jorf, delete population, delete Nom_1, delete wikipedia", 
                              '-o', 'force', 'format=shapefile', 'shp/cantons.shp', '-info'])

subprocess.call(['mapshaper', '-i', './shp/metropoles.shp', './shp/cantons.shp', 'combine-files', '-merge-layers', 
                              '-simplify', 'visvalingam', '1%', 
                              '-o','force', 'id-field=insee', 'format=topojson', 'topo/cantons.json'])

# # Processing communes

subprocess.call(['mapshaper', '-i', './shp/communes-fla10.shp', 
                              '-each', "delete bureau, delete canton, delete dep, delete jorf, delete population, delete Nom_1, delete wikipedia", 
                              '-simplify', 'visvalingam', '1%', 
                              '-o','force', 'id-field=insee', 'format=topojson', 'topo/communes.json'])
shutil.rmtree('./shp')
