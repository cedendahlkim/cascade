# Task: gen-strv-compress-1679 | Score: 100% | 2026-02-13T20:50:22.005722

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))