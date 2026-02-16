# Task: gen-dict-char_count-9760 | Score: 100% | 2026-02-13T09:22:37.061356

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))