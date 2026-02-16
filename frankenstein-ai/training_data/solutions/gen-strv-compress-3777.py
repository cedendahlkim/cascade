# Task: gen-strv-compress-3777 | Score: 100% | 2026-02-14T13:25:54.014491

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))