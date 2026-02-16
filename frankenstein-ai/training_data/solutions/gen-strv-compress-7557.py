# Task: gen-strv-compress-7557 | Score: 100% | 2026-02-13T09:13:11.781880

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))