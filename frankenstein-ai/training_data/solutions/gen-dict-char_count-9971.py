# Task: gen-dict-char_count-9971 | Score: 100% | 2026-02-13T10:01:48.188879

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))