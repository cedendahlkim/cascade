# Task: gen-dict-char_count-9901 | Score: 100% | 2026-02-15T07:59:43.622174

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))