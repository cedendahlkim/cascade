# Task: gen-strv-compress-7501 | Score: 100% | 2026-02-13T18:57:48.241009

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))