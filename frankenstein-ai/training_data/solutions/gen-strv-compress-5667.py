# Task: gen-strv-compress-5667 | Score: 100% | 2026-02-13T09:17:06.108724

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))