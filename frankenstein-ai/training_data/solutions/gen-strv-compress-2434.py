# Task: gen-strv-compress-2434 | Score: 100% | 2026-02-15T08:24:16.066489

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))