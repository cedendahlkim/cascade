# Task: gen-dict-char_count-6621 | Score: 100% | 2026-02-13T09:20:48.628035

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))