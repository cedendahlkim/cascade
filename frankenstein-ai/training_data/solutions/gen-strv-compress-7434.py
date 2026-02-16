# Task: gen-strv-compress-7434 | Score: 100% | 2026-02-13T18:28:59.699178

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))