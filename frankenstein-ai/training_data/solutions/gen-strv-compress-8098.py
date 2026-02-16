# Task: gen-strv-compress-8098 | Score: 100% | 2026-02-13T17:35:52.685768

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))