# Task: gen-strv-compress-8345 | Score: 100% | 2026-02-13T10:39:35.654545

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))