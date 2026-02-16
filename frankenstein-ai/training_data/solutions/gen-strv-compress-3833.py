# Task: gen-strv-compress-3833 | Score: 100% | 2026-02-14T12:04:24.023741

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))