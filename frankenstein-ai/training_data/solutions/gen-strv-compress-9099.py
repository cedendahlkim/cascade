# Task: gen-strv-compress-9099 | Score: 100% | 2026-02-13T11:54:47.138819

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))