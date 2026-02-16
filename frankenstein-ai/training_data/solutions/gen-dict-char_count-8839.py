# Task: gen-dict-char_count-8839 | Score: 100% | 2026-02-15T10:09:33.079486

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))