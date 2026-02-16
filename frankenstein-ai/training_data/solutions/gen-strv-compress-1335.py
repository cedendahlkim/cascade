# Task: gen-strv-compress-1335 | Score: 100% | 2026-02-15T12:03:39.367347

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))