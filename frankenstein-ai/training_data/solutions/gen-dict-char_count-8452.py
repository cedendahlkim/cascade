# Task: gen-dict-char_count-8452 | Score: 100% | 2026-02-13T18:46:41.417321

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))