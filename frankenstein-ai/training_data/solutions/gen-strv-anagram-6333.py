# Task: gen-strv-anagram-6333 | Score: 100% | 2026-02-15T08:15:05.725081

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')