# Task: gen-strv-compress-5999 | Score: 100% | 2026-02-15T08:47:25.770015

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))