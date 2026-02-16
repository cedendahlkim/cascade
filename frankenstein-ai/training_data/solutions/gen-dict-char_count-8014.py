# Task: gen-dict-char_count-8014 | Score: 100% | 2026-02-13T11:23:17.621367

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))