# Task: gen-strv-compress-6547 | Score: 100% | 2026-02-13T15:46:22.275476

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))