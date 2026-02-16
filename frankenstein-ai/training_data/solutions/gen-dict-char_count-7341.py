# Task: gen-dict-char_count-7341 | Score: 100% | 2026-02-15T10:28:54.586146

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))