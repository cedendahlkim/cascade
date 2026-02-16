# Task: gen-strv-compress-8975 | Score: 100% | 2026-02-14T12:02:46.941447

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))