# Task: gen-strv-compress-8573 | Score: 100% | 2026-02-15T08:14:25.797315

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))