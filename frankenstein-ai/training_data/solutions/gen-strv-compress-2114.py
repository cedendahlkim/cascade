# Task: gen-strv-compress-2114 | Score: 100% | 2026-02-13T13:47:34.352796

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))