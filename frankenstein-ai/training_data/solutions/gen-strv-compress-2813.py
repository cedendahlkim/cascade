# Task: gen-strv-compress-2813 | Score: 100% | 2026-02-13T12:19:10.910904

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))