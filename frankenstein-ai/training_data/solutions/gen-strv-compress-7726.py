# Task: gen-strv-compress-7726 | Score: 100% | 2026-02-14T12:37:14.557819

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))