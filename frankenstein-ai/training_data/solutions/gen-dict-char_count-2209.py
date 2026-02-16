# Task: gen-dict-char_count-2209 | Score: 100% | 2026-02-13T18:28:53.548258

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))