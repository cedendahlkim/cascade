# Task: gen-strv-compress-5154 | Score: 100% | 2026-02-15T08:14:26.543447

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))