# Task: gen-strv-compress-8140 | Score: 100% | 2026-02-15T10:29:00.141214

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))