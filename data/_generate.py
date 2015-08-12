from pandas import *
from numpy import *


# Load cantons from ‘code officiel geographique’ database
cog = read_csv("_tmp/comsimp2015.txt", sep="\t", encoding="iso-8859-1", dtype=str)
cog = DataFrame(data={'canton':cog.DEP+"-"+cog.CT,'id':cog.DEP+cog.COM}).set_index('id')

can = read_csv("_tmp/can.txt", sep="\t", encoding="iso-8859-1", dtype=str)
can = DataFrame(data={'name':can.NCCENR,'canton':can.DEP+"-"+can.CANTON}).set_index('canton')


# Load communes from ‘chiffres clefs’ database
com = read_excel("_tmp/base-cc-resume-15.xls", sheetname=[0,1], header=5, index_col=[0])
com[1].index = com[1].index.astype('str')
com = concat([com[0],com[1]]).rename(columns = {'LIBGEO':'name'})


# Link communes to cantons
com = concat([com, cog[cog.canton.str[-2:].fillna("99").astype('int') < 50]], axis=1).dropna(subset=["name"])
com.canton[(com.P12_POP/com.SUPERF > 75) | (com.P12_POP > 1000)] = nan
com.dropna(subset=['canton']).to_csv('_tmp/cog.csv', columns = ['canton'], index_label = 'id')


# Generate base data (names, centroids, density)
xy = read_csv("_tmp/centroids.csv").set_index('id')

cp = read_csv("_tmp/cp.csv", sep=";", encoding="iso-8859-1", dtype=str)
cp = DataFrame(data={'id':cp["code commune INSEE"], 'postcode':cp["code postal"]}).drop_duplicates(subset='id', take_last=True).set_index('id')

df = concat([com, concat([com.groupby('canton').sum(),can], axis=1).dropna(subset=["name","P12_POP"]) ])
df = concat([df, xy, cp], axis=1).dropna(subset=["name","P12_POP"])

df['density'] = (df.P12_POP/df.SUPERF).map(lambda x: '%.0f' % x)

df.to_csv('geo/data.csv', columns = ['postcode','name','density','x','y'], index_label='id', float_format='%.2f')


# Unemployement
df['unemployement'] = df.P12_CHOM1564/df.P12_POP1564*100
df.to_csv('stats/unemployement.csv', columns = ['unemployement'], index_label='id', float_format='%.1f')


# Population growth rate (2007-2012)
df['growth'] = ((df.P12_POP/df.P07_POP)**(1/5)-1)*100
df.to_csv('stats/growth.csv', columns = ['growth'], index_label='id', float_format='%.1f')


# Second home
df['second'] = df.P12_RSECOCC/df.P12_LOG*100
df.to_csv('stats/second.csv', columns = ['second'], index_label='id', float_format='%.1f')


# Empty houses
df['empty'] = df.P12_LOGVAC/df.P12_LOG*100
df.to_csv('stats/empty.csv', columns = ['empty'], index_label='id', float_format='%.1f')
