# Task: gen-strv-compress-6649 | Score: 100% | 2026-02-13T12:25:52.055648

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))