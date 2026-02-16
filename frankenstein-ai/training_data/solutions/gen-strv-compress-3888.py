# Task: gen-strv-compress-3888 | Score: 100% | 2026-02-13T14:01:36.886148

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))