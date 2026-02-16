# Task: gen-strv-compress-8290 | Score: 100% | 2026-02-15T12:30:41.850630

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))