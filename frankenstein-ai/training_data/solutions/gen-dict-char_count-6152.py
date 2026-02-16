# Task: gen-dict-char_count-6152 | Score: 100% | 2026-02-15T07:45:50.260775

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))