# Task: gen-strv-compress-2266 | Score: 100% | 2026-02-13T09:13:10.891403

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))