# Task: gen-strv-compress-6342 | Score: 100% | 2026-02-15T08:48:47.398118

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))