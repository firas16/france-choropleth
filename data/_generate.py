from pandas import *

# Cantons data from ‘code officiel geographique’ database
cog = read_csv("_tmp/comsimp2015.txt", sep="\t", encoding="iso-8859-1", dtype=str)
cog = DataFrame(data={'canton':cog.DEP+"-"+cog.CT,'insee':cog.DEP+cog.COM}).set_index('insee')

# Load ‘chiffres clefs’ database
cc = read_excel("_tmp/base-cc-resume-15.xls", sheetname=[0,1], header=5, index_col=[0])
cc = concat([cc[0],cc[1]])

# Link communes to cantons
cc = concat([cc, cog[cog.canton.str[-2:].fillna("99").astype('int') < 50]], axis=1).dropna(subset=["LIBGEO"])
cc.dropna(subset=['canton']).to_csv('_tmp/cog.csv', columns = ['canton'], index_label = 'insee')

# Density and opacity
df = concat([cc,cc.groupby('canton').sum(),cc])
df['opacity'] = qcut(df.P12_POP/df.SUPERF,100, labels=False)*.8+10
df.to_csv('stats/density.csv', columns = ['opacity'], index_label='insee', float_format='%.0f')
