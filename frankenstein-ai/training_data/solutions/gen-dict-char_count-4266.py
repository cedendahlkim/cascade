# Task: gen-dict-char_count-4266 | Score: 100% | 2026-02-13T11:33:41.549455

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))