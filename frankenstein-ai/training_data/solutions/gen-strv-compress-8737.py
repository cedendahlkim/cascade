# Task: gen-strv-compress-8737 | Score: 100% | 2026-02-17T20:14:19.436713

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))