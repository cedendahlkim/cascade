# Task: gen-dict-char_count-1482 | Score: 100% | 2026-02-15T10:28:54.947702

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))