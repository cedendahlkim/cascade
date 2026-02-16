# Task: gen-strv-compress-9707 | Score: 100% | 2026-02-13T11:06:29.304414

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))