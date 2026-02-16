# Task: gen-strv-compress-2866 | Score: 100% | 2026-02-15T10:28:48.364028

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))