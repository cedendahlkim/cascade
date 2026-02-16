# Task: gen-strv-compress-6466 | Score: 100% | 2026-02-13T13:46:51.325026

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))