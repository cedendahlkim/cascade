# Task: gen-strv-anagram-4829 | Score: 100% | 2026-02-15T08:06:38.188587

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')