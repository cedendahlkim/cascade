# Task: gen-strv-compress-6604 | Score: 100% | 2026-02-13T10:14:37.839241

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))