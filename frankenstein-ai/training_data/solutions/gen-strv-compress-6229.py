# Task: gen-strv-compress-6229 | Score: 100% | 2026-02-15T08:05:10.160772

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))