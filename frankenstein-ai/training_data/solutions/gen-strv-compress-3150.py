# Task: gen-strv-compress-3150 | Score: 100% | 2026-02-13T18:20:36.305485

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))