# Task: gen-strv-compress-6308 | Score: 100% | 2026-02-13T20:50:28.212216

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))