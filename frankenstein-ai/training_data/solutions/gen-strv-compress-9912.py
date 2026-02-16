# Task: gen-strv-compress-9912 | Score: 100% | 2026-02-13T13:40:09.875033

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))