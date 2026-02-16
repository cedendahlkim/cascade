# Task: gen-strv-anagram-7787 | Score: 100% | 2026-02-15T08:05:41.499087

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')