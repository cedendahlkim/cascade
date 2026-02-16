# Task: gen-strv-compress-7713 | Score: 100% | 2026-02-13T12:17:46.989071

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))