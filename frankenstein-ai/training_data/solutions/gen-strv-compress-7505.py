# Task: gen-strv-compress-7505 | Score: 100% | 2026-02-15T09:50:36.287169

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))