# Task: gen-dict-char_count-1149 | Score: 100% | 2026-02-13T14:42:13.596553

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))