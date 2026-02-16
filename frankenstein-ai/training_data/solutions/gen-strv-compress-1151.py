# Task: gen-strv-compress-1151 | Score: 100% | 2026-02-15T09:51:01.817973

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))