# Task: gen-strv-compress-5839 | Score: 100% | 2026-02-13T18:40:00.353585

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))