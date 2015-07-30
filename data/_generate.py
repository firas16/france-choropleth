from pandas import *

# Load ‘chiffres clefs’ database
com = read_excel("_tmp/base-cc-resume-15.xls", sheetname=[0,1], header=5, index_col=[0])
com = concat([com[0],com[1]])

# Concat cantons
com = concat([com, read_csv("_tmp/cog.csv", index_col=[0])], axis=1).dropna(subset=["LIBGEO"])

# Group by cantons
can = concat([com,com.groupby('canton').sum()])

# Density and opacity
df = concat([can,com])
df['density'] = df.P12_POP/df.SUPERF
df['opacity'] = qcut(df.density,100, labels=False)*.85+.05

# Export
df.to_csv('stats/density.csv', columns = ['opacity'], index_label='insee', float_format='%.0f')
