# Task: gen-strv-compress-1893 | Score: 100% | 2026-02-15T09:33:59.092979

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))