# Task: gen-strv-compress-9210 | Score: 100% | 2026-02-13T19:06:02.953106

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))