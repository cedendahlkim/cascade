# Task: gen-strv-anagram-6123 | Score: 100% | 2026-02-15T08:14:26.171519

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')