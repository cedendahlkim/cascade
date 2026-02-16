# Task: gen-dict-char_count-5983 | Score: 100% | 2026-02-13T09:43:31.166793

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))