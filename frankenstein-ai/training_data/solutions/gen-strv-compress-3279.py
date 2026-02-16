# Task: gen-strv-compress-3279 | Score: 100% | 2026-02-13T09:17:04.676333

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))