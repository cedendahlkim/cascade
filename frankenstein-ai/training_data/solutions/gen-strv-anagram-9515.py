# Task: gen-strv-anagram-9515 | Score: 100% | 2026-02-15T12:59:56.373520

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')