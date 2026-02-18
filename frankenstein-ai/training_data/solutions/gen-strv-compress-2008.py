# Task: gen-strv-compress-2008 | Score: 100% | 2026-02-17T20:34:57.872565

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))