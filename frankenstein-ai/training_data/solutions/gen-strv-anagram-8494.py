# Task: gen-strv-anagram-8494 | Score: 100% | 2026-02-15T13:30:50.085364

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')