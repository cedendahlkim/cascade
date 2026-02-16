# Task: gen-strv-compress-1080 | Score: 100% | 2026-02-13T15:46:31.682658

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))