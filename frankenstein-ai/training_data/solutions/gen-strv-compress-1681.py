# Task: gen-strv-compress-1681 | Score: 100% | 2026-02-13T12:17:44.643442

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))