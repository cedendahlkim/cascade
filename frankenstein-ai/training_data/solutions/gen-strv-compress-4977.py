# Task: gen-strv-compress-4977 | Score: 100% | 2026-02-15T09:01:10.929501

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))