# Task: gen-dict-char_count-2539 | Score: 100% | 2026-02-14T12:13:36.383457

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))