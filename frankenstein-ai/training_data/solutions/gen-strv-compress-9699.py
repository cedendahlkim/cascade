# Task: gen-strv-compress-9699 | Score: 100% | 2026-02-14T12:13:49.185768

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))