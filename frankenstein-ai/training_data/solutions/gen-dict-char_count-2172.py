# Task: gen-dict-char_count-2172 | Score: 100% | 2026-02-15T09:35:25.210174

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))