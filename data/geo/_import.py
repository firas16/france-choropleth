import io, os, csv, requests, tarfile, zipfile, subprocess, shutil

shp = [["http://osm13.openstreetmap.fr/~cquest/openfla/export/", "departements-20140306-5m", "-shp.zip", "departements"],
         ["http://osm13.openstreetmap.fr/~cquest/openfla/export/", "cantons-2015",             "-shp.zip", "cantons"]]

def process(shp):
  for f in shp:

    print('Processing '+f[1]+'...')
    url = requests.get(f[0]+f[1]+f[2])

    if f[2][-7:] == ".tar.gz":
      tarfile.open(mode= "r:gz", fileobj = io.BytesIO(url.content)).extractall(path="./shp")
    elif f[2][-4:] == ".zip":
      zipfile.ZipFile(io.BytesIO(url.content)).extractall(path="./shp")

    subprocess.call(['mapshaper', '-i', './shp/*.shp', '-simplify', 'visvalingam', '1%',
                     '-o', 'force', 'id-field=insee', 'drop-table', 
                     'format=topojson', 'topo/'+f[3]+'.json'])

    shutil.rmtree('shp')

process(shp)

