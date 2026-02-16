# Task: gen-strv-compress-8797 | Score: 100% | 2026-02-15T13:30:49.502219

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))