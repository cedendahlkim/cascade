# Task: gen-strv-compress-4651 | Score: 100% | 2026-02-13T18:46:31.775752

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))