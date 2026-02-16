# Task: gen-strv-compress-3921 | Score: 100% | 2026-02-13T16:47:54.277536

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))