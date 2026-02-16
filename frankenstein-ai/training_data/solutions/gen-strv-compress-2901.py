# Task: gen-strv-compress-2901 | Score: 100% | 2026-02-14T13:41:05.477880

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))