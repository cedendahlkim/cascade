# Task: gen-strv-compress-2662 | Score: 100% | 2026-02-13T09:20:47.687139

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))