# Task: gen-strv-compress-4947 | Score: 100% | 2026-02-13T19:05:35.531588

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))