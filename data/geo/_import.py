import io, os, csv, requests, tarfile, subprocess, shutil

source = 'http://export.openstreetmap.fr/contours-administratifs/'

files = list(csv.reader(open( '_source.csv' ),skipinitialspace=1))

for f in files:

  print('Reading '+f[1]+'...')
  url = requests.get(source+f[0]+f[1]+f[2]+'.tar.gz')

  tarfile.open(mode= "r:gz", fileobj = io.BytesIO(url.content)).extractall(path="./shp")

  for i in f[4]:
    subprocess.call(['mapshaper', '-i', './shp/'+f[1]+'.shp', 
                      '-simplify', 'visvalingam', i+'%', 
                      '-o', 'force', 'format=topojson', 'topo/'+f[3]+'-'+i+'.json'],
                      stdout=open(os.devnull, 'w'), stderr=subprocess.STDOUT)

  shutil.rmtree('shp')
