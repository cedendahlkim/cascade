# Task: gen-dict-char_count-1122 | Score: 100% | 2026-02-13T19:05:31.932151

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))