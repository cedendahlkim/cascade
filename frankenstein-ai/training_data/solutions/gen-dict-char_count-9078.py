# Task: gen-dict-char_count-9078 | Score: 100% | 2026-02-15T10:09:51.803538

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))