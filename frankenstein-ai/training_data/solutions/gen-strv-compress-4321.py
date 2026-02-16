# Task: gen-strv-compress-4321 | Score: 100% | 2026-02-15T08:14:37.401046

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))