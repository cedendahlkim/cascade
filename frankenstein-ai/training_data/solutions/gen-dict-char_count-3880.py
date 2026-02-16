# Task: gen-dict-char_count-3880 | Score: 100% | 2026-02-13T12:26:40.649748

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))