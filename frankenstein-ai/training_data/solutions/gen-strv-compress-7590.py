# Task: gen-strv-compress-7590 | Score: 100% | 2026-02-14T13:25:53.803478

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))