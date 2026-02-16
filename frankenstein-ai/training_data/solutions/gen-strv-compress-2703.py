# Task: gen-strv-compress-2703 | Score: 100% | 2026-02-14T13:26:05.912507

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))