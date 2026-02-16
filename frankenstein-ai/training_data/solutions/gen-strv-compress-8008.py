# Task: gen-strv-compress-8008 | Score: 100% | 2026-02-13T18:51:22.431218

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))