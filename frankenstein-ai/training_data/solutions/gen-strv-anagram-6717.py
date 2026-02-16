# Task: gen-strv-anagram-6717 | Score: 100% | 2026-02-13T12:26:43.767600

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')