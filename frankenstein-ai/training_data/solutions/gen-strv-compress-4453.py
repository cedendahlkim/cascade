# Task: gen-strv-compress-4453 | Score: 100% | 2026-02-13T19:35:09.445271

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))