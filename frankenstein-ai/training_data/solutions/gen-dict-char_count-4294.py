# Task: gen-dict-char_count-4294 | Score: 100% | 2026-02-15T10:29:14.817547

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))