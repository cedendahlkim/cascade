# Task: gen-dict-char_count-4912 | Score: 100% | 2026-02-13T09:22:38.587296

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))