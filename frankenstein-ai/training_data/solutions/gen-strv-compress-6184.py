# Task: gen-strv-compress-6184 | Score: 100% | 2026-02-13T14:18:34.949319

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))