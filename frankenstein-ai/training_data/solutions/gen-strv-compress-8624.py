# Task: gen-strv-compress-8624 | Score: 100% | 2026-02-15T08:23:38.598922

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))