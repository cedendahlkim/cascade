# Task: gen-strv-compress-6514 | Score: 100% | 2026-02-15T13:01:05.274499

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))