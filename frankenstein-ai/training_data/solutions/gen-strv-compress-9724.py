# Task: gen-strv-compress-9724 | Score: 100% | 2026-02-13T13:10:48.956022

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))