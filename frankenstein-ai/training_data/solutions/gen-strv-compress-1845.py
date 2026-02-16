# Task: gen-strv-compress-1845 | Score: 100% | 2026-02-15T07:53:46.380480

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))