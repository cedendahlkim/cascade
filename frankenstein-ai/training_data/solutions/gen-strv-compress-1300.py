# Task: gen-strv-compress-1300 | Score: 100% | 2026-02-13T18:33:51.650885

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))