# Task: gen-dict-char_count-6945 | Score: 100% | 2026-02-14T12:20:04.341295

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))