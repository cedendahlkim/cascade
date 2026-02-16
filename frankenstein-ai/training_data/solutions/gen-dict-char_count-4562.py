# Task: gen-dict-char_count-4562 | Score: 100% | 2026-02-15T07:59:44.019029

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))