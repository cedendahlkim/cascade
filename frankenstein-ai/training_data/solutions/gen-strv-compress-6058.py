# Task: gen-strv-compress-6058 | Score: 100% | 2026-02-13T16:26:43.849276

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))