# Task: gen-dict-char_count-7963 | Score: 100% | 2026-02-13T09:22:35.613463

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))